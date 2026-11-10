import { useEffect, useState } from 'react';
import type { MouseEvent } from 'react';
import { ArrowLeft, ArrowRight, CalendarDays, Clock, Download, ExternalLink, Link2, List } from 'lucide-react';
import { BookLink, Button, Callout, DataTable, DocCard, DownloadCard, PageFooter, PageTop, ShareNotice, StatusBadge, useShare } from '../components/UI';
import { categoryMeta, docById, documents, fileById, routes, statusMeta } from '../data';
import type { GuideDocument } from '../types';

/** 화면 위쪽 기준선을 지난 마지막 절을 현재 위치로 본다. 짧은 문서의 끝에서는 마지막 절로 맞춘다. */
function useActiveSection(ids: string[]) {
  const [active, setActive] = useState(ids[0]);
  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = ids[0];
      for (const id of ids) { const node = document.getElementById(id); if (node && node.getBoundingClientRect().top <= 140) current = id; }
      setActive(current);
    };
    const onScroll = () => { if (!frame) frame = window.requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onScroll); if (frame) window.cancelAnimationFrame(frame); };
  }, [ids.join('|')]);
  return active;
}

function Toc({ doc, active, onJump }: { doc: GuideDocument; active: string; onJump: (event: MouseEvent<HTMLAnchorElement>, id: string) => void }) {
  return <ol>{doc.sections.map((section, index) => <li key={section.id}><a href={`#${section.id}`} target="_self" aria-current={active === section.id ? 'location' : undefined} onClick={(event) => onJump(event, section.id)}><span aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{section.title}</a></li>)}{doc.sources?.length ? <li><a href="#sources" target="_self" aria-current={active === 'sources' ? 'location' : undefined} onClick={(event) => onJump(event, 'sources')}><span aria-hidden="true">↗</span>출처</a></li> : null}</ol>;
}

export function GuidePage({ documentId }: { documentId: string }) {
  const doc = docById(documentId);
  const { result, share, close } = useShare(doc?.storyId ?? routes.home);
  const ids = doc ? [...doc.sections.map((section) => section.id), ...(doc.sources?.length ? ['sources'] : [])] : [];
  const active = useActiveSection(ids);
  if (!doc) return <div className="fn-page sb-unstyled"><main><Callout title="문서를 찾을 수 없습니다" tone="notice">ID “{documentId}”에 해당하는 문서가 없습니다. <BookLink storyId={routes.explore}>문서 탐색</BookLink>에서 다시 찾아 주세요.</Callout></main></div>;

  const meta = categoryMeta[doc.category];
  const siblings = documents.filter((item) => item.category === doc.category);
  const position = siblings.findIndex((item) => item.id === doc.id);
  const previous = siblings[position - 1];
  const next = siblings[position + 1];
  const related = (doc.related ?? []).map(docById).filter((item) => item !== undefined);
  const downloads = (doc.downloadAssetIds ?? []).map(fileById).filter((item) => item !== undefined);

  function jump(event: MouseEvent<HTMLAnchorElement>, id: string) {
    event.preventDefault();
    const target = document.getElementById(id);
    if (!target) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
    target.focus({ preventScroll: true });
    event.currentTarget.closest('details')?.removeAttribute('open');
  }

  return <div className="fn-page sb-unstyled">
    <PageTop section={`${doc.category} · ${doc.code}`} storyId={doc.storyId} />
    <main>
      <header className={`doc-head tone-${meta.tone}`}>
        <p className="eyebrow">{doc.code} / {doc.category} · {doc.eyebrow}</p>
        <h1>{doc.title}</h1>
        <p className="lead">{doc.summary}</p>
        <dl className="doc-meta">
          <div><dt className="sr-only">문서 상태</dt><dd><StatusBadge status={doc.status} /></dd></div>
          <div><dt><CalendarDays size={15} aria-hidden="true" />갱신</dt><dd><time dateTime={doc.updatedAt}>{doc.updatedAt}</time></dd></div>
          <div><dt><Clock size={15} aria-hidden="true" />읽기</dt><dd>{doc.readingMinutes}분</dd></div>
        </dl>
        <p className="status-note"><strong>{doc.status}</strong> — {statusMeta[doc.status].note}</p>
        <ul className="tag-list" aria-label="태그">{doc.tags.map((tag) => <li key={tag}>{tag}</li>)}</ul>
        <div className="doc-actions">
          <Button variant="secondary" onClick={share}><Link2 size={16} aria-hidden="true" />공유 링크 복사</Button>
          <a className="fn-button fn-button-secondary" href={doc.markdownHref} download={`${doc.id}.md`}><Download size={16} aria-hidden="true" />Markdown 다운로드</a>
          {doc.id === 'bx-plusx-research' && <BookLink storyId={routes.plusx} className="fn-button fn-button-primary">146개 프로젝트 탐색 <ArrowRight size={16} aria-hidden="true" /></BookLink>}
        </div>
        {result && <ShareNotice result={result} onClose={close} />}
      </header>

      <div className="doc-layout">
        <nav className="toc" aria-label="이 문서의 목차">
          <p className="toc-title">목차</p>
          <Toc doc={doc} active={active} onJump={jump} />
        </nav>
        <details className="toc-mobile"><summary><List size={16} aria-hidden="true" />목차 {ids.length}개 절</summary><nav aria-label="이 문서의 목차 (접이식)"><Toc doc={doc} active={active} onJump={jump} /></nav></details>

        <article className="doc-body">
          {doc.sections.map((section, index) => <section key={section.id} aria-labelledby={section.id}>
            <h2 id={section.id} tabIndex={-1}><span className="section-number" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>{section.title}</h2>
            {section.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
            {section.bullets && <ul className="bullets">{section.bullets.map((item) => <li key={item}>{item}</li>)}</ul>}
            {section.table && <DataTable caption={`${section.title} 표`} headers={section.table.headers} rows={section.table.rows} />}
            {section.callout && <Callout title={section.callout.title} tone={doc.status === '검토 중' || doc.status === '초안' ? 'notice' : 'info'}>{section.callout.body}</Callout>}
          </section>)}

          {doc.sources?.length ? <section className="sources" aria-labelledby="sources">
            <h2 id="sources" tabIndex={-1}><span className="section-number" aria-hidden="true">↗</span>출처</h2>
            <p>이 문서가 근거로 삼은 공식 자료입니다. 새 탭에서 열립니다.</p>
            <ul>{doc.sources.map((source) => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label}<ExternalLink size={14} aria-hidden="true" /><span className="sr-only"> (새 탭)</span></a><span className="source-host">{new URL(source.url).hostname.replace(/^www\./, '')}</span></li>)}</ul>
          </section> : <section className="sources sources-none" aria-label="출처"><p>이 문서는 외부 출처 없이 프로젝트 내부 논의와 <BookLink storyId={routes.benchmarks}>벤치마크 리서치</BookLink>를 바탕으로 작성했습니다.</p></section>}
        </article>
      </div>

      {downloads.length > 0 && <section className="section" aria-labelledby="document-downloads">
        <div className="section-head"><p className="eyebrow">SOURCE FILES</p><h2 id="document-downloads">연결된 산출물</h2><p>이 문서와 함께 읽을 보고서·분석표·기록 양식입니다. 파일마다 표시된 작성 시점과 상태를 확인해 주세요.</p></div>
        <div className="stack">{downloads.map((file) => <DownloadCard key={file.id} file={file} />)}</div>
      </section>}

      {related.length > 0 && <section className="section related" aria-labelledby="related-title">
        <div className="section-head"><p className="eyebrow">RELATED</p><h2 id="related-title">관련 문서</h2></div>
        <div className="card-grid">{related.map((item) => <DocCard key={item.id} document={item} />)}</div>
      </section>}

      <nav className="pager" aria-label={`${doc.category} 분야의 이전·다음 문서`}>
        {previous ? <BookLink storyId={previous.storyId} className="pager-link"><ArrowLeft size={18} aria-hidden="true" /><span><small>이전 · {previous.code}</small>{previous.title}</span></BookLink> : <span />}
        {next ? <BookLink storyId={next.storyId} className="pager-link pager-next"><span><small>다음 · {next.code}</small>{next.title}</span><ArrowRight size={18} aria-hidden="true" /></BookLink> : <BookLink storyId={routes.explore} className="pager-link pager-next"><span><small>전체 문서</small>문서 탐색으로</span><ArrowRight size={18} aria-hidden="true" /></BookLink>}
      </nav>
    </main>
    <PageFooter />
  </div>;
}
