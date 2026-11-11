import { useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { ArrowDown, ArrowDownToLine, ArrowRight, ArrowUpRight, Check, ChevronDown, Search, X } from 'lucide-react';
import journalData from '../../content/journal-records.json';
import portfolioData from '../../content/portfolio-data.json';
import { BookLink } from '../components/UI';
import { brands as marketBrands, categories, documents, normalize, routes, stats } from '../data';
import './journal.css';

type MilestoneStatus = 'approved' | 'completed' | 'superseded' | 'open';
type BrandSlug = 'all' | 'gounbat' | 'onari' | 'hecale' | 'ersa';
type Milestone = {
  id: string; sequence: number; title: string; phase: string; brand: BrandSlug;
  status: MilestoneStatus; request: string; decision: string; reason: string;
  evidence: { label: string; url: string }[]; artifacts: { label: string; href: string }[];
  outcome: string;
};
type Decision = {
  id: string; title: string; status: 'approved' | 'open' | 'superseded';
  scope: string; decision: string; rationale: string; supersedes?: string;
};
const milestones = journalData.milestones as Milestone[];
const decisions = journalData.decisions as Decision[];
const phases = [...new Set(milestones.map((item) => item.phase))];
const brandLabels: Record<BrandSlug, string> = {
  all: '공통', gounbat: '고운밭', onari: 'ONARI', hecale: 'HECALE', ersa: 'ERSA',
};
const stateLabels: Record<MilestoneStatus, string> = {
  approved: '확정 방향', completed: '작업 완료', superseded: '이전 방향', open: '진행·확인 중',
};
const worklogId = 'journal-worklog--docs';
const decisionsId = 'journal-decisions--docs';
const jsonHref = './downloads/journal-records.json';
const titleByDecision = new Map(decisions.map((item) => [item.id, item.title]));

function StateLabel({ status }: { status: MilestoneStatus }) {
  return <span className={`jr-state jr-state-${status}`}>
    {status === 'approved' && <Check size={12} aria-hidden="true" />}{stateLabels[status]}
  </span>;
}

function JournalShell({ current, children }: { current: 'home' | 'worklog' | 'decisions'; children: ReactNode }) {
  return <div className="fn-page jr-page sb-unstyled">
    <header className="jr-topbar">
      <BookLink storyId={routes.home} className="jr-wordmark">FIELDNOTES <span>작업 기록</span></BookLink>
      <nav aria-label="작업 기록 주요 메뉴">
        <BookLink storyId={routes.home} aria-current={current === 'home' ? 'page' : undefined}>개요</BookLink>
        <BookLink storyId={worklogId} aria-current={current === 'worklog' ? 'page' : undefined}>작업 기록</BookLink>
        <BookLink storyId={decisionsId} aria-current={current === 'decisions' ? 'page' : undefined}>결정 이력</BookLink>
      </nav>
    </header>
    <main className="jr-main">{children}</main>
    <footer className="jr-footer">
      <p>FIELDNOTES <span>좋은 먹거리를 만드는 과정.</span></p>
      <p>{journalData.updatedAt.replaceAll('-', '.')} 정리 · 기록 v{journalData.version}</p>
    </footer>
  </div>;
}

function RecordDownload({ label = '기록 원문 JSON' }: { label?: string }) {
  return <a className="jr-download" href={jsonHref} download="journal-records.json">
    <ArrowDownToLine size={16} aria-hidden="true" />{label}
  </a>;
}

function RecordLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith('?path=/docs/')) return <BookLink className="jr-source-link" storyId={href.slice('?path=/docs/'.length)}>{children}<ArrowUpRight size={13} aria-hidden="true" /></BookLink>;
  return <a className="jr-source-link" href={href} target="_blank" rel="noopener noreferrer">{children}<ArrowUpRight size={13} aria-hidden="true" /><span className="sr-only"> (새 탭)</span></a>;
}

function SectionIntro({ overline, title, children }: { overline: string; title: string; children?: ReactNode }) {
  return <div className="jr-section-intro"><p className="jr-overline">{overline}</p><h2>{title}</h2>{children && <p>{children}</p>}</div>;
}

export function JournalHomePage() {
  const turns = [
    { label: '이름을 고르다', title: '친숙한 말에서, 이야기가 있는 이름으로', text: '고운밭·오나리·헤칼레·에르사. 네 개의 다른 관점으로 같은 서비스를 탐색했습니다.' },
    { label: '형태를 다듬다', title: '작도 논리와 실제 인상을 함께 검토', text: '대칭·비례의 설명을 넘어, 유사 인상과 불안정한 형태를 다시 살폈습니다.' },
    { label: '경험에 적용하다', title: '선화는 작게, 적용 장면은 충분히', text: '캐릭터를 제거하고 포장·정보·디지털 화면에서 브랜드의 일관성을 확인했습니다.' },
    { label: '현재를 정리하다', title: '최종 포트폴리오와 수정 이력을 연결', text: '현재 사용하는 원본을 보여주고, 그 선택에 이른 이유와 이전 방향도 남깁니다.' },
  ];
  const browse = [
    { id: routes.explore, label: 'DOCUMENTS', title: `분야별 가이드 ${documents.length}개`, body: 'BX, 디자인, 개발, 마케팅, 운영. 문서의 성숙도와 근거를 함께 읽습니다.' },
    { id: routes.benchmarks, label: 'MARKET RESEARCH', title: `국내외 서비스 ${marketBrands.length}개`, body: '국내 12·해외 23개의 목적 표본. 확인한 사실과 적용 가설을 구분합니다.' },
    { id: routes.plusx, label: 'DESIGN RESEARCH', title: `Plus X 공개 프로젝트 ${stats.plusxProjects}개`, body: '공식 카탈로그, 심층 사례와 참고한 표현 방식을 보존한 디자인 연구입니다.' },
    { id: routes.archive, label: 'SOURCE FILES', title: '보고서와 원본 산출물', body: '리서치 PDF, WBS, 분석표, 문서 템플릿과 구조화 데이터를 내려받습니다.' },
  ];
  return <JournalShell current="home">
    <section className="jr-hero">
      <p className="jr-overline">PREMIUM PRODUCE · PROJECT JOURNAL</p>
      <h1>좋은 먹거리를,<br />브랜드로 만드는 과정.</h1>
      <div className="jr-hero-bottom">
        <p className="jr-lead">처음의 질문부터 이름을 고르고, 형태를 다듬고, 경험에 적용하기까지.<br className="jr-desktop-break" /> 선택한 이유와 바꾼 이유를 함께 기록합니다.</p>
        <BookLink className="jr-primary-link" storyId={worklogId}>전체 작업 기록 <ArrowRight size={18} aria-hidden="true" /></BookLink>
      </div>
      <div className="jr-edition-line"><span>FOUR BRAND STUDIES</span><span>리서치 → 네이밍 → 아이덴티티 → 응용 → FINAL</span></div>
    </section>

    <section className="jr-section jr-portfolios" aria-label="네 브랜드 최종 포트폴리오">
      <SectionIntro overline="CURRENT PORTFOLIOS / V15" title="네 개의 이름, 네 가지 브랜드 경험.">현재 정리된 포트폴리오입니다. 실제 서비스를 운영할 단일 브랜드는 아직 선택 전입니다.</SectionIntro>
      <div className="jr-portfolio-grid">{portfolioData.brands.map((brand, index) => <BookLink
        className="jr-portfolio" key={brand.slug} storyId={`portfolio-${brand.slug}--docs`}
        style={{ '--jr-brand': brand.color, '--jr-brand-paper': brand.paper } as CSSProperties}>
        <div className="jr-portfolio-image"><img src={brand.hero} alt={`${brand.name} 브랜드의 최종 적용 장면 — AI 연출 목업`} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" /><span className="jr-portfolio-index">0{index + 1}</span><span className="jr-portfolio-open" aria-hidden="true"><ArrowUpRight size={22} /></span></div>
        <div className="jr-portfolio-caption"><h3>{brand.slug === 'gounbat' ? brand.name : brand.englishName}</h3><span>{brand.boardCount}개 장표</span></div>
        <p>{brand.oneLine}</p>
      </BookLink>)}</div>
      <p className="jr-caption">사진은 AI로 연출한 적용 예시입니다. 정확한 로고와 편집 원본은 각 포트폴리오의 Figma 링크에서 확인할 수 있습니다.</p>
    </section>

    <section className="jr-current" aria-labelledby="jr-current-title">
      <div><p className="jr-overline">WHERE WE ARE</p><h2 id="jr-current-title">디자인의 결정과<br />사업의 결정을 구분합니다.</h2><BookLink storyId={decisionsId} className="jr-text-link">결정 이력 확인 <ArrowRight size={16} aria-hidden="true" /></BookLink></div>
      <div className="jr-current-copy">
        <div><span className="jr-state jr-state-approved"><Check size={12} aria-hidden="true" />확정 방향</span><p>네 후보의 BX 포트폴리오, ONARI의 A 심볼·영문 조합, 캐릭터 제외, ERSA의 사진 중심 표현을 현재 기준으로 사용합니다.</p></div>
        <div><span className="jr-state jr-state-open">확인할 사업 조건</span><p>서비스의 단일 브랜드, 판매 작물, 농가·공급량, 인증, 가격·배송, 판매 채널 연동은 실제 확인과 별도 결정이 필요합니다.</p></div>
      </div>
    </section>

    <section className="jr-section" aria-label="주요 변화의 흐름">
      <SectionIntro overline="THE EVOLUTION" title="결과에 이르기까지 바뀐 것들.">완성한 결과와 함께, 다른 방향을 선택하게 된 이유도 남겼습니다.</SectionIntro>
      <ol className="jr-turns">{turns.map((turn, index) => <li key={turn.label}><span className="jr-turn-index">0{index + 1}</span><div><p className="jr-overline">{turn.label}</p><h3>{turn.title}</h3><p>{turn.text}</p></div></li>)}</ol>
      <div className="jr-section-actions"><BookLink storyId={worklogId} className="jr-text-link">{milestones.length}개 핵심 단계 읽기 <ArrowRight size={16} aria-hidden="true" /></BookLink><RecordDownload /></div>
    </section>

    <section className="jr-section" aria-label="이전 조사와 가이드 탐색">
      <SectionIntro overline="RESEARCH & DOCUMENTATION" title="판단의 바탕이 된 자료들.">기존 조사와 가이드의 상태·출처를 유지했습니다. 이곳의 가설과 과거 시안은 현재 운영 규칙과 구분해서 읽습니다.</SectionIntro>
      <div className="jr-library">{browse.map((item) => <BookLink storyId={item.id} key={item.id} className="jr-library-row"><span className="jr-overline">{item.label}</span><div><h3>{item.title}</h3><p>{item.body}</p></div><ArrowUpRight size={21} aria-hidden="true" /></BookLink>)}</div>
      <details className="jr-guide-index"><summary>분야별 가이드 제목 보기 <ChevronDown size={17} aria-hidden="true" /></summary><div className="jr-guide-columns">{categories.map((category) => <section key={category}><h3>{category}</h3><ul>{documents.filter((item) => item.category === category).map((item) => <li key={item.id}><BookLink storyId={item.storyId}><span>{item.code}</span>{item.title}</BookLink></li>)}</ul></section>)}</div></details>
    </section>
  </JournalShell>;
}

function SearchField({ value, onChange, id, placeholder }: { value: string; onChange: (value: string) => void; id: string; placeholder: string }) {
  return <div className="jr-search"><Search size={18} aria-hidden="true" /><label htmlFor={id} className="sr-only">기록 검색</label><input id={id} type="search" value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} autoComplete="off" />{value && <button type="button" aria-label="검색어 지우기" onClick={() => onChange('')}><X size={16} aria-hidden="true" /></button>}</div>;
}

function MilestoneEntry({ item }: { item: Milestone }) {
  return <article className={`jr-milestone jr-milestone-${item.status}`} id={`jr-step-${item.id}`}>
    <div className="jr-step-number" aria-label={`단계 ${item.sequence}`}>{String(item.sequence).padStart(2, '0')}</div>
    <div className="jr-step-body">
      <div className="jr-record-meta"><span>{item.phase}</span><span>{brandLabels[item.brand]}</span><StateLabel status={item.status} /></div>
      <h2>{item.title}</h2><p className="jr-step-decision">{item.decision}</p>
      <details className="jr-record-details"><summary>요청 · 수정 이유 · 근거 보기 <ChevronDown size={17} aria-hidden="true" /></summary><div className="jr-record-expanded">
        <dl><div><dt>요청</dt><dd>{item.request}</dd></div><div><dt>판단 이유</dt><dd>{item.reason}</dd></div><div><dt>결과와 범위</dt><dd>{item.outcome}</dd></div></dl>
        {item.artifacts.length > 0 && <div className="jr-record-links"><h3>관련 산출물</h3><div>{item.artifacts.map((link) => <RecordLink key={link.href + link.label} href={link.href}>{link.label}</RecordLink>)}</div></div>}
        {item.evidence.length > 0 && <div className="jr-record-links"><h3>출처·근거</h3><div>{item.evidence.map((link) => <RecordLink key={link.url + link.label} href={link.url}>{link.label}</RecordLink>)}</div></div>}
      </div></details>
    </div>
  </article>;
}

export function WorklogPage() {
  const [query, setQuery] = useState('');
  const [phase, setPhase] = useState('');
  const [brand, setBrand] = useState('');
  const [status, setStatus] = useState('');
  const [order, setOrder] = useState('oldest');
  const filtered = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return milestones.filter((item) => {
      const text = normalize([item.title, item.phase, item.brand, brandLabels[item.brand], stateLabels[item.status], item.request, item.decision, item.reason, item.outcome, ...item.artifacts.map((link) => link.label)].join(' '));
      return (!phase || item.phase === phase) && (!brand || item.brand === brand) && (!status || item.status === status) && terms.every((term) => text.includes(term));
    }).sort((a, b) => order === 'oldest' ? a.sequence - b.sequence : b.sequence - a.sequence);
  }, [query, phase, brand, status, order]);
  const hasFilters = !!(query || phase || brand || status);
  function reset() { setQuery(''); setPhase(''); setBrand(''); setStatus(''); }
  return <JournalShell current="worklog">
    <section className="jr-page-heading"><p className="jr-overline">JOURNAL / 01</p><h1>선택과 수정의 기록.</h1><p className="jr-lead">리서치부터 최종 포트폴리오까지, 무엇을 요청했고 왜 바꿨는지 읽습니다. 날짜가 확인되지 않은 단계는 발생 순서로 정리했습니다.</p><RecordDownload label="전체 기록 원문 다운로드" /></section>
    <div className="jr-status-note"><strong>상태 읽는 법</strong><p>‘작업 완료’는 문서·디자인의 수행 상태입니다. ‘확정 방향’은 현재 사용하는 선택, ‘이전 방향’은 후속 결정으로 대체된 연구안입니다. 사업 출시나 양산 승인을 뜻하지 않습니다.</p></div>
    <section className="jr-filters" aria-label="작업 기록 검색과 필터">
      <SearchField id="jr-worklog-search" value={query} onChange={setQuery} placeholder="브랜드, 변경 이유, 키워드 검색" />
      <div className="jr-filter-selects"><label>분야<select value={phase} onChange={(event) => setPhase(event.target.value)}><option value="">모든 분야</option>{phases.map((value) => <option key={value}>{value}</option>)}</select></label><label>브랜드<select value={brand} onChange={(event) => setBrand(event.target.value)}><option value="">모든 브랜드</option>{Object.entries(brandLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>상태<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">모든 상태</option>{Object.entries(stateLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label><label>정렬<select value={order} onChange={(event) => setOrder(event.target.value)}><option value="oldest">처음부터</option><option value="newest">최근 단계부터</option></select></label></div>
    </section>
    <div className="jr-results-bar"><p role="status" aria-live="polite">{hasFilters ? `${milestones.length}개 중 ${filtered.length}개 단계` : `${milestones.length}개 핵심 단계`}</p>{hasFilters && <button type="button" onClick={reset}>필터 초기화 <X size={14} aria-hidden="true" /></button>}<span><ArrowDown size={13} aria-hidden="true" />{order === 'oldest' ? '발생 순서' : '최근 단계 순'}</span></div>
    <div className="jr-timeline">{filtered.map((item) => <MilestoneEntry item={item} key={item.id} />)}</div>
    {filtered.length === 0 && <div className="jr-empty"><h2>조건에 맞는 기록이 없습니다.</h2><p>브랜드나 상태를 바꾸거나 검색어를 줄여보세요.</p><button type="button" onClick={reset}>전체 기록 보기 <ArrowRight size={16} aria-hidden="true" /></button></div>}
    <details className="jr-limitations"><summary>이 기록의 범위와 확인 한계 <ChevronDown size={17} aria-hidden="true" /></summary><ul>{journalData.limitations.map((item) => <li key={item}>{item}</li>)}</ul></details>
  </JournalShell>;
}

export function DecisionsPage() {
  const [status, setStatus] = useState('approved');
  const [query, setQuery] = useState('');
  const options = [{ value: 'approved', label: '확정 방향' }, { value: 'open', label: '미확정 사항' }, { value: 'superseded', label: '이전 방향' }, { value: '', label: '전체' }];
  const filtered = useMemo(() => {
    const terms = normalize(query).split(/\s+/).filter(Boolean);
    return decisions.filter((item) => (!status || item.status === status) && terms.every((term) => normalize(`${item.title} ${item.scope} ${item.decision} ${item.rationale}`).includes(term)));
  }, [status, query]);
  return <JournalShell current="decisions">
    <section className="jr-page-heading"><p className="jr-overline">JOURNAL / 02</p><h1>지금의 기준과,<br />아직 남은 결정.</h1><p className="jr-lead">선택한 방향을 명확히 하고, 바뀐 이유를 남깁니다. 디자인의 확정을 사업 조건의 확정으로 확대하지 않습니다.</p><RecordDownload /></section>
    <div className="jr-decision-tabs" role="group" aria-label="결정 상태 필터">{options.map((option) => <button type="button" key={option.value} aria-pressed={status === option.value} onClick={() => setStatus(option.value)}>{option.label}<span>{option.value ? decisions.filter((item) => item.status === option.value).length : decisions.length}</span></button>)}</div>
    <SearchField id="jr-decision-search" value={query} onChange={setQuery} placeholder="결정, 브랜드, 적용 범위 검색" />
    <p className="jr-decision-intro">{status === 'approved' ? '현재 사용하는 디자인 방향과 문서 기준입니다. 실제 상품·서비스 정책은 별도 확인합니다.' : status === 'open' ? '자료에 예시가 있어도 실제 운영값으로 사용할 수 없는 항목입니다. 확정 전 담당자의 검증과 결정이 필요합니다.' : status === 'superseded' ? '현재 사용하지 않는 이전 방향입니다. 무엇을 해결하려 했고 왜 바뀌었는지 남겼습니다.' : '현재 방향, 미확정 사항, 이전 방향을 함께 표시합니다. 각 항목의 상태와 범위를 확인하세요.'}</p>
    <p className="jr-result-count" role="status" aria-live="polite">{filtered.length}개 결정 기록</p>
    <div className="jr-decisions">{filtered.map((item) => <article className="jr-decision" id={`jr-decision-${item.id}`} key={item.id}>
      <div className="jr-decision-aside"><StateLabel status={item.status} /><p>{item.scope}</p></div>
      <div><h2>{item.title}</h2><p className="jr-decision-text">{item.decision}</p><dl className="jr-decision-reason"><dt>이유</dt><dd>{item.rationale}</dd></dl>{item.supersedes && <p className="jr-supersedes">이전 결정 <span>{titleByDecision.get(item.supersedes) ?? item.supersedes}</span></p>}</div>
    </article>)}</div>
    {filtered.length === 0 && <div className="jr-empty"><h2>일치하는 결정이 없습니다.</h2><p>상태를 바꾸거나 검색어를 지워보세요.</p><button type="button" onClick={() => { setStatus(''); setQuery(''); }}>전체 결정 보기 <ArrowRight size={16} aria-hidden="true" /></button></div>}
    <div className="jr-endnote"><p>결정 전후의 요청과 실제 산출물은 작업 기록에서 이어 읽을 수 있습니다.</p><BookLink storyId={worklogId} className="jr-text-link">전체 과정 읽기 <ArrowRight size={16} aria-hidden="true" /></BookLink></div>
  </JournalShell>;
}
