import { useId, useState } from 'react';
import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { ArrowUpRight, Check, Copy, Download, FileText, Info, Leaf, Link2 } from 'lucide-react';
import { absoluteBookUrl, bookHref, categoryMeta, copyText, routes } from '../data';
import type { GuideDocument } from '../types';
export function StatusBadge({ status }: { status: string }) {
  const tone = status === '리서치 완료' ? 'complete' : status === '검토 중' ? 'review' : status === '운영 기준' ? 'standard' : 'draft';
  return <span className={`status-badge status-${tone}`}><span className="status-dot" />{status}</span>;
}
export function Button({ variant = 'primary', children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'secondary' | 'quiet'; children: ReactNode }) {
  return <button className={`fn-button fn-button-${variant}`} {...props}>{children}</button>;
}
export function Callout({ title, children, tone = 'info' }: { title: string; children: ReactNode; tone?: 'info' | 'notice' | 'success' }) {
  return <aside className={`callout callout-${tone}`}><Info size={18} aria-hidden="true" /><div><strong>{title}</strong><div>{children}</div></div></aside>;
}
export function PageTop({ section, storyId }: { section: string; storyId: string }) {
  const [state, setState] = useState('');
  const [fallback, setFallback] = useState('');
  const id = useId();
  async function share() {
    const value = absoluteBookUrl(storyId);
    try { await copyText(value); setState('공유 링크를 복사했습니다.'); setFallback(''); }
    catch { setState('아래 주소를 복사해 공유하세요.'); setFallback(value); }
  }
  return <><header className="page-top"><a href={bookHref(routes.home)} target="_top" className="breadcrumb-brand"><Leaf size={15} />프로젝트 스토리북</a><span className="breadcrumb-divider">/</span><span>{section}</span><div className="page-top-right"><span className="edition">WORKING EDITION 01</span><button onClick={share} className="icon-label"><Link2 size={15} /> 공유</button></div></header>{state && <div className="share-notice" role="status"><span>{state}</span>{fallback && <><label htmlFor={id} className="sr-only">공유 주소</label><input id={id} value={fallback} readOnly onFocus={e => e.currentTarget.select()} /></>}<button onClick={() => { setState(''); setFallback(''); }} aria-label="공유 안내 닫기">닫기</button></div>}</>;
}
export function PageFooter() {
  return <footer className="page-footer"><div><span className="footer-mark">FIELDNOTES</span><span>좋은 먹거리를 만드는 기준과 기록.</span></div><p>프로젝트 작업명 · 실제 상품 브랜드는 미정</p></footer>;
}
export function DocCard({ document: doc }: { document: GuideDocument }) {
  const meta = categoryMeta[doc.category];
  return <a className={`doc-card tone-${meta.tone}`} href={bookHref(doc.storyId)} target="_top"><div className="doc-card-top"><span className="small-code">{doc.code} / {doc.category}</span><ArrowUpRight size={17} aria-hidden="true" /></div><h3>{doc.title}</h3><p>{doc.summary}</p><div className="doc-card-bottom"><StatusBadge status={doc.status} /><span>{doc.readingMinutes}분 읽기</span></div></a>;
}
export function DownloadCard({ file }: { file: { type: string; title: string; description: string; detail: string; version: string; status: string; href: string } }) {
  return <article className="download-card"><div className={`file-icon file-${file.type.toLowerCase()}`}><FileText size={23} /><span>{file.type}</span></div><div className="download-info"><div className="download-title"><h3>{file.title}</h3><StatusBadge status={file.status} /></div><p>{file.description}</p><small>{file.version} · {file.detail}</small></div><a href={file.href} download className="download-button" aria-label={`${file.title} 다운로드`}><Download size={18} /><span>다운로드</span></a></article>;
}
export function TokenSwatch({ name, value, usage }: { name: string; value: string; usage: string }) {
  const [copied, setCopied] = useState(false);
  const [message, setMessage] = useState('');
  async function copy() { try { await copyText(value); setCopied(true); setMessage(`${value} 복사 완료`); } catch { setMessage(`자동 복사가 지원되지 않습니다. 색상값: ${value}`); } }
  return <div className="token-swatch"><div className="token-color" style={{ backgroundColor: value }} /><div><strong>{name}</strong><p>{usage}</p><button onClick={copy} className="token-copy" aria-label={`${name} ${value} 색상값 복사`}><code>{value}</code>{copied ? <Check size={14} /> : <Copy size={14} />}</button><span className="sr-only" role="status">{message}</span></div></div>;
}
export function EmptyState({ title, message, onReset }: { title: string; message: string; onReset: () => void }) { return <div className="empty-state"><FileText size={32} /><h3>{title}</h3><p>{message}</p><Button variant="secondary" onClick={onReset}>필터 초기화</Button></div>; }
