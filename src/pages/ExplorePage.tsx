import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { BookLink, Button, Chip, EmptyState, Highlight, PageFooter, PageTop, StatusBadge } from '../components/UI';
import { categories, documents, findSnippet, matchesDoc, routes, statuses, takeSearchHandOff, terms } from '../data';
import type { Category, DocStatus } from '../types';

export function ExplorePage() {
  const [initial] = useState(takeSearchHandOff);
  const [query, setQuery] = useState(initial.query ?? '');
  const [category, setCategory] = useState<Category | null>(categories.find((item) => item === initial.category) ?? null);
  const [status, setStatus] = useState<DocStatus | null>(statuses.find((item) => item === initial.status) ?? null);
  const queryTerms = useMemo(() => terms(query), [query]);
  const matched = useMemo(() => documents.filter((doc) => matchesDoc(doc, query)), [query]);
  const results = matched.filter((doc) => (!category || doc.category === category) && (!status || doc.status === status));
  const filtered = Boolean(query.trim() || category || status);
  function reset() { setQuery(''); setCategory(null); setStatus(null); document.getElementById('explore-search')?.focus(); }

  return <div className="fn-page sb-unstyled">
    <PageTop section="문서 탐색" storyId={routes.explore} />
    <main>
      <header className="page-head">
        <p className="eyebrow">H02 / 시작하기</p>
        <h1>문서 탐색</h1>
        <p className="lead">가이드 문서 {documents.length}개의 제목·요약·태그와 본문·표·안내 박스까지 검색합니다. 왼쪽 사이드바의 검색은 문서 제목만 찾습니다.</p>
      </header>
      <section className="filter-panel" aria-label="검색과 필터">
        <div className="search-field">
          <label htmlFor="explore-search">본문 검색</label>
          <div className="search-input"><Search size={18} aria-hidden="true" /><input id="explore-search" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="예: 재고, 포지셔닝, 접근성" autoComplete="off" /></div>
        </div>
        <fieldset className="chip-group"><legend>분야</legend><Chip selected={!category} count={matched.filter((doc) => !status || doc.status === status).length} onClick={() => setCategory(null)}>전체</Chip>{categories.map((item) => <Chip key={item} selected={category === item} count={matched.filter((doc) => doc.category === item && (!status || doc.status === status)).length} onClick={() => setCategory(category === item ? null : item)}>{item}</Chip>)}</fieldset>
        <fieldset className="chip-group"><legend>문서 상태</legend><Chip selected={!status} onClick={() => setStatus(null)}>전체</Chip>{statuses.map((item) => <Chip key={item} selected={status === item} count={matched.filter((doc) => doc.status === item && (!category || doc.category === category)).length} onClick={() => setStatus(status === item ? null : item)}>{item}</Chip>)}</fieldset>
      </section>
      <div className="result-bar">
        <p role="status" aria-live="polite"><strong>{results.length}개</strong> 문서{filtered ? ` · 전체 ${documents.length}개 중` : ''}</p>
        {filtered && <Button variant="quiet" onClick={reset}>필터 초기화</Button>}
      </div>
      {results.length === 0
        ? <EmptyState title="조건에 맞는 문서가 없습니다" message={query.trim() ? `“${query.trim()}”에 대한 결과가 없습니다. 검색어를 줄이거나 필터를 초기화해 보세요.` : '선택한 분야와 상태에 해당하는 문서가 없습니다.'} onReset={reset} />
        : <ul className="result-list">{results.map((doc) => { const snippet = findSnippet(doc, query); return <li key={doc.id}>
          <BookLink storyId={doc.storyId} className="result-item">
            <div className="result-meta"><span className="small-code">{doc.code} / {doc.category}</span><StatusBadge status={doc.status} /><span className="result-time">{doc.updatedAt} · {doc.readingMinutes}분 읽기</span></div>
            <h2><Highlight text={doc.title} query={queryTerms} /></h2>
            <p><Highlight text={doc.summary} query={queryTerms} /></p>
            {snippet && <p className="result-snippet"><span>{snippet.where}</span><Highlight text={snippet.text} query={queryTerms} /></p>}
            <ul className="tag-list" aria-label="태그">{doc.tags.map((tag) => <li key={tag}><Highlight text={tag} query={queryTerms} /></li>)}</ul>
          </BookLink>
        </li>; })}</ul>}
    </main>
    <PageFooter />
  </div>;
}
