import { useEffect, useMemo, useState } from 'react';
import type { CSSProperties, MouseEvent, ReactNode } from 'react';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUpRight, Check, CheckCircle2, ChevronRight, ClipboardCheck, Download, Search, X } from 'lucide-react';
import operationsSource from '../../content/operations-data.json';
import portfolioSource from '../../content/portfolio-data.json';
import './operations.css';

type GuideStatus = '확정 기준' | '운영 제안' | '결정 대기';
type GuideCategory = '브랜드' | '디자인' | '콘텐츠' | '개발' | '마케팅' | '운영';
type Section = {
  id: string;
  title: string;
  body: string[];
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  checklist?: string[];
};
type Guide = {
  id: string;
  code: string;
  category: GuideCategory;
  title: string;
  summary: string;
  status: GuideStatus;
  owner: string;
  sections: Section[];
  sources?: { label: string; url: string }[];
};
type OperationsData = {
  version: string;
  updatedAt: string;
  title: string;
  summary: string;
  releaseState: string;
  confirmed: string[];
  pending: { item: string; owner: string; neededEvidence: string }[];
  guides: Guide[];
};
type PortfolioBrand = {
  slug: string;
  name: string;
  englishName: string;
  title: string;
  oneLine: string;
  hero: string;
  color: string;
  paper: string;
  boardCount: number;
  figmaUrl: string;
};

const operations = operationsSource as OperationsData;
const brands = (portfolioSource as { brands: PortfolioBrand[] }).brands;
const categories: GuideCategory[] = ['브랜드', '디자인', '콘텐츠', '개발', '마케팅', '운영'];
const statuses: GuideStatus[] = ['확정 기준', '운영 제안', '결정 대기'];
const statusClass: Record<GuideStatus, string> = {
  '확정 기준': 'ops-status-approved',
  '운영 제안': 'ops-status-proposed',
  '결정 대기': 'ops-status-pending',
};
const statusDescription: Record<GuideStatus, string> = {
  '확정 기준': '승인된 적용 범위에서 사용합니다.',
  '운영 제안': '담당자가 실행 조건을 검토합니다.',
  '결정 대기': '필요한 근거와 결정을 확인합니다.',
};
const SHOWCASE_HREF = portfolioSource.showcaseUrl;
const storyHref = (id: string) => `./?path=/docs/${id}--docs`;

function StoryLink({ id, children, className, label }: { id: string; children: ReactNode; className?: string; label?: string }) {
  const href = storyHref(id);
  function navigate(event: MouseEvent<HTMLAnchorElement>) {
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.parent === window) return;
    event.preventDefault();
    void import('storybook/preview-api').then(({ addons }) => {
      addons.getChannel().emit('selectStory', { storyId: `${id}--docs` });
    }).catch(() => {
      const destination = new URL(href, window.location.href).href;
      (window.top ?? window).location.assign(destination);
    });
  }
  return <a href={href} target="_top" onClick={navigate} className={className} aria-label={label}>{children}</a>;
}

function StatusBadge({ status }: { status: GuideStatus }) {
  return <span className={`ops-status ${statusClass[status]}`}><span className="ops-status-dot" aria-hidden="true" />{status}</span>;
}

function PageHeader({ guide }: { guide?: Guide }) {
  return <header className="ops-header">
    <StoryLink id="ops-home" className="ops-wordmark"><span className="ops-wordmark-mark" aria-hidden="true">O.</span><span>운영 기준<span className="ops-wordmark-en">OPERATIONS HANDBOOK</span></span></StoryLink>
    <nav className="ops-header-nav" aria-label="운영 문서 탐색">
      {guide && <StoryLink id="ops-home" className="ops-back-link" label="전체 가이드"><ArrowLeft size={15} aria-hidden="true" /><span>전체 가이드</span></StoryLink>}
      <a href={SHOWCASE_HREF} target="_blank" rel="noreferrer" className="ops-top-showcase">포트폴리오 보기<ArrowUpRight size={16} aria-hidden="true" /><span className="ops-sr-only"> 새 창</span></a>
    </nav>
  </header>;
}

function PageFooter() {
  return <footer className="ops-footer">
    <span className="ops-footer-name">좋은 재료를 전하는, 함께의 기준.</span>
    <span>v{operations.version}<span className="ops-footer-divider" aria-hidden="true">/</span>{operations.updatedAt}</span>
  </footer>;
}

function scrollToId(id: string) {
  const target = document.getElementById(id);
  if (!target) return;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth', block: 'start' });
  target.focus({ preventScroll: true });
}

function AnchorLink({ id, children, className }: { id: string; children: ReactNode; className?: string }) {
  return <a href={`#${id}`} className={className} onClick={(event) => { event.preventDefault(); scrollToId(id); }}>{children}</a>;
}

function GuideRow({ guide }: { guide: Guide }) {
  return <StoryLink id={`ops-${guide.id}`} className="ops-guide-row">
    <span className="ops-guide-code"><span>{guide.code}</span><span>{guide.category}</span></span>
    <span className="ops-guide-copy"><span className="ops-guide-title">{guide.title}</span><span className="ops-guide-summary">{guide.summary}</span><span className="ops-guide-owner"><span>담당 역할</span>{guide.owner}</span></span>
    <StatusBadge status={guide.status} />
    <ArrowUpRight size={21} className="ops-guide-arrow" aria-hidden="true" />
  </StoryLink>;
}

export function OperationsHomePage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<GuideCategory | '전체'>('전체');
  const [status, setStatus] = useState<GuideStatus | '전체'>('전체');
  const statusCounts = useMemo(() => Object.fromEntries(statuses.map((state) => [state, operations.guides.filter((guide) => guide.status === state).length])) as Record<GuideStatus, number>, []);
  const found = useMemo(() => {
    const term = query.trim().toLocaleLowerCase('ko-KR');
    return operations.guides.filter((guide) => {
      if (category !== '전체' && guide.category !== category) return false;
      if (status !== '전체' && guide.status !== status) return false;
      if (!term) return true;
      const searchable = [guide.code, guide.title, guide.summary, guide.category, guide.status, guide.owner, ...guide.sections.flatMap((section) => [section.title, ...section.body, ...(section.bullets ?? []), ...(section.checklist ?? []), ...(section.table?.headers ?? []), ...(section.table?.rows.flat() ?? [])])].join(' ').toLocaleLowerCase('ko-KR');
      return searchable.includes(term);
    });
  }, [query, category, status]);
  const hasFilters = Boolean(query.trim()) || category !== '전체' || status !== '전체';
  function resetFilters() { setQuery(''); setCategory('전체'); setStatus('전체'); }
  function chooseStatus(next: GuideStatus) { setQuery(''); setCategory('전체'); setStatus(next); scrollToId('ops-guides'); }

  return <div className="ops-page sb-unstyled">
    <a href="#ops-main" className="ops-skip-link">본문으로 이동</a>
    <PageHeader />
    <main id="ops-main" className="ops-main" tabIndex={-1}>
      <section className="ops-hero" aria-labelledby="ops-home-title">
        <div className="ops-hero-copy">
          <p className="ops-eyebrow">A SHARED STANDARD / 02</p>
          <h1 id="ops-home-title">같은 기준으로,<br />일관된 운영으로.</h1>
          <p className="ops-hero-description">브랜드의 약속을 실제 업무로 연결하는 기준입니다.<br className="ops-wide-break" /> 확정된 내용과 검토할 내용을 구분해, 필요한 순간에 함께 확인합니다.</p>
          <AnchorLink id="ops-guides" className="ops-text-action">업무 가이드 찾기<ArrowDown size={17} aria-hidden="true" /></AnchorLink>
        </div>
        <aside className="ops-stage" aria-label="현재 운영 준비 상태">
          <p className="ops-stage-label">CURRENT STAGE</p>
          <p className="ops-stage-title">{operations.releaseState}</p>
          <p className="ops-stage-copy">디자인 승인과 실제 판매 준비는<br />각각의 근거로 확인합니다.</p>
          <dl><div><dt>브랜드 후보</dt><dd>{brands.length}개</dd></div><div><dt>운영 브랜드</dt><dd>선정 대기</dd></div><div><dt>기준 갱신</dt><dd>{operations.updatedAt.replaceAll('-', '.')}</dd></div></dl>
          <AnchorLink id="ops-readiness" className="ops-stage-link">확정 · 대기 항목 확인<ArrowRight size={15} aria-hidden="true" /></AnchorLink>
        </aside>
      </section>

      <section className="ops-status-overview" aria-labelledby="ops-status-title">
        <div className="ops-status-overview-label"><h2 id="ops-status-title">문서 상태</h2><p>출시 진행률을 뜻하지 않습니다.</p></div>
        <div className="ops-status-counts">{statuses.map((state) => <button key={state} type="button" className={`ops-status-count ${statusClass[state]}`} onClick={() => chooseStatus(state)} aria-label={`${state} ${statusCounts[state]}개 가이드 보기`}><span className="ops-count-top"><span>{state}</span><ArrowUpRight size={17} aria-hidden="true" /></span><span className="ops-count-number">{String(statusCounts[state]).padStart(2, '0')}<span>개</span></span><span className="ops-count-description">{statusDescription[state]}</span></button>)}</div>
      </section>

      <section className="ops-guide-section" aria-labelledby="ops-guides">
        <div className="ops-section-heading"><div><p className="ops-eyebrow">THE HANDBOOK</p><h2 id="ops-guides" tabIndex={-1}>업무에 필요한 기준을 찾으세요.</h2></div><span className="ops-section-index">01 / GUIDES</span></div>
        <div className="ops-search-toolbar">
          <div className="ops-search-field"><Search size={19} aria-hidden="true" /><label htmlFor="ops-guide-search" className="ops-sr-only">가이드 제목·본문·담당 역할 검색</label><input id="ops-guide-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="제목·본문·담당 역할 검색" autoComplete="off" />{query && <button type="button" className="ops-icon-button" aria-label="검색어 지우기" onClick={() => setQuery('')}><X size={17} aria-hidden="true" /></button>}</div>
          <div className="ops-status-select"><label htmlFor="ops-status-filter">상태</label><select id="ops-status-filter" value={status} onChange={(event) => setStatus(event.target.value as GuideStatus | '전체')}><option value="전체">모든 상태</option>{statuses.map((state) => <option key={state} value={state}>{state}</option>)}</select></div>
        </div>
        <div className="ops-filter-bar"><div className="ops-category-filters" role="group" aria-label="가이드 분야">{(['전체', ...categories] as const).map((item) => <button key={item} type="button" className={`ops-category-filter${category === item ? ' ops-category-active' : ''}`} aria-pressed={category === item} onClick={() => setCategory(item)}>{item}<span>{item === '전체' ? operations.guides.length : operations.guides.filter((guide) => guide.category === item).length}</span></button>)}</div>{hasFilters && <button type="button" onClick={resetFilters} className="ops-reset-filter">필터 초기화<X size={14} aria-hidden="true" /></button>}</div>
        <p className="ops-result-count" role="status" aria-live="polite">{hasFilters ? '검색 결과' : '전체 가이드'} <strong>{found.length}</strong>개{query.trim() && <span> · “{query.trim()}”</span>}</p>
        {found.length ? <div className="ops-guide-list">{found.map((guide) => <GuideRow key={guide.id} guide={guide} />)}</div> : <div className="ops-empty"><Search size={26} aria-hidden="true" /><h3>조건에 맞는 가이드가 없습니다.</h3><p>다른 검색어를 입력하거나 분야와 상태를 다시 선택해보세요.</p><button type="button" className="ops-button" onClick={resetFilters}>전체 가이드 보기<ArrowRight size={16} aria-hidden="true" /></button></div>}
      </section>

      <section className="ops-readiness-section" aria-labelledby="ops-readiness">
        <div className="ops-section-heading"><div><p className="ops-eyebrow">KNOW WHERE WE STAND</p><h2 id="ops-readiness" tabIndex={-1}>확인된 것과, 결정할 것.</h2></div><span className="ops-section-index">02 / READINESS</span></div>
        <div className="ops-readiness-grid">
          <article className="ops-confirmed"><div className="ops-subsection-title"><CheckCircle2 size={19} aria-hidden="true" /><h3>현재 확정된 내용</h3></div><ol>{operations.confirmed.map((item, index) => <li key={item}><span className="ops-item-number">{String(index + 1).padStart(2, '0')}</span><p>{item}</p></li>)}</ol></article>
          <article className="ops-pending"><div className="ops-subsection-title"><span className="ops-open-ring" aria-hidden="true" /><h3>출시 전 결정할 내용</h3><span className="ops-pending-total">{operations.pending.length}</span></div><p className="ops-pending-intro">확인 자료와 담당 역할을 함께 검토합니다.</p><div className="ops-pending-list">{operations.pending.map((item) => <details key={item.item} className="ops-pending-item"><summary><span>{item.item}</span><ChevronRight size={17} aria-hidden="true" /></summary><dl><div><dt>담당 역할</dt><dd>{item.owner}</dd></div><div><dt>필요한 근거</dt><dd>{item.neededEvidence}</dd></div></dl></details>)}</div></article>
        </div>
      </section>

      <section className="ops-brand-section" aria-labelledby="ops-brand-title">
        <div className="ops-section-heading"><div><p className="ops-eyebrow">BRAND REFERENCE</p><h2 id="ops-brand-title">브랜드의 기준을 함께 봅니다.</h2><p>네 후보의 최종 디자인을 확인합니다. 실제 운영 브랜드는 선정 대기 상태입니다.</p></div><span className="ops-section-index">03 / BRANDS</span></div>
        <div className="ops-brand-grid">{brands.map((brand) => <StoryLink key={brand.slug} id={`portfolio-${brand.slug}`} className="ops-brand-card"><span className="ops-brand-image" style={{ '--ops-brand-paper': brand.paper } as CSSProperties}><img src={brand.hero} alt={`${brand.name} FINAL 포트폴리오 표지`} loading="lazy" /></span><span className="ops-brand-card-title"><strong>{brand.name}</strong><ArrowUpRight size={18} aria-hidden="true" /></span><span className="ops-brand-one-line">{brand.oneLine}</span><span className="ops-brand-detail">FINAL V15 · {brand.boardCount}개 장표</span></StoryLink>)}</div>
      </section>
    </main>
    <PageFooter />
  </div>;
}

type ChecklistState = { guideId: string; values: Record<string, boolean>; available: boolean };
function checklistKey(sectionId: string, text: string) {
  let hash = 2166136261;
  for (let index = 0; index < text.length; index += 1) { hash ^= text.charCodeAt(index); hash = Math.imul(hash, 16777619); }
  return `${sectionId}-${(hash >>> 0).toString(36)}`;
}
const storageKey = (guideId: string) => `fieldnotes:operations-checklist:v1:${guideId}`;
function readChecklist(guide: Guide): ChecklistState {
  const initial: ChecklistState = { guideId: guide.id, values: {}, available: true };
  if (typeof window === 'undefined') return initial;
  try {
    const raw = window.localStorage.getItem(storageKey(guide.id));
    if (!raw) return initial;
    const stored: unknown = JSON.parse(raw);
    if (!stored || typeof stored !== 'object' || !('values' in stored) || !stored.values || typeof stored.values !== 'object') return initial;
    const values = stored.values as Record<string, unknown>;
    const allowed = guide.sections.flatMap((section) => (section.checklist ?? []).map((text) => checklistKey(section.id, text)));
    initial.values = Object.fromEntries(allowed.filter((key) => values[key] === true).map((key) => [key, true]));
    return initial;
  } catch { return { ...initial, available: false }; }
}

function GuideContent({ guide }: { guide: Guide }) {
  const [checklist, setChecklist] = useState<ChecklistState>(() => readChecklist(guide));
  const [notice, setNotice] = useState('');
  useEffect(() => { setChecklist(readChecklist(guide)); setNotice(''); }, [guide]);
  const values = checklist.guideId === guide.id ? checklist.values : {};
  const allItems = guide.sections.flatMap((section) => (section.checklist ?? []).map((text) => checklistKey(section.id, text)));
  const checkedCount = allItems.filter((key) => values[key]).length;
  function save(next: Record<string, boolean>, message: string) {
    let available = true;
    try { window.localStorage.setItem(storageKey(guide.id), JSON.stringify({ guideId: guide.id, values: next, savedAt: new Date().toISOString() })); }
    catch { available = false; }
    setChecklist({ guideId: guide.id, values: next, available });
    setNotice(available ? message : '이 기기에 저장할 수 없어 현재 화면에서만 유지됩니다.');
  }
  function toggle(key: string) {
    const next = { ...values, [key]: !values[key] };
    save(next, next[key] ? '개인 체크를 이 기기에 저장했습니다.' : '개인 체크를 해제했습니다.');
  }

  return <div className="ops-page sb-unstyled">
    <a href="#ops-guide-main" className="ops-skip-link">본문으로 이동</a>
    <PageHeader guide={guide} />
    <main className="ops-main" id="ops-guide-main" tabIndex={-1}>
      <div className="ops-guide-breadcrumb"><StoryLink id="ops-home">운영 기준</StoryLink><ChevronRight size={13} aria-hidden="true" /><span>{guide.category}</span><ChevronRight size={13} aria-hidden="true" /><span>{guide.code}</span></div>
      <header className="ops-guide-header"><p className="ops-eyebrow">{guide.code} / {guide.category}</p><h1>{guide.title}</h1><p className="ops-guide-lead">{guide.summary}</p><div className="ops-guide-meta"><StatusBadge status={guide.status} /><span><span>담당 역할</span>{guide.owner}</span><span><span>갱신</span>{operations.updatedAt}</span></div></header>
      <div className="ops-document-layout">
        <article className="ops-document" aria-label={guide.title}>
          {guide.sections.map((section, sectionIndex) => <section className="ops-document-section" key={section.id} aria-labelledby={`ops-section-${section.id}`}><div className="ops-document-heading"><span className="ops-document-section-number">{String(sectionIndex + 1).padStart(2, '0')}</span><h2 id={`ops-section-${section.id}`} tabIndex={-1}>{section.title}</h2></div><div className="ops-document-body">{section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}{section.bullets && <ul className="ops-bullet-list">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}{section.table && <div className="ops-table-scroll" role="region" aria-label={`${section.title} 표, 가로로 이동할 수 있습니다`} tabIndex={0}><table className="ops-table"><caption className="ops-sr-only">{section.title}</caption><thead><tr>{section.table.headers.map((heading) => <th key={heading} scope="col">{heading}</th>)}</tr></thead><tbody>{section.table.rows.map((row, index) => <tr key={`${section.id}-row-${index}`}>{row.map((cell, cellIndex) => cellIndex === 0 ? <th key={cellIndex} scope="row">{cell}</th> : <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div>}{section.checklist && <fieldset className="ops-checklist"><legend><ClipboardCheck size={17} aria-hidden="true" />개인 검토 체크</legend>{section.checklist.map((item) => { const itemId = checklistKey(section.id, item); return <label key={itemId} className={`ops-check-item${values[itemId] ? ' ops-check-item-checked' : ''}`}><input type="checkbox" checked={Boolean(values[itemId])} onChange={() => toggle(itemId)} /><span className="ops-check-visual" aria-hidden="true">{values[itemId] && <Check size={15} strokeWidth={2.3} />}</span><span>{item}</span></label>; })}<p className="ops-checklist-note">이 기기에서만 저장됩니다. 실제 운영 이행 기록이나 승인으로 사용되지 않습니다.</p></fieldset>}</div></section>)}
          {guide.sources?.length ? <section className="ops-source-section" aria-labelledby="ops-guide-sources"><p className="ops-eyebrow">SOURCES & MASTERS</p><h2 id="ops-guide-sources" tabIndex={-1}>출처와 기준 원본</h2><ul>{guide.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noreferrer">{source.label}<ArrowUpRight size={16} aria-hidden="true" /><span className="ops-sr-only"> 새 창</span></a></li>)}</ul></section> : null}
          <div className="ops-guide-bottom"><StoryLink id="ops-home" className="ops-text-action"><ArrowLeft size={17} aria-hidden="true" />전체 가이드로</StoryLink><a href={`./downloads/operations/${guide.id}.md`} download className="ops-text-action">원문 다운로드<Download size={17} aria-hidden="true" /></a></div>
        </article>
        <aside className="ops-document-aside">
          <nav className="ops-toc" aria-label="이 가이드의 목차"><p className="ops-eyebrow">ON THIS PAGE</p><ol>{guide.sections.map((section, index) => <li key={section.id}><AnchorLink id={`ops-section-${section.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</AnchorLink></li>)}{guide.sources?.length ? <li><AnchorLink id="ops-guide-sources"><span>↗</span>출처와 기준 원본</AnchorLink></li> : null}</ol></nav>
          {allItems.length > 0 && <div className="ops-personal-progress"><div className="ops-personal-title"><ClipboardCheck size={18} aria-hidden="true" /><h2>내 검토 체크</h2></div><p className="ops-progress-count"><strong>{checkedCount}</strong><span>/ {allItems.length}</span></p><progress value={checkedCount} max={allItems.length} aria-label={`개인 체크 ${allItems.length}개 중 ${checkedCount}개`} /><p className="ops-personal-note">이 기기에서만 저장<br /><span>실제 운영 이행 기록이 아닙니다.</span></p>{!checklist.available && <p className="ops-storage-error" role="status">기기 저장을 사용할 수 없습니다.<br />현재 화면에서만 유지됩니다.</p>}<button type="button" className="ops-check-reset" disabled={checkedCount === 0} onClick={() => save({}, '이 가이드의 개인 체크를 초기화했습니다.')}>체크 초기화</button></div>}
          <p className="ops-save-notice" role="status" aria-live="polite">{notice}</p>
          <div className="ops-status-definition"><StatusBadge status={guide.status} /><p>{statusDescription[guide.status]}</p></div>
        </aside>
      </div>
    </main>
    <PageFooter />
  </div>;
}

export function OperationsGuidePage({ guideId }: { guideId: string }) {
  const guide = operations.guides.find((item) => item.id === guideId);
  if (!guide) return <div className="ops-page sb-unstyled"><PageHeader /><main className="ops-main"><div className="ops-empty ops-not-found"><p className="ops-eyebrow">GUIDE NOT FOUND</p><h1>가이드를 찾을 수 없습니다.</h1><p>전체 목록에서 필요한 운영 기준을 확인해주세요.</p><StoryLink id="ops-home" className="ops-button">전체 가이드 보기<ArrowRight size={16} aria-hidden="true" /></StoryLink></div></main><PageFooter /></div>;
  return <GuideContent guide={guide} />;
}
