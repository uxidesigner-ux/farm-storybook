import { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowDown, ChevronDown, ExternalLink, Search } from 'lucide-react';
import { BookLink, Button, Callout, Chip, EmptyState, Highlight, PageFooter, PageTop, StatusBadge } from '../components/UI';
import { routes, terms } from '../data';
import {
  plusxCases, plusxResearch, plusxCategoryMeta, plusxEvidenceMeta, plusxRelevanceMeta, plusxSearchText,
} from '../plusx-data';
import type { PlusXCase, PlusXCategory, PlusXEvidence, PlusXRelevance } from '../plusx-data';
import '../styles/plusx.css';

const PAGE_SIZE = 24;
const categoryKeys: PlusXCategory[] = ['BX', 'UX', 'BX+UX', 'other'];
const evidenceKeys: PlusXEvidence[] = ['official_text', 'brief_or_image_led', 'insufficient'];
const relevanceKeys: PlusXRelevance[] = ['high', 'medium', 'low'];
const searchIndex = new Map(plusxCases.map(project => [project.slug, plusxSearchText(project)]));

/** 접힌 목록에는 짧은 발췌만 보여주고, 원문 요약은 펼친 영역에서 온전히 읽게 한다. */
function excerpt(text: string) {
  const sentence = text.match(/^.*?[.!?](?:\s|$)/)?.[0]?.trim() ?? text;
  return sentence.length > 138 ? `${sentence.slice(0, 137).trimEnd()}…` : sentence;
}

function SourceLinks({ project }: { project: PlusXCase }) {
  return <section className="px-sources" aria-label={`${project.name} 공식 출처`}>
    <h3>공식 출처</h3>
    <ul>{project.sources.map((source, index) => {
      const url = new URL(source.url);
      const label = url.hostname.startsWith('xs.') ? '공식 회고'
        : url.hostname.startsWith('object.') ? '공식 운영 글'
          : url.hostname.startsWith('storage.') ? '공식 시각 자료'
            : index === 0 ? '공식 프로젝트' : '추가 공식 자료';
      return <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">
        <span>{label}<small>{url.hostname.replace(/^www\./, '')}</small></span>
        <ExternalLink size={15} aria-hidden="true" />
        <span className="sr-only"> — {project.name}, 출처 {index + 1} (새 탭)</span>
      </a></li>;
    })}</ul>
  </section>;
}

function CaseDetails({ project, queryTerms }: { project: PlusXCase; queryTerms: string[] }) {
  const deep = project.deepDive;
  const text = (value: string) => <Highlight text={value} query={queryTerms} />;
  return <div className="px-case-content">
    <div className="px-reading-grid">
      <section className="px-facts" aria-labelledby={`px-facts-${project.slug}`}>
        <p className="eyebrow">OFFICIAL DESCRIPTION</p>
        <h3 id={`px-facts-${project.slug}`}>공식 설명 요약</h3>
        <p>{text(project.sourceFacts)}</p>
      </section>
      <section className="px-interpretation" aria-labelledby={`px-interpretation-${project.slug}`}>
        <p className="eyebrow">OUR INTERPRETATION</p>
        <h3 id={`px-interpretation-${project.slug}`}>우리 서비스에 적용할 원리</h3>
        <p>{text(project.interpretation)}</p>
        <p className="px-reading-note">농작물 서비스에 대한 독자적 해석입니다. 확정된 전략이나 품질의 증거가 아닙니다.</p>
      </section>
    </div>

    <section className="px-evidence" aria-labelledby={`px-evidence-${project.slug}`}>
      <h3 id={`px-evidence-${project.slug}`}>근거와 확인 범위</h3>
      <dl>
        <div><dt>기본 자료</dt><dd>{plusxEvidenceMeta[project.baseEvidence].label}<span>{plusxEvidenceMeta[project.baseEvidence].description}</span></dd></div>
        <div><dt>관련성 판단</dt><dd><strong>{plusxRelevanceMeta[project.relevance].label}</strong> · {text(project.relevanceReason)}</dd></div>
        <div><dt>확인 한계</dt><dd>{text(project.limits)}</dd></div>
        <div><dt>보강 근거</dt><dd>{project.supplementalEvidence ? text(project.supplementalEvidence) : '별도로 기록한 보강 근거가 없습니다.'}</dd></div>
        <div><dt>정적 시각 확인</dt><dd><strong>{project.visual.verified ? '일부 확인' : '직접 확인 안 함'}</strong><span>{text(project.visual.note)}</span>{project.visual.observation && <p className="px-visual-observation">관찰한 내용: {text(project.visual.observation)}</p>}</dd></div>
        {project.metadataNote && <div><dt>자료 표기 주의</dt><dd>{text(project.metadataNote)}</dd></div>}
      </dl>
    </section>

    {deep && <details className="px-deep-dive">
      <summary><span>심층 분석 읽기 <small>문제·접점·적용 조건</small></span><ChevronDown size={18} aria-hidden="true" /></summary>
      <div className="px-deep-body">
        <section>
          <p className="eyebrow">OFFICIAL CONTEXT</p>
          <h3>문제와 설계 방향</h3>
          {deep.officialFacts.map((fact, index) => <p key={index}>{text(fact)}</p>)}
          {deep.touchpoints.length > 0 && <dl className="px-touchpoints">{deep.touchpoints.map(point => <div key={point.label}><dt>{point.label}</dt><dd>{text(point.text)}</dd></div>)}</dl>}
        </section>
        <section className="px-deep-proposal">
          <p className="eyebrow">APPLICATION PROPOSAL</p>
          <h3>우리의 해석과 적용 조건</h3>
          <p>{text(deep.analysis)}</p>
          <h4>적용 전에 확인할 것</h4><p>{text(deep.validation)}</p>
          <h4>그대로 가져오지 않을 것</h4><p>{text(deep.avoidCopying)}</p>
        </section>
        <p className="px-deep-limit"><strong>심층 기록의 근거:</strong> {text(deep.evidenceNote)}<br /><strong>해석의 한계:</strong> {text(deep.limits)}</p>
      </div>
    </details>}
    <SourceLinks project={project} />
  </div>;
}

function CaseCard({ project, queryTerms }: { project: PlusXCase; queryTerms: string[] }) {
  const [open, setOpen] = useState(false);
  return <li className={`px-case-item${open ? ' px-case-item-open' : ''}`}>
    <article className="px-case" aria-labelledby={`px-title-${project.slug}`} data-project={project.slug}>
      <header className="px-case-header">
        <div className="px-case-tags"><span className="small-code">PX {String(project.index).padStart(3, '0')}</span><span className="px-tag">{plusxCategoryMeta[project.category].label}</span>{project.deepDive && <span className="px-tag px-tag-deep">심층 분석</span>}{project.visual.verified && <span className="px-tag px-tag-visual">정적 이미지 일부 확인</span>}</div>
        <h2 id={`px-title-${project.slug}`}><Highlight text={project.name} query={queryTerms} /></h2>
        <p className="px-case-excerpt"><Highlight text={excerpt(project.sourceFacts)} query={queryTerms} /></p>
        <p className="px-case-meta"><span>적용 관련성 <strong>{plusxRelevanceMeta[project.relevance].label}</strong></span><span>기본 근거: {plusxEvidenceMeta[project.baseEvidence].label}</span>{project.supplementalEvidence && <span>보강 자료 있음</span>}</p>
      </header>
      <details className="px-case-details" onToggle={event => setOpen(event.currentTarget.open)}>
        <summary id={`px-open-${project.slug}`}><span>{open ? '상세 접기' : '공식 설명과 적용 해석 보기'}<span className="sr-only"> — {project.name}</span></span><ChevronDown size={18} aria-hidden="true" /></summary>
        {open && <CaseDetails project={project} queryTerms={queryTerms} />}
      </details>
    </article>
  </li>;
}

export function PlusXPage() {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<PlusXCategory | 'all'>('all');
  const [relevance, setRelevance] = useState<PlusXRelevance | 'all'>('all');
  const [evidence, setEvidence] = useState<PlusXEvidence | 'all'>('all');
  const [deepOnly, setDeepOnly] = useState(false);
  const [visualOnly, setVisualOnly] = useState(false);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const searchInput = useRef<HTMLInputElement>(null);
  const firstAddedSlug = useRef<string | null>(null);
  const queryTerms = useMemo(() => terms(query), [query]);
  const results = useMemo(() => plusxCases.filter(project => (
    (category === 'all' || project.category === category)
    && (relevance === 'all' || project.relevance === relevance)
    && (evidence === 'all' || project.baseEvidence === evidence)
    && (!deepOnly || project.deepDive !== null)
    && (!visualOnly || project.visual.verified)
    && queryTerms.every(term => searchIndex.get(project.slug)!.includes(term))
  )), [category, relevance, evidence, deepOnly, visualOnly, queryTerms]);
  const visible = results.slice(0, visibleCount);
  const filtered = Boolean(query.trim() || category !== 'all' || relevance !== 'all' || evidence !== 'all' || deepOnly || visualOnly);
  const counts = plusxResearch.counts;

  // 더 보기 뒤 키보드 탐색이 새 목록을 건너뛰지 않도록 첫 추가 사례에 포커스를 둔다.
  useEffect(() => {
    if (!firstAddedSlug.current) return;
    document.getElementById(`px-open-${firstAddedSlug.current}`)?.focus();
    firstAddedSlug.current = null;
  }, [visibleCount]);

  function showMore() {
    firstAddedSlug.current = results[visibleCount]?.slug ?? null;
    setVisibleCount(count => count + PAGE_SIZE);
  }

  function reset() {
    setQuery(''); setCategory('all'); setRelevance('all'); setEvidence('all');
    setDeepOnly(false); setVisualOnly(false); setVisibleCount(PAGE_SIZE);
    searchInput.current?.focus();
  }

  return <div className="fn-page px-page sb-unstyled">
    <PageTop section="BX · B09" storyId={routes.plusx} />
    <main>
      <header className="page-head tone-green px-page-head">
        <p className="eyebrow">B09 / BX · DESIGN REFERENCE</p>
        <h1>Plus X 프로젝트 탐색</h1>
        <p className="lead">브랜드의 의미가 이름·디자인·서비스로 이어지는 방식을 살펴봅니다. 공개 프로젝트 {counts.projects}개의 공식 설명과 농작물 서비스에 적용할 해석을 구분해 기록했습니다.</p>
        <dl className="doc-meta"><div><dt className="sr-only">문서 상태</dt><dd><StatusBadge status="리서치 완료" /></dd></div><div><dt>기준일</dt><dd><time dateTime={plusxResearch.asOf}>{plusxResearch.asOf}</time></dd></div></dl>
        <dl className="px-stats">
          <div><dt>공개 프로젝트</dt><dd>{counts.projects}<span>개</span></dd><dd className="px-stat-note">공식 카탈로그 기준</dd></div>
          <div><dt>심층 분석</dt><dd>{counts.deepDives}<span>개</span></dd><dd className="px-stat-note">문제·접점·적용 조건</dd></div>
          <div><dt>정적 시각 확인</dt><dd>{counts.staticVisuals}<span>개</span></dd><dd className="px-stat-note">각 사례의 일부 화면·이미지</dd></div>
        </dl>
        <Callout title="브랜드 설계를 위한 참고 자료" tone="info">이 목록은 디자인 프로젝트를 비교한 자료입니다. 농작물 시장의 경쟁 서비스는 <BookLink storyId={routes.benchmarks}>국내외 35개 벤치마크</BookLink>에서 살펴볼 수 있습니다. 적용 관련성은 연구자의 정성 판단이며 사업의 성공 순위가 아닙니다.</Callout>
      </header>

      <details className="px-scope">
        <summary><span>조사 범위와 근거 읽는 법</span><ChevronDown size={18} aria-hidden="true" /></summary>
        <div className="px-scope-body">
          <p>{plusxResearch.scope.description}</p>
          <dl className="px-base-evidence">{evidenceKeys.map(key => <div key={key}><dt>{plusxEvidenceMeta[key].label}</dt><dd><strong>{counts.baseEvidence[key]}개</strong><span>{plusxEvidenceMeta[key].description}</span></dd></div>)}</dl>
          <p>{plusxResearch.scope.baseEvidenceNote}</p>
          <ul className="bullets">{plusxResearch.scope.limits.map(limit => <li key={limit}>{limit}</li>)}</ul>
          <p className="section-links"><BookLink storyId={routes.archive}>리서치 원본과 다운로드 자료</BookLink></p>
        </div>
      </details>

      <section className="filter-panel px-filters" aria-label="Plus X 사례 검색과 필터">
        <div className="search-field">
          <label htmlFor="plusx-search">프로젝트 검색</label>
          <div className="search-input"><Search size={18} aria-hidden="true" /><input ref={searchInput} id="plusx-search" type="search" value={query} onChange={event => { setQuery(event.target.value); setVisibleCount(PAGE_SIZE); }} placeholder="이름·공식 설명·적용 원리 (예: 29CM, 패키지, 선별)" autoComplete="off" aria-describedby="plusx-search-help" /></div>
          <p className="px-field-help" id="plusx-search-help">사례 요약과 심층 분석의 본문까지 검색합니다.</p>
        </div>
        <fieldset className="chip-group px-category"><legend>공식 분류</legend>
          <Chip selected={category === 'all'} count={counts.projects} onClick={() => { setCategory('all'); setVisibleCount(PAGE_SIZE); }}>전체</Chip>
          {categoryKeys.map(key => <Chip key={key} selected={category === key} count={counts.categories[key]} onClick={() => { setCategory(key); setVisibleCount(PAGE_SIZE); }}>{plusxCategoryMeta[key].label}</Chip>)}
        </fieldset>
        <div className="px-selects">
          <div className="select-field"><label htmlFor="plusx-relevance">농작물 BX 적용 관련성</label><select id="plusx-relevance" value={relevance} onChange={event => { setRelevance(event.target.value as PlusXRelevance | 'all'); setVisibleCount(PAGE_SIZE); }}><option value="all">전체 관련성</option>{relevanceKeys.map(key => <option key={key} value={key}>{plusxRelevanceMeta[key].label}</option>)}</select></div>
          <div className="select-field"><label htmlFor="plusx-evidence">기본 자료의 근거 수준</label><select id="plusx-evidence" value={evidence} aria-describedby="plusx-evidence-help" onChange={event => { setEvidence(event.target.value as PlusXEvidence | 'all'); setVisibleCount(PAGE_SIZE); }}><option value="all">전체 근거 수준</option>{evidenceKeys.map(key => <option key={key} value={key}>{plusxEvidenceMeta[key].label} ({counts.baseEvidence[key]})</option>)}</select></div>
        </div>
        <p className="px-field-help" id="plusx-evidence-help">기본 근거와 추가 자료는 별도입니다. ‘설명 부족’ 사례도 보강 자료나 심층 분석이 있을 수 있습니다.</p>
        <div className="px-checks">
          <label><input type="checkbox" checked={deepOnly} onChange={event => { setDeepOnly(event.target.checked); setVisibleCount(PAGE_SIZE); }} /><span>심층 분석 {counts.deepDives}개만</span></label>
          <label><input type="checkbox" checked={visualOnly} onChange={event => { setVisualOnly(event.target.checked); setVisibleCount(PAGE_SIZE); }} /><span>정적 시각 확인 {counts.staticVisuals}개만</span></label>
        </div>
      </section>

      <div className="result-bar px-result-bar">
        <p role="status" aria-live="polite" aria-atomic="true"><strong>{results.length}개</strong> 프로젝트 <span>· 전체 {counts.projects}개 중{results.length > visible.length ? ` · ${visible.length}개 표시` : ''}</span></p>
        <Button variant="quiet" onClick={reset} disabled={!filtered}>필터 초기화</Button>
      </div>

      {results.length === 0
        ? <EmptyState title="조건에 맞는 프로젝트가 없습니다" message={query.trim() ? `“${query.trim()}”에 대한 결과가 없습니다. 검색어를 줄이거나 선택한 필터를 풀어 보세요.` : '여러 필터를 함께 선택하면 결과가 없을 수 있습니다. 관련성이나 근거 수준을 넓혀 보세요.'} onReset={reset} />
        : <>
          <ul className="px-case-list" aria-label="Plus X 프로젝트 목록">{visible.map(project => <CaseCard key={project.slug} project={project} queryTerms={queryTerms} />)}</ul>
          <div className="px-more">
            <p>{results.length}개 중 {visible.length}개 표시</p>
            {visible.length < results.length
              ? <Button variant="secondary" onClick={showMore}><ArrowDown size={17} aria-hidden="true" />프로젝트 {Math.min(PAGE_SIZE, results.length - visible.length)}개 더 보기</Button>
              : <span className="px-end-note">현재 조건의 모든 프로젝트를 표시했습니다.</span>}
          </div>
        </>}

      <section className="section px-reading-guide" aria-labelledby="plusx-reading-guide">
        <div className="section-head"><p className="eyebrow">FROM REFERENCE TO OUR BRAND</p><h2 id="plusx-reading-guide">형태보다 설계의 이유를 가져옵니다</h2><p>공식 설명은 제작사의 문제 정의와 디자인 의도를 보여줍니다. 우리의 적용 해석은 농가의 사실과 고객의 사용 경험을 확인한 뒤 구체화할 제안입니다.</p></div>
        <p className="section-links"><BookLink storyId={routes.benchmarks}>농작물 시장 벤치마크 보기</BookLink><BookLink storyId={routes.archive}>BX 분석 보고서와 원본 자료</BookLink></p>
      </section>
    </main>
    <PageFooter />
  </div>;
}
