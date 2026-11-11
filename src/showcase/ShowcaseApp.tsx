'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Grid2X2, Maximize2, Minimize2, ThumbsUp, X } from 'lucide-react';
import portfolio from '../../content/portfolio-data.json';
import './showcase.css';

type Brand = (typeof portfolio.brands)[number];
type Counts = Record<string, number>;
type VoteState = 'idle' | 'sending' | 'success' | 'error';
const formatCount = (n: number) => new Intl.NumberFormat('ko-KR').format(n);
const slugs = portfolio.brands.map(brand => brand.slug);
const defaultApi = 'https://farm-bx-showcase.james8101.chatgpt.site/api/votes';

function validatedCounts(value: unknown): Counts {
  if (!value || typeof value !== 'object') throw new Error('추천 수를 확인하지 못했습니다.');
  const raw = value as Record<string, unknown>;
  return Object.fromEntries(slugs.map(slug => {
    const count = raw[slug];
    if (typeof count !== 'number' || !Number.isSafeInteger(count) || count < 0) throw new Error('추천 수를 확인하지 못했습니다.');
    return [slug, count];
  }));
}

function currentSlug() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return slugs.includes(hash) ? hash : null;
}

export function ShowcaseApp({ apiBase = defaultApi }: { apiBase?: string }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [countError, setCountError] = useState(false);
  const [voteState, setVoteState] = useState<VoteState>('idle');
  const [message, setMessage] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [lightbox, setLightbox] = useState<Brand['boards'][number] | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const inFlight = useRef(false);
  const pendingVote = useRef<{ id: string; brand: string } | null>(null);
  const messageTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activeSlug = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const brand = portfolio.brands.find(item => item.slug === slug);
  const nextBrand = brand ? portfolio.brands[(portfolio.brands.indexOf(brand) + 1) % portfolio.brands.length] : null;

  const refreshCounts = useCallback(async () => {
    try {
      const response = await fetch(apiBase, { cache: 'no-store', signal: AbortSignal.timeout(12000) });
      if (!response.ok) throw new Error('count request failed');
      const body = await response.json() as { counts: unknown };
      const next = validatedCounts(body.counts);
      setCounts(previous => previous ? Object.fromEntries(slugs.map(key => [key, Math.max(previous[key], next[key])])) : next);
      setCountError(false);
    } catch { setCountError(true); }
  }, [apiBase]);

  useEffect(() => {
    function route() {
      const next = currentSlug();
      activeSlug.current = next;
      setSlug(next);
      setVoteState('idle');
      setMessage('');
      setLightbox(null);
      window.scrollTo({ top: 0, behavior: 'instant' });
      rootRef.current?.scrollTo({ top: 0, behavior: 'instant' });
    }
    route();
    setCanFullscreen(Boolean(document.fullscreenEnabled));
    function onFullscreen() { setFullscreen(Boolean(document.fullscreenElement)); }
    window.addEventListener('hashchange', route);
    document.addEventListener('fullscreenchange', onFullscreen);
    return () => {
      window.removeEventListener('hashchange', route);
      document.removeEventListener('fullscreenchange', onFullscreen);
      if (messageTimer.current) clearTimeout(messageTimer.current);
    };
  }, []);

  useEffect(() => {
    void refreshCounts();
    const onFocus = () => { if (!document.hidden) void refreshCounts(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const interval = setInterval(onFocus, 30000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(interval);
    };
  }, [refreshCounts]);

  useEffect(() => {
    document.title = brand ? `${brand.englishName} — Brand Experience` : 'Four Perspectives — 브랜드 포트폴리오';
  }, [brand]);

  useEffect(() => {
    if (lightbox) dialogRef.current?.showModal();
    else dialogRef.current?.close();
  }, [lightbox]);

  async function vote() {
    if (!brand || inFlight.current) return;
    const target = brand.slug;
    inFlight.current = true;
    setVoteState('sending');
    setMessage('');
    if (pendingVote.current?.brand !== target) pendingVote.current = { brand: target, id: crypto.randomUUID() };
    const request = pendingVote.current;
    try {
      const response = await fetch(apiBase, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brand: request.brand, requestId: request.id }),
        signal: AbortSignal.timeout(12000),
      });
      if (!response.ok) throw new Error('vote request failed');
      const data = await response.json() as { counts: unknown };
      const next = validatedCounts(data.counts);
      setCounts(previous => previous ? Object.fromEntries(slugs.map(key => [key, Math.max(previous[key], next[key])])) : next);
      setCountError(false);
      pendingVote.current = null;
      if (activeSlug.current === target) {
        setVoteState('success');
        setMessage('추천을 더했어요. 다시 투표할 수 있습니다.');
        if (messageTimer.current) clearTimeout(messageTimer.current);
        messageTimer.current = setTimeout(() => { setVoteState('idle'); setMessage(''); }, 2600);
      }
    } catch {
      if (activeSlug.current === target) {
        setVoteState('error');
        setMessage('연결을 확인한 뒤 다시 눌러 주세요. 같은 요청은 한 번만 집계됩니다.');
      }
    } finally { inFlight.current = false; }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch { setMessage('이 브라우저에서는 전체 화면 전환을 지원하지 않습니다.'); }
  }

  const style = brand ? { '--sc-ink': brand.color, '--sc-paper': brand.paper } as CSSProperties : undefined;
  return <div ref={rootRef} className={`sc-app ${brand ? 'sc-project' : 'sc-index'}`} style={style}>
    <a className="sc-skip" href="#sc-main" onClick={event => { event.preventDefault(); document.getElementById('sc-main')?.focus(); document.getElementById('sc-main')?.scrollIntoView(); }}>본문으로 이동</a>
    <header className="sc-header">
      <a href="#/" className="sc-site-name" aria-label="네 브랜드 프로젝트 인덱스"><span className="sc-dot-grid" aria-hidden="true"><i /><i /><i /><i /></span><span>{brand ? 'PROJECT INDEX' : 'FOUR PERSPECTIVES'}</span></a>
      {brand ? <><div className="sc-current"><span>{String(portfolio.brands.indexOf(brand) + 1).padStart(2, '0')}</span>{brand.englishName}</div><div className="sc-header-actions">{canFullscreen && <button type="button" className="sc-icon-button" onClick={() => void toggleFullscreen()} aria-label={fullscreen ? '전체 화면 종료' : '브라우저 전체 화면으로 보기'} title={fullscreen ? '전체 화면 종료' : '전체 화면'}>{fullscreen ? <Minimize2 size={19} /> : <Maximize2 size={19} />}</button>}<a href={`#/${nextBrand?.slug}`} className="sc-next-mini">다음 프로젝트 <ArrowRight size={18} /></a></div></> : <span className="sc-header-note">PREMIUM FOOD · BRAND EXPERIENCE</span>}
    </header>

    {!brand ? <main tabIndex={-1} id="sc-main" className="sc-index-main">
      <section className="sc-intro">
        <p className="sc-eyebrow">네 개의 이름, 하나의 좋은 식탁.</p>
        <h1>좋은 재료를,<br />만나는 <span>네 가지 시선.</span></h1>
        <div className="sc-intro-foot"><p>이름에서 일상의 경험까지.<br />각 브랜드의 이야기를 살펴보고, 마음이 가는 프로젝트를 추천해 주세요.</p><a href="#sc-collection" className="sc-jump" onClick={event => { event.preventDefault(); document.getElementById('sc-collection')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }}>프로젝트 둘러보기 <ArrowDown size={20} /></a></div>
      </section>
      <section id="sc-collection" aria-label="브랜드 프로젝트" className="sc-collection">
        <div className="sc-section-label"><span>THE COLLECTION</span><span>01 — 04</span></div>
        <div className="sc-grid">{portfolio.brands.map((item, index) => <a href={`#/${item.slug}`} className={`sc-card sc-card-${item.slug}`} key={item.slug} style={{ '--card-ink': item.color, '--card-paper': item.paper } as CSSProperties}>
          <div className="sc-card-image"><img src={item.hero} width={1536} height={1024} alt={`${item.name} 브랜드 패키지와 식재료 응용 장면`} loading={index < 2 ? 'eager' : 'lazy'} decoding="async" /><span className="sc-card-num">0{index + 1}</span><span className="sc-card-open" aria-hidden="true"><ArrowUpRight size={24} /></span></div>
          <div className="sc-card-body"><div><h2>{item.slug === 'gounbat' ? item.name : item.englishName}</h2><p>{item.oneLine}</p></div><span className="sc-vote-count" aria-label={counts ? `${item.name} 추천 ${formatCount(counts[item.slug])}건` : `${item.name} 추천 수 불러오는 중`}><ThumbsUp size={17} aria-hidden="true" /><span>{counts ? formatCount(counts[item.slug]) : '—'}</span><small>추천</small></span></div>
          <div className="sc-card-tags">{item.keywords.map(keyword => <span key={keyword}>{keyword}</span>)}<span>{item.boardCount} scenes</span></div>
        </a>)}</div>
      </section>
      <div className="sc-vote-info"><ThumbsUp size={20} /><div><strong>좋아하는 만큼, 여러 번 추천할 수 있어요.</strong><p>추천 수는 중복을 포함한 투표 건수입니다. 프로젝트를 열고 우측 하단의 투표 버튼을 눌러 주세요.</p>{countError && <p className="sc-connection-message">{counts ? '최근 추천 수를 다시 확인하고 있습니다.' : '추천 수를 불러오지 못했습니다.'} <button type="button" onClick={() => void refreshCounts()}>다시 불러오기</button></p>}</div></div>
      <footer className="sc-index-footer"><span>FOUR PERSPECTIVES<br /><small>BRAND EXPERIENCE COLLECTION</small></span><div><a href="https://uxidesigner-ux.github.io/farm-storybook/journal/" target="_blank" rel="noreferrer">작업 기록 <ArrowUpRight size={14} /></a><a href="https://uxidesigner-ux.github.io/farm-storybook/operations/" target="_blank" rel="noreferrer">운영 기준 <ArrowUpRight size={14} /></a></div><small>실사 응용 이미지는 AI 연출 목업입니다.</small></footer>
    </main> : <>
      <main tabIndex={-1} id="sc-main" className="sc-canvas" aria-label={`${brand.name} 브랜드 포트폴리오`}>
        {brand.boards.map((board, index) => <figure className="sc-board" key={board.index} style={{ aspectRatio: `${board.width} / ${board.height}` }}>
          <img src={board.src} width={board.width} height={board.height} alt={`${brand.name} — ${board.name}`} loading={index < 2 ? 'eager' : 'lazy'} fetchPriority={index === 0 ? 'high' : 'auto'} decoding="async" />
          <button type="button" className="sc-board-expand" onClick={() => setLightbox(board)} aria-label={`${board.name} 장표 크게 보기`}><Maximize2 size={16} /></button>
          <figcaption className="sc-visually-hidden">{board.name}</figcaption>
        </figure>)}
      </main>
      <section className="sc-project-end"><p className="sc-eyebrow">ANOTHER PERSPECTIVE</p><a href={`#/${nextBrand?.slug}`}><span>다음 이야기</span><strong>{nextBrand?.slug === 'gounbat' ? nextBrand.name : nextBrand?.englishName}</strong><ArrowRight size={42} /></a><a href="#/" className="sc-back-index"><Grid2X2 size={17} />모든 프로젝트 보기</a></section>
      <aside className="sc-vote-float" aria-label={`${brand.name} 추천 투표`}>
        <div className={`sc-vote-message ${voteState === 'error' ? 'sc-vote-message-error' : ''}`} role="status" aria-live="polite">{message}</div>
        <button type="button" className={`sc-fab ${voteState === 'success' ? 'sc-fab-success' : ''}`} onClick={() => void vote()} disabled={voteState === 'sending'} aria-label={`${brand.name} ${voteState === 'error' ? '투표 다시 시도' : '투표하기'}. 중복 투표 가능. 현재 추천 ${counts ? formatCount(counts[brand.slug]) : '확인 중'}`}>
          <ThumbsUp size={23} strokeWidth={1.8} fill={voteState === 'success' ? 'currentColor' : 'none'} aria-hidden="true" /><span>{voteState === 'sending' ? '반영 중' : voteState === 'error' ? '다시 시도' : '투표하기'}</span><span className="sc-fab-count">{counts ? formatCount(counts[brand.slug]) : '—'}</span>{voteState === 'success' && <Check size={15} aria-hidden="true" />}
        </button><span className="sc-repeat-note">중복 투표 가능</span>
      </aside>
    </>}
    <dialog ref={dialogRef} className="sc-lightbox" onClose={() => setLightbox(null)} onClick={event => { if (event.target === event.currentTarget) setLightbox(null); }}>
      <div className="sc-lightbox-bar"><span>{brand?.englishName} · {lightbox?.name}</span><button type="button" className="sc-icon-button" aria-label="장표 확대 닫기" onClick={() => setLightbox(null)}><X size={24} /></button></div>
      {lightbox && <div className="sc-lightbox-scroll"><img src={lightbox.src} alt={lightbox.name} width={lightbox.width} height={lightbox.height} /></div>}
    </dialog>
  </div>;
}
