import { ArrowUpRight, ExternalLink } from 'lucide-react';
import portfolio from '../../content/portfolio-data.json';
import './portal.css';

export function PortfolioPage({ brandSlug }: { brandSlug: string }) {
  const brand = portfolio.brands.find(item => item.slug === brandSlug);
  if (!brand) return <main className="pf-page"><h1>프로젝트를 찾을 수 없습니다.</h1></main>;
  return <article className="pf-page" style={{ background: brand.paper, color: brand.color }}>
    <header className="pf-header"><div><p>BRAND EXPERIENCE · FINAL</p><h1>{brand.title}</h1><span>{brand.oneLine}</span></div><div className="pf-actions"><a href={`${portfolio.showcaseUrl}/#/${brand.slug}`} target="_blank" rel="noreferrer">전체 화면 · 추천하기 <ArrowUpRight size={17} /></a><a href={brand.figmaUrl} target="_blank" rel="noreferrer">Figma 원본 <ExternalLink size={14} /></a></div></header>
    <div className="pf-boards">{brand.boards.map((board, index) => <figure key={board.index}><img src={board.src} width={board.width} height={board.height} alt={`${brand.name} — ${board.name}`} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" /><figcaption className="pf-sr">{board.name}</figcaption></figure>)}</div>
    <footer className="pf-footer"><p>{brand.boardCount}개 장표 · {brand.photoCount}개 실사 응용 장면</p><p>{portfolio.note}</p><a href={`${portfolio.showcaseUrl}/#/${brand.slug}`} target="_blank" rel="noreferrer">이 프로젝트 추천하기 <ArrowUpRight size={16} /></a></footer>
  </article>;
}
