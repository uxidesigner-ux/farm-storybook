import { useEffect, useId, useRef, useState } from 'react';
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, MouseEvent, ReactNode } from 'react';
import { AlertTriangle, ArrowUpRight, Check, CheckCircle2, Copy, Download, FileSpreadsheet, FileText, Info, Braces, Leaf, Link2, SearchX, X } from 'lucide-react';
import { absoluteBookUrl, bookHref, categoryMeta, copyText, openBook, routes } from '../data';
import type { ArchiveFile, GuideDocument } from '../types';

/** Storybook 문서로 가는 링크. 주소는 항상 실제 URL이며, Storybook 안에서는 새로고침 없이 전환한다. */
export function BookLink({ storyId, children, onClick, ...props }: AnchorHTMLAttributes<HTMLAnchorElement> & { storyId: string; children: ReactNode }) {
  function handle(event: MouseEvent<HTMLAnchorElement>) {
    onClick?.(event);
    if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || window.parent === window) return;
    event.preventDefault();
    const fallback = event.currentTarget.href;
    void openBook(storyId).then((moved) => { if (!moved) window.top?.location.assign(fallback); });
  }
  return <a href={bookHref(storyId)} target="_top" onClick={handle} {...props}>{children}</a>;
}

export function StatusBadge({ status }: { status: string }) {
  const tone = status === '리서치 완료' ? 'complete' : status === '검토 중' ? 'review' : status === '운영 기준' ? 'standard' : 'draft';
  return <span className={`status-badge status-${tone}`}><span className="status-dot" aria-hidden="true" />{status}</span>;
}

export function Button({ variant = 'primary', children, type = 'button', ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet'; children: ReactNode }) {
  return <button type={type} className={`fn-button fn-button-${variant}`} {...props}>{children}</button>;
}

export function Callout({ title, children, tone = 'info' }: { title: string; children: ReactNode; tone?: 'info' | 'notice' | 'success' }) {
  const Icon = tone === 'notice' ? AlertTriangle : tone === 'success' ? CheckCircle2 : Info;
  return <aside className={`callout callout-${tone}`}><Icon size={18} aria-hidden="true" /><div><strong>{title}</strong><div>{children}</div></div></aside>;
}

/** 필터용 토글 버튼. 선택 여부를 색뿐 아니라 aria-pressed와 체크 표시로 전달한다. */
export function Chip({ selected, count, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { selected: boolean; count?: number; children: ReactNode }) {
  return <button type="button" className="chip" aria-pressed={selected} {...props}>{selected && <Check size={14} aria-hidden="true" />}<span>{children}</span>{count !== undefined && <span className="chip-count">{count}</span>}</button>;
}

/**
 * 공유 링크 복사. 성공하면 복사한 주소를, 실패하면 직접 복사할 수 있는 주소를 보여준다.
 * 주소는 문서의 고정 ID로 만들어지므로 제목·순서가 바뀌어도 유지된다.
 */
export function useShare(storyId: string) {
  const [result, setResult] = useState<null | { ok: boolean; url: string }>(null);
  async function share() {
    const url = absoluteBookUrl(storyId);
    try { await copyText(url); setResult({ ok: true, url }); }
    catch { setResult({ ok: false, url }); }
  }
  return { result, share, close: () => setResult(null) };
}
export function ShareNotice({ result, onClose }: { result: { ok: boolean; url: string }; onClose: () => void }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  useEffect(() => { if (!result.ok) { input.current?.focus(); input.current?.select(); } }, [result]);
  return <div className={`share-notice ${result.ok ? 'share-ok' : 'share-fallback'}`}>
    <p role="status">{result.ok ? <><Check size={16} aria-hidden="true" /> 공유 링크를 복사했습니다.</> : <><AlertTriangle size={16} aria-hidden="true" /> 자동 복사가 막혀 있습니다. 아래 주소를 직접 복사해 공유하세요.</>}</p>
    <label htmlFor={id} className="sr-only">이 문서의 공유 주소</label>
    <input id={id} ref={input} value={result.url} readOnly onFocus={(event) => event.currentTarget.select()} />
    <button type="button" className="share-close" onClick={onClose} aria-label="공유 안내 닫기"><X size={16} aria-hidden="true" /></button>
  </div>;
}

export function PageTop({ section, storyId }: { section: string; storyId: string }) {
  const { result, share, close } = useShare(storyId);
  return <>
    <header className="page-top">
      <nav aria-label="현재 위치" className="breadcrumb">
        <BookLink storyId={routes.home} className="breadcrumb-brand"><Leaf size={15} aria-hidden="true" />프로젝트 스토리북</BookLink>
        <span className="breadcrumb-divider" aria-hidden="true">/</span>
        <span aria-current="page">{section}</span>
      </nav>
      <div className="page-top-right">
        <span className="edition">WORKING EDITION 02</span>
        <button type="button" onClick={share} className="icon-label"><Link2 size={15} aria-hidden="true" /> 공유</button>
      </div>
    </header>
    {result && <ShareNotice result={result} onClose={close} />}
  </>;
}

export function PageFooter() {
  return <footer className="page-footer"><div><span className="footer-mark">FIELDNOTES</span><span>좋은 먹거리를 만드는 기준과 기록.</span></div><p>문서 공간의 임시 작업명 · 실제 상품 브랜드는 미정</p></footer>;
}

export function DocCard({ document: doc }: { document: GuideDocument }) {
  const meta = categoryMeta[doc.category];
  return <BookLink className={`doc-card tone-${meta.tone}`} storyId={doc.storyId}><div className="doc-card-top"><span className="small-code">{doc.code} / {doc.category}</span><ArrowUpRight size={17} aria-hidden="true" /></div><h3>{doc.title}</h3><p>{doc.summary}</p><div className="doc-card-bottom"><StatusBadge status={doc.status} /><span>{doc.readingMinutes}분 읽기</span></div></BookLink>;
}

export function DownloadCard({ file }: { file: Pick<ArchiveFile, 'type' | 'title' | 'description' | 'detail' | 'version' | 'status' | 'href'> }) {
  const Icon = file.type === 'XLSX' || file.type === 'CSV' ? FileSpreadsheet : file.type === 'JSON' ? Braces : FileText;
  return <article className="download-card"><div className={`file-icon file-${file.type.toLowerCase()}`}><Icon size={23} aria-hidden="true" /><span>{file.type}</span></div><div className="download-info"><div className="download-title"><h3>{file.title}</h3><StatusBadge status={file.status} /></div><p>{file.description}</p><small>{file.version} · {file.detail}</small></div><a href={file.href} download className="download-button" aria-label={`${file.title} 다운로드 (${file.type})`}><Download size={18} aria-hidden="true" /><span>다운로드</span></a></article>;
}

export function TokenSwatch({ name, value, usage }: { name: string; value: string; usage: string }) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  async function copy() {
    try { await copyText(value); setCopied(true); setMessage(`${value} 복사 완료`); }
    catch { setCopied(false); setMessage(`자동 복사가 지원되지 않습니다. 색상값: ${value}`); }
  }
  return <div className="token-swatch"><div className="token-color" style={{ backgroundColor: value }} /><div className="token-body"><strong>{name}</strong><p>{usage}</p><button type="button" onClick={copy} className="token-copy" aria-label={`${name} ${value} 색상값 복사`}><code>{value}</code>{copied ? <Check size={14} aria-hidden="true" /> : <Copy size={14} aria-hidden="true" />}</button><span className="token-message" role="status">{message}</span></div></div>;
}

export function EmptyState({ title, message, onReset }: { title: string; message: string; onReset: () => void }) {
  return <div className="empty-state"><SearchX size={32} aria-hidden="true" /><h3>{title}</h3><p>{message}</p><Button variant="secondary" onClick={onReset}>필터 초기화</Button></div>;
}

/** 넓은 표를 작은 화면에서 가로로 넘겨 읽을 수 있게 감싼다. 키보드로도 스크롤할 수 있도록 포커스를 받는다. */
export function DataTable({ caption, headers, rows }: { caption: string; headers: string[]; rows: ReactNode[][] }) {
  return <div className="table-scroll" role="region" aria-label={caption} tabIndex={0}><table className="data-table"><caption className="sr-only">{caption}</caption><thead><tr>{headers.map((header) => <th key={header} scope="col">{header}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, column) => column === 0 ? <th key={column} scope="row">{value}</th> : <td key={column}>{value}</td>)}</tr>)}</tbody></table></div>;
}

/** 검색어와 일치하는 부분을 강조한다. */
export function Highlight({ text, query }: { text: string; query: string[] }) {
  if (!query.length) return <>{text}</>;
  const lower = text.toLocaleLowerCase('ko-KR');
  const marks: [number, number][] = [];
  for (const term of query) { let from = 0; for (;;) { const index = lower.indexOf(term, from); if (index < 0) break; marks.push([index, index + term.length]); from = index + term.length; } }
  if (!marks.length) return <>{text}</>;
  marks.sort((a, b) => a[0] - b[0]);
  const out: ReactNode[] = []; let cursor = 0;
  for (const [start, end] of marks) { if (start < cursor) continue; out.push(text.slice(cursor, start), <mark key={start}>{text.slice(start, end)}</mark>); cursor = end; }
  out.push(text.slice(cursor));
  return <>{out}</>;
}
