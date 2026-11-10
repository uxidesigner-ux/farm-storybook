import { useMemo, useState } from 'react';
import { ExternalLink, Search } from 'lucide-react';
import { BookLink, Button, Callout, Chip, DataTable, EmptyState, Highlight, PageFooter, PageTop, StatusBadge } from '../components/UI';
import { brands, normalize, researchData, routes, terms } from '../data';
import type { Brand } from '../types';

type Group = 'all' | 'domestic' | 'overseas' | 'crop';
const isDomestic = (brand: Brand) => brand.region === '한국';
/** P로 시작하는 사례는 특정 작물(셀러리·엔다이브 등)을 중심에 둔 해외 사례다. */
const isCrop = (brand: Brand) => brand.id.startsWith('P');
const groups: { key: Group; label: string; test: (brand: Brand) => boolean }[] = [
  { key: 'all', label: '전체', test: () => true },
  { key: 'domestic', label: '국내', test: isDomestic },
  { key: 'overseas', label: '해외', test: (brand) => !isDomestic(brand) },
  { key: 'crop', label: '작물 전문', test: isCrop },
];
const host = (url: string) => new URL(url).hostname.replace(/^www\./, '');
/** 같은 사이트의 출처가 여러 개면 경로까지 보여 구분한다. */
function sourceLabel(url: string, all: string[]) {
  if (all.filter((item) => host(item) === host(url)).length < 2) return host(url);
  const path = decodeURIComponent(new URL(url).pathname).replace(/\/$/, '');
  return `${host(url)}${path.length > 28 ? `${path.slice(0, 27)}…` : path || '/'}`;
}
const haystack = (brand: Brand) => normalize([brand.id, brand.name, brand.region, brand.model, brand.status, brand.fact, brand.lesson, isDomestic(brand) ? '국내' : '해외', isCrop(brand) ? '작물 전문' : ''].join(' '));

export function BenchmarkPage() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<Group>('all');
  const [region, setRegion] = useState('');
  const queryTerms = useMemo(() => terms(query), [query]);
  const searched = useMemo(() => brands.filter((brand) => { const text = haystack(brand); return queryTerms.every((term) => text.includes(term)); }), [queryTerms]);
  const regions = useMemo(() => [...new Set(brands.map((brand) => brand.region))], []);
  const results = searched.filter((brand) => groups.find((item) => item.key === group)!.test(brand) && (!region || brand.region === region));
  const filtered = Boolean(query.trim() || group !== 'all' || region);
  function reset() { setQuery(''); setGroup('all'); setRegion(''); document.getElementById('benchmark-search')?.focus(); }

  return <div className="fn-page sb-unstyled">
    <PageTop section="BX · B00" storyId={routes.benchmarks} />
    <main>
      <header className="page-head tone-green">
        <p className="eyebrow">B00 / BX · GLOBAL BENCHMARK</p>
        <h1>글로벌 벤치마크</h1>
        <p className="lead">국내 {brands.filter(isDomestic).length}개·해외 {brands.filter((brand) => !isDomestic(brand)).length}개, 총 {brands.length}개 브랜드·서비스의 공식 자료를 비교했습니다. 각 사례는 확인한 사실과 우리 사업에 대한 해석을 나눠 적었습니다.</p>
        <dl className="doc-meta"><div><dt className="sr-only">문서 상태</dt><dd><StatusBadge status="리서치 완료" /></dd></div><div><dt>기준일</dt><dd><time dateTime={researchData.asOf}>{researchData.asOf}</time></dd></div></dl>
        <Callout title="조사 범위" tone="info">{researchData.scope} 가격·구성·배송 조건은 기준일의 공식 페이지에서 확인한 값이며 이후 달라질 수 있습니다.</Callout>
      </header>

      <section className="filter-panel" aria-label="사례 검색과 필터">
        <div className="search-field">
          <label htmlFor="benchmark-search">사례 검색</label>
          <div className="search-input"><Search size={18} aria-hidden="true" /><input id="benchmark-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="브랜드명·국가·서비스 유형·키워드 (예: 구독, 일본, 셀러리)" autoComplete="off" /></div>
        </div>
        <fieldset className="chip-group"><legend>분류</legend>{groups.map((item) => <Chip key={item.key} selected={group === item.key} count={searched.filter((brand) => item.test(brand) && (!region || brand.region === region)).length} onClick={() => setGroup(item.key)}>{item.label}</Chip>)}<span className="chip-hint">작물 전문 사례는 해외 사례에 포함됩니다.</span></fieldset>
        <div className="select-field"><label htmlFor="benchmark-region">국가·지역</label><select id="benchmark-region" value={region} onChange={(event) => setRegion(event.target.value)}><option value="">전체 국가·지역</option>{regions.map((item) => <option key={item} value={item}>{item} ({brands.filter((brand) => brand.region === item).length})</option>)}</select></div>
      </section>
      <div className="result-bar">
        <p role="status" aria-live="polite"><strong>{results.length}개</strong> 사례{filtered ? ` · 전체 ${brands.length}개 중` : ''}</p>
        {filtered && <Button variant="quiet" onClick={reset}>필터 초기화</Button>}
      </div>

      {results.length === 0
        ? <EmptyState title="조건에 맞는 사례가 없습니다" message={query.trim() ? `“${query.trim()}”에 대한 결과가 없습니다. 검색어를 줄이거나 필터를 초기화해 보세요.` : '선택한 분류와 국가에 해당하는 사례가 없습니다.'} onReset={reset} />
        : <ul className="brand-list">{results.map((brand) => <li key={brand.id}><article className="brand-card" aria-labelledby={`brand-${brand.id}`}>
          <header>
            <div className="brand-tags"><span className="small-code">{brand.id}</span><span className="pill">{isDomestic(brand) ? '국내' : '해외'}</span>{isCrop(brand) && <span className="pill pill-accent">작물 전문</span>}<span className="pill pill-plain">{brand.status}</span></div>
            <h2 id={`brand-${brand.id}`}><Highlight text={brand.name} query={queryTerms} /></h2>
            <p className="brand-sub"><Highlight text={`${brand.region} · ${brand.model}`} query={queryTerms} /></p>
          </header>
          <div className="brand-fact"><h3>확인한 사실</h3><p><Highlight text={brand.fact} query={queryTerms} /></p></div>
          <div className="brand-lesson"><h3>우리 사업에 대한 해석</h3><p><Highlight text={brand.lesson} query={queryTerms} /></p></div>
          <footer><h3 className="sr-only">공식 출처</h3><ul>{brand.urls.map((url) => <li key={url}><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink size={13} aria-hidden="true" />{sourceLabel(url, brand.urls)}<span className="sr-only"> — {brand.name} 공식 출처 (새 탭)</span></a></li>)}</ul></footer>
        </article></li>)}</ul>}

      <section className="section" aria-labelledby="price-title">
        <div className="section-head"><p className="eyebrow">PRICE OBSERVATIONS</p><h2 id="price-title">가격 관찰</h2><p>공식 페이지에 표시된 값을 그대로 옮겼습니다. 구성·배송비·결제 조건이 달라 서로 직접 비교할 수 없으며, 우리 가격의 기준으로 확정하지 않습니다.</p></div>
        <DataTable caption="가격 관찰 표" headers={['사례', '상품·단위', '표시 가격', '읽을 때의 조건']} rows={researchData.prices} />
      </section>

      <section className="section" aria-labelledby="extra-title">
        <div className="section-head"><p className="eyebrow">ADDITIONAL SOURCES</p><h2 id="extra-title">추가 참고 출처</h2></div>
        <ul className="extra-sources">{researchData.extraSources.map(([id, label, url, note]) => <li key={id}><span className="small-code">{id}</span><div><a href={url} target="_blank" rel="noopener noreferrer">{label}<ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (새 탭)</span></a><p>{note}</p></div></li>)}</ul>
        <p className="section-links"><BookLink storyId="doc-bx-research--docs">리서치 핵심 결론 읽기</BookLink><BookLink storyId="doc-bx-positioning--docs">세 가지 포지셔닝 가설</BookLink><BookLink storyId={routes.archive}>리서치 PDF 원본</BookLink></p>
      </section>
    </main>
    <PageFooter />
  </div>;
}
