import { useState } from 'react';
import type { FormEvent } from 'react';
import { ArrowRight, CircleDashed, CircleCheck, Search } from 'lucide-react';
import { BookLink, Callout, DocCard, DownloadCard, PageFooter, PageTop, StatusBadge } from '../components/UI';
import { brands, categories, categoryMeta, docById, documents, files, handOffSearch, openBook, bookHref, routes, stats, statusMeta, statuses } from '../data';

const confirmed = [
  '농가에서 생산한 프리미엄 농작물을 판매하는 서비스를 준비한다.',
  '건강·시간·편리함을 중요하게 생각하는 고객의 먹거리 경험을 목표로 한다.',
  '국내 12개·해외 23개, 총 35개 브랜드·서비스의 비교 리서치를 마쳤다(목적 표본이며 전수조사가 아니다).',
  'FIELDNOTES는 이 문서 공간의 임시 이름이다. 상품 브랜드명이 아니다.',
];
const open = [
  '작물과 품종 — 셀러리·치커리 등이 후보이며 정해지지 않았다.',
  '고객, 가격, 상품 브랜드명.',
  '농가의 공급 능력과 인증.',
  '판매 채널 구성 — 브랜드 사이트와 스마트스토어 등은 기존 구상이다.',
  '채널 간 결제·주문·재고 자동 연동 — 검토 대상이며 확정 기능이 아니다.',
];
const steps = [
  { title: '수정', body: 'content/guide-data.json에 문서를 추가하거나 고칩니다. 새 문서는 고정 ID와 코드를 정하고 등록부에 추가합니다.' },
  { title: '미리보기', body: 'npm run dev로 Storybook을 열어 화면·표·링크를 확인합니다.' },
  { title: '검증', body: 'npm run check와 npm run build, npm run verify:build로 ID·필수 값·출처·표 구조·빌드를 검사합니다.' },
  { title: '승인', body: '작업 브랜치의 변경을 검토받습니다. 상태와 변경 내용을 함께 설명합니다.' },
  { title: '게시', body: '승인 후 dev 브랜치에 반영합니다. 외부 배포는 별도 승인으로 수동 실행합니다.' },
];
const featured = ['bx-research', 'bx-positioning', 'ops-validation'].map(docById).filter((doc) => doc !== undefined);

export function HomePage() {
  const [query, setQuery] = useState('');
  function goExplore(state: { query?: string; category?: string; status?: string }) {
    handOffSearch(state);
    void openBook(routes.explore).then((moved) => { if (!moved) window.top?.location.assign(bookHref(routes.explore)); });
  }
  function submit(event: FormEvent) { event.preventDefault(); goExplore({ query }); }
  const numbers = [
    { value: stats.documents, unit: '개', label: '가이드 문서', note: `${stats.sections}개 절` },
    { value: brands.length, unit: '개', label: '벤치마크 사례', note: `국내 ${brands.filter((b) => b.region === '한국').length} · 해외 ${brands.filter((b) => b.region !== '한국').length}` },
    { value: stats.components, unit: '종', label: '컴포넌트', note: `예제 ${stats.stories}개` },
    { value: files.length, unit: '개', label: '원본 산출물', note: files.map((file) => file.type).join(' · ') },
  ];
  return <div className="fn-page sb-unstyled">
    <PageTop section="프로젝트 홈" storyId={routes.home} />
    <main>
      <section className="hero">
        <p className="eyebrow">PREMIUM PRODUCE PROJECT · 2026</p>
        <h1>좋은 농작물을 고객의 식탁까지,<br />함께 정하는 기준과 기록</h1>
        <p className="lead">농가에서 생산하는 프리미엄 농작물 서비스를 준비하며 쌓은 리서치·BX·디자인·개발·마케팅 산출물을 한곳에 모았습니다. 무엇이 확인된 사실이고 무엇이 아직 가설인지 문서 상태로 구분합니다.</p>
        <form className="hero-search" role="search" onSubmit={submit}>
          <label htmlFor="home-search" className="sr-only">문서 본문 검색</label>
          <Search size={18} aria-hidden="true" />
          <input id="home-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="문서 제목·본문·태그 검색 (예: 재고, 포지셔닝)" autoComplete="off" />
          <button type="submit" className="fn-button fn-button-primary">검색</button>
        </form>
        <dl className="stat-row">{numbers.map((item) => <div key={item.label}><dt>{item.label}</dt><dd><strong>{item.value}</strong><span>{item.unit}</span></dd><dd className="stat-note">{item.note}</dd></div>)}</dl>
      </section>

      <section className="section" aria-labelledby="home-stage">
        <div className="section-head"><p className="eyebrow">CURRENT STAGE</p><h2 id="home-stage">프로젝트 목적과 현재 단계</h2><p>지금은 리서치를 마치고 포지셔닝과 첫 상품의 조건을 검증하기 전 단계입니다. 아래 구분을 기준으로 문서를 읽어 주세요.</p></div>
        <div className="decision-grid">
          <article className="decision decision-confirmed"><h3><CircleCheck size={18} aria-hidden="true" /> 확정된 사항</h3><ul>{confirmed.map((item) => <li key={item}>{item}</li>)}</ul></article>
          <article className="decision decision-open"><h3><CircleDashed size={18} aria-hidden="true" /> 검토 중인 사항</h3><ul>{open.map((item) => <li key={item}>{item}</li>)}</ul></article>
        </div>
        <Callout title="문서 상태 읽는 법" tone="info">상태는 사업의 진행률이 아니라 각 문서의 성숙도입니다. ‘리서치 완료’와 ‘운영 기준’도 전략이 확정됐다는 뜻이 아닙니다.</Callout>
        <ul className="status-legend">{statuses.map((status) => { const count = documents.filter((doc) => doc.status === status).length; return <li key={status}><button type="button" onClick={() => goExplore({ status })} aria-label={`${status} 문서 ${count}개 보기`}><StatusBadge status={status} /><strong>{count}개</strong><span>{statusMeta[status].short}</span><ArrowRight size={15} aria-hidden="true" /></button></li>; })}</ul>
      </section>

      <section className="section" aria-labelledby="home-areas">
        <div className="section-head"><p className="eyebrow">BROWSE BY AREA</p><h2 id="home-areas">분야별 문서</h2><p>다섯 분야의 문서 {stats.documents}개입니다. 분야 이름을 누르면 해당 분야만 모아 볼 수 있습니다.</p></div>
        <div className="area-grid">{categories.map((category) => { const meta = categoryMeta[category]; const list = documents.filter((doc) => doc.category === category); return <article key={category} className={`area-card tone-${meta.tone}`}>
          <p className="small-code">{meta.english}</p>
          <h3><button type="button" onClick={() => goExplore({ category })} aria-label={`${category} 문서 ${list.length}개 모아 보기`}>{meta.label}<span className="area-count">{list.length}</span></button></h3>
          <p>{meta.description}</p>
          <ul>{category === 'BX' && <li><BookLink storyId={routes.benchmarks}><span className="small-code">B00</span>글로벌 벤치마크 {brands.length}개</BookLink></li>}{category === '디자인' && <li><BookLink storyId={routes.tokens}><span className="small-code">D00</span>디자인 토큰</BookLink></li>}{list.map((doc) => <li key={doc.id}><BookLink storyId={doc.storyId}><span className="small-code">{doc.code}</span>{doc.title}</BookLink></li>)}{category === '디자인' && <li><BookLink storyId="ui-button--docs"><span className="small-code">C01–06</span>컴포넌트 {stats.components}종</BookLink></li>}</ul>
        </article>; })}
          <article className="area-card tone-neutral area-archive"><p className="small-code">ARCHIVE</p><h3><BookLink storyId={routes.archive}>자료실</BookLink></h3><p>리서치 PDF, WBS Excel, 작성 템플릿과 구조화 데이터를 내려받습니다.</p><ul><li><BookLink storyId={routes.archive}><span className="small-code">A01</span>산출물 다운로드</BookLink></li><li><BookLink storyId={routes.explore}><span className="small-code">H02</span>문서 탐색·본문 검색</BookLink></li></ul></article>
        </div>
      </section>

      <section className="section" aria-labelledby="home-research">
        <div className="section-head"><p className="eyebrow">START HERE</p><h2 id="home-research">주요 리서치와 문서</h2><p>처음이라면 벤치마크와 리서치 결론을 읽고, 포지셔닝 가설과 검증 계획으로 넘어가세요.</p></div>
        <BookLink storyId={routes.benchmarks} className="feature-link"><div><p className="small-code">B00 / BX · 리서치 완료</p><h3>글로벌 벤치마크 {brands.length}개</h3><p>국내·해외·작물 전문 사례를 확인한 사실과 우리 사업에 대한 해석으로 나눠 탐색합니다. 모든 사례에 공식 출처가 연결돼 있습니다.</p></div><ArrowRight size={22} aria-hidden="true" /></BookLink>
        <div className="card-grid">{featured.map((doc) => <DocCard key={doc.id} document={doc} />)}</div>
      </section>

      <section className="section" aria-labelledby="home-files">
        <div className="section-head"><p className="eyebrow">DELIVERABLES</p><h2 id="home-files">원본 산출물</h2><p>문서의 근거가 되는 원본 파일입니다. 전체 목록과 문서별 Markdown은 <BookLink storyId={routes.archive}>자료실</BookLink>에 있습니다.</p></div>
        <div className="stack">{files.map((file) => <DownloadCard key={file.id} file={file} />)}</div>
      </section>

      <section className="section" aria-labelledby="home-howto">
        <div className="section-head"><p className="eyebrow">HOW WE WORK</p><h2 id="home-howto">문서를 읽고 추가하는 방법</h2><p>모든 문서는 같은 원본 데이터에서 만들어집니다. 수정에서 게시까지 다섯 단계를 거칩니다.</p></div>
        <ol className="steps">{steps.map((step, index) => <li key={step.title}><span className="step-number" aria-hidden="true">{index + 1}</span><h3>{step.title}</h3><p>{step.body}</p></li>)}</ol>
        <p className="section-links"><BookLink storyId="doc-dev-documentation--docs">문서 추가와 공유 절차 <ArrowRight size={15} aria-hidden="true" /></BookLink><BookLink storyId="doc-ops-governance--docs">문서 상태와 결정 기록 <ArrowRight size={15} aria-hidden="true" /></BookLink><BookLink storyId="doc-design-content--docs">문서·접근성 작성 기준 <ArrowRight size={15} aria-hidden="true" /></BookLink></p>
      </section>
    </main>
    <PageFooter />
  </div>;
}
