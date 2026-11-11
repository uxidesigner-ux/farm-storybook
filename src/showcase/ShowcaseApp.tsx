'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { CSSProperties } from 'react';
import { ArrowDown, ArrowRight, ArrowUpRight, Check, Grid2X2, Maximize2, Minimize2, ThumbsUp, X } from 'lucide-react';
import portfolio from '../../content/portfolio-data.json';
import './showcase.css';

type Brand = (typeof portfolio.brands)[number];
type Counts = Record<string, number>;
type VoteState = 'idle' | 'sending' | 'success' | 'error';
type SessionState = 'loading' | 'ready' | 'unavailable';
type VoteSnapshot = { counts: Counts; authenticated: boolean; votedBrands: string[] };
type LikeParticle = { id: number; wave: number; hero: boolean; tone: 'blue' | 'ice' | 'brand'; style: CSSProperties };
type VoteCelebration = { id: number; brand: string; x: number; y: number; particles: LikeParticle[] };
const celebrationLifetime = 4900;
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

function validatedSnapshot(value: unknown): VoteSnapshot {
  if (!value || typeof value !== 'object') throw new Error('추천 상태를 확인하지 못했습니다.');
  const raw = value as Record<string, unknown>;
  if (typeof raw.authenticated !== 'boolean' || raw.duplicateVotesAllowed !== false || raw.multipleProjectsAllowed !== true ||
    !Array.isArray(raw.votedBrands) || !raw.votedBrands.every(value => typeof value === 'string' && slugs.includes(value)) ||
    (!raw.authenticated && raw.votedBrands.length > 0)) throw new Error('추천 상태를 확인하지 못했습니다.');
  return { counts: validatedCounts(raw.counts), authenticated: raw.authenticated, votedBrands: [...new Set(raw.votedBrands as string[])] };
}

function voteEndpoint(apiBase: string) {
  const url = new URL(apiBase, window.location.href);
  return { url: url.href, sameOrigin: url.origin === window.location.origin };
}

function currentSlug() {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace(/^#\/?/, '').split('?')[0];
  return slugs.includes(hash) ? hash : null;
}

function celebrationParticles(width: number, x: number, y: number, mobile: boolean): LikeParticle[] {
  const perWave = mobile ? 10 : 18;
  const random = (min: number, max: number) => min + Math.random() * (max - min);
  const px = (value: number) => `${Math.round(value)}px`;
  const deg = (value: number) => `${Math.round(value)}deg`;
  return Array.from({ length: perWave * 3 }, (_, id) => {
    const wave = Math.floor(id / perWave);
    const slot = id % perWave;
    const hero = slot === 0 || slot === Math.floor(perWave / 2);
    const size = hero ? random(mobile ? 62 : 86, mobile ? 78 : 112) : random(mobile ? 24 : 28, mobile ? 44 : 57);
    // Interleaved lanes open the first wave into a wide fan instead of a narrow column.
    const lane = ((slot * 7) % perWave + random(0.1, 0.8)) / perWave;
    const endX = width * (0.04 + lane * 0.92);
    const dx = endX - x;
    const dy = -(y + size + 64);
    const drift = random(-28, 28);
    const tilt = random(-22, 22);
    const tone = id % 7 === 5 ? 'brand' : id % 4 === 2 ? 'ice' : 'blue';
    return {
      id, wave, hero, tone,
      style: {
        '--like-size': px(size),
        '--like-delay': `${Math.round(wave * 380 + slot * 12 + random(0, 75))}ms`,
        '--like-duration': `${Math.round(random(2900, 3650))}ms`,
        '--like-x1': px(dx * 0.10), '--like-y1': px(dy * 0.08),
        '--like-x2': px(dx * 0.43 + drift), '--like-y2': px(dy * 0.25),
        '--like-x3': px(dx * 0.80 - drift * 0.5), '--like-y3': px(dy * 0.55),
        '--like-x4': px(dx * 0.98 + drift * 0.3), '--like-y4': px(dy * 0.83),
        '--like-x5': px(dx), '--like-y5': px(dy),
        '--like-r1': deg(tilt - 12), '--like-r2': deg(tilt + 9),
        '--like-r3': deg(tilt - 7), '--like-r4': deg(tilt + 5), '--like-r5': deg(tilt - 3),
      } as CSSProperties,
    };
  });
}

export function ShowcaseApp({ apiBase = defaultApi }: { apiBase?: string }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [counts, setCounts] = useState<Counts | null>(null);
  const [countError, setCountError] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);
  const [votedBrands, setVotedBrands] = useState<string[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>('loading');
  const [sameOrigin, setSameOrigin] = useState<boolean | null>(null);
  const [pendingBrand, setPendingBrand] = useState<string | null>(null);
  const [voteState, setVoteState] = useState<VoteState>('idle');
  const [message, setMessage] = useState('');
  const [fullscreen, setFullscreen] = useState(false);
  const [canFullscreen, setCanFullscreen] = useState(false);
  const [lightbox, setLightbox] = useState<Brand['boards'][number] | null>(null);
  const [celebration, setCelebration] = useState<VoteCelebration | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const voteButtonRef = useRef<HTMLButtonElement>(null);
  const celebrationTimer = useRef<number | null>(null);
  const celebrationId = useRef(0);
  const inFlight = useRef(false);
  const requestVersion = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const activeSlug = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const brand = portfolio.brands.find(item => item.slug === slug);
  const nextBrand = brand ? portfolio.brands[(portfolio.brands.indexOf(brand) + 1) % portfolio.brands.length] : null;
  const hasVoted = Boolean(brand && authenticated && votedBrands.includes(brand.slug));

  const clearCelebration = useCallback(() => {
    if (celebrationTimer.current !== null) window.clearTimeout(celebrationTimer.current);
    celebrationTimer.current = null;
    setCelebration(null);
  }, []);

  const celebrateVote = useCallback((target: string) => {
    clearCelebration();
    // A late response, a background tab, or reduced motion must not launch particles.
    if (activeSlug.current !== target || currentSlug() !== target || document.hidden ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const button = voteButtonRef.current?.getBoundingClientRect();
    if (!button || button.width === 0 || button.height === 0) return;
    const x = button.left + button.width / 2;
    const y = button.top + button.height / 2;
    setCelebration({
      id: ++celebrationId.current, brand: target, x, y,
      particles: celebrationParticles(window.innerWidth, x, y, window.matchMedia('(max-width: 600px)').matches),
    });
    celebrationTimer.current = window.setTimeout(() => {
      celebrationTimer.current = null;
      setCelebration(null);
    }, celebrationLifetime);
  }, [clearCelebration]);

  useEffect(() => {
    const motionPreference = window.matchMedia('(prefers-reduced-motion: reduce)');
    const onVisibility = () => { if (document.hidden) clearCelebration(); };
    const onMotionChange = () => { if (motionPreference.matches) clearCelebration(); };
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', clearCelebration);
    motionPreference.addEventListener('change', onMotionChange);
    return () => {
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', clearCelebration);
      motionPreference.removeEventListener('change', onMotionChange);
      if (celebrationTimer.current !== null) window.clearTimeout(celebrationTimer.current);
      celebrationTimer.current = null;
    };
  }, [clearCelebration]);

  const applySnapshot = useCallback((next: VoteSnapshot, viewerAllowed: boolean) => {
    setCounts(next.counts);
    // Cross-origin pages display public totals only. Account state belongs to the canonical site.
    setAuthenticated(viewerAllowed && next.authenticated);
    setVotedBrands(viewerAllowed && next.authenticated ? next.votedBrands : []);
    setSessionState('ready');
    setCountError(false);
  }, []);

  const refreshCounts = useCallback(async (): Promise<VoteSnapshot | null> => {
    if (inFlight.current) return null;
    const version = ++requestVersion.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    try {
      const endpoint = voteEndpoint(apiBase);
      setSameOrigin(endpoint.sameOrigin);
      const response = await fetch(endpoint.url, {
        cache: 'no-store', credentials: endpoint.sameOrigin ? 'same-origin' : 'omit',
        mode: endpoint.sameOrigin ? 'same-origin' : 'cors',
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
      });
      if (!response.ok) throw new Error('count request failed');
      const next = validatedSnapshot(await response.json());
      if (version !== requestVersion.current) return null;
      applySnapshot(next, endpoint.sameOrigin);
      return endpoint.sameOrigin ? next : { ...next, authenticated: false, votedBrands: [] };
    } catch {
      if (version !== requestVersion.current) return null;
      setCountError(true);
      setSessionState('unavailable');
      return null;
    }
  }, [apiBase, applySnapshot]);

  useEffect(() => {
    function route() {
      const next = currentSlug();
      activeSlug.current = next;
      clearCelebration();
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
    };
  }, [clearCelebration]);

  useEffect(() => {
    setAuthenticated(false);
    setVotedBrands([]);
    setSessionState('loading');
    setSameOrigin(null);
    setPendingBrand(null);
    inFlight.current = false;
    void refreshCounts();
    const onFocus = () => { if (!document.hidden) void refreshCounts(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    const interval = setInterval(onFocus, 30000);
    return () => {
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(interval);
      ++requestVersion.current;
      requestController.current?.abort();
      inFlight.current = false;
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
    if (!brand || inFlight.current || !authenticated || sessionState !== 'ready' || hasVoted) return;
    const endpoint = voteEndpoint(apiBase);
    // The GitHub copy must never submit an authenticated write across origins.
    if (!endpoint.sameOrigin) return;
    const target = brand.slug;
    const version = ++requestVersion.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    inFlight.current = true;
    setPendingBrand(target);
    setVoteState('sending');
    setMessage('');
    let reconcile = false;
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST', credentials: 'same-origin', mode: 'same-origin',
        headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ brand: target }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
      });
      if (version !== requestVersion.current) return;
      if (response.status === 401) {
        setAuthenticated(false);
        setVotedBrands([]);
        setSessionState('ready');
        if (activeSlug.current === target) {
          setVoteState('idle');
          setMessage('ChatGPT 계정으로 다시 로그인한 뒤 추천해 주세요.');
        }
        return;
      }
      if (!response.ok) throw new Error('vote request failed');
      const data = await response.json() as Record<string, unknown>;
      const next = validatedSnapshot(data);
      if (!next.authenticated || !next.votedBrands.includes(target) || typeof data.counted !== 'boolean') throw new Error('vote response incomplete');
      if (version !== requestVersion.current) return;
      applySnapshot(next, true);
      if (activeSlug.current === target) {
        setVoteState('success');
        setMessage(data.counted ? '추천했어요. 다른 프로젝트에도 추천할 수 있습니다.' : '이미 추천한 프로젝트입니다. 다른 프로젝트에도 추천할 수 있습니다.');
        if (data.counted === true) celebrateVote(target);
      }
    } catch {
      if (version !== requestVersion.current) return;
      // A lost response may still have committed. Read server state before offering another action.
      reconcile = true;
      setSessionState('loading');
      if (activeSlug.current === target) {
        setMessage('');
      }
    } finally {
      if (version === requestVersion.current) {
        inFlight.current = false;
        setPendingBrand(null);
      }
    }
    if (reconcile) {
      const refresh = refreshCounts();
      const reconciliationVersion = requestVersion.current;
      const latest = await refresh;
      if (requestVersion.current !== reconciliationVersion || activeSlug.current !== target) return;
      if (latest?.authenticated && latest.votedBrands.includes(target)) {
        setVoteState('success');
        setMessage('추천 완료를 확인했어요. 다른 프로젝트에도 추천할 수 있습니다.');
      } else if (latest && !latest.authenticated) {
        setVoteState('idle');
        setMessage('ChatGPT 계정으로 다시 로그인한 뒤 추천해 주세요.');
      } else {
        setVoteState('error');
        setMessage(latest ? '추천을 완료하지 못했습니다. 다시 시도해 주세요.' : '추천 결과를 확인하지 못했습니다. 연결을 확인한 뒤 다시 확인해 주세요.');
      }
    }
  }

  async function toggleFullscreen() {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await rootRef.current?.requestFullscreen();
    } catch { setMessage('이 브라우저에서는 전체 화면 전환을 지원하지 않습니다.'); }
  }

  const style = brand ? { '--sc-ink': brand.color, '--sc-paper': brand.paper } as CSSProperties : undefined;
  const canonicalProjectUrl = brand ? new URL(`/#/${brand.slug}`, defaultApi).href : new URL('/', defaultApi).href;
  const signInUrl = brand ? `/signin-with-chatgpt?return_to=${encodeURIComponent(`/#/${brand.slug}`)}` : '/signin-with-chatgpt';
  const voteMessage = message || (countError ? '추천 상태를 불러오지 못했습니다. 다시 확인해 주세요.' : '');
  const voteCountLabel = brand && counts ? formatCount(counts[brand.slug]) : '—';
  const checkingVote = sessionState === 'loading' || pendingBrand !== null;
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
          <div className="sc-card-body"><div><h2>{item.slug === 'gounbat' ? item.name : item.englishName}</h2><p>{item.oneLine}</p></div><div className="sc-card-voting"><span className="sc-vote-count" aria-label={counts ? `${item.name} 추천 ${formatCount(counts[item.slug])}건` : `${item.name} 추천 수 불러오는 중`}><ThumbsUp size={17} aria-hidden="true" /><span>{counts ? formatCount(counts[item.slug]) : '—'}</span><small>추천</small></span>{authenticated && votedBrands.includes(item.slug) && <span className="sc-voted-badge"><Check size={12} aria-hidden="true" />추천 완료</span>}</div></div>
          <div className="sc-card-tags">{item.keywords.map(keyword => <span key={keyword}>{keyword}</span>)}<span>{item.boardCount} scenes</span></div>
        </a>)}</div>
      </section>
      <div className="sc-vote-info"><ThumbsUp size={20} aria-hidden="true" /><div><strong>프로젝트별 한 번, 여러 프로젝트에 추천할 수 있어요.</strong><p>{sameOrigin === false ? '프로젝트의 추천 페이지로 이동해 ChatGPT 계정으로 로그인하고 참여할 수 있습니다.' : authenticated ? '추천 여부는 로그인한 ChatGPT 계정을 기준으로 확인합니다. 네 프로젝트 모두 각각 추천할 수 있습니다.' : 'ChatGPT 계정으로 로그인한 뒤, 원하는 프로젝트에서 투표 버튼을 눌러 주세요.'}</p>{countError && <p className="sc-connection-message">{counts ? '최신 추천 상태를 확인하지 못했습니다.' : '추천 수를 불러오지 못했습니다.'} <button type="button" onClick={() => void refreshCounts()}>다시 확인하기</button></p>}</div></div>
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
        <div className={`sc-vote-message ${voteState === 'error' || countError ? 'sc-vote-message-error' : ''}`} role="status" aria-live="polite">{voteMessage}</div>
        {sameOrigin === false ? <a className="sc-fab" href={canonicalProjectUrl} target="_top" aria-label={`${brand.name} 투표 페이지로 이동. ChatGPT 계정으로 로그인한 뒤 프로젝트별 한 번 추천할 수 있습니다.`}><ThumbsUp size={23} strokeWidth={1.8} aria-hidden="true" /><span>투표하기</span><span className="sc-fab-count">{voteCountLabel}</span></a>
          : hasVoted ? <button ref={voteButtonRef} type="button" className={`sc-fab sc-fab-completed${celebration?.brand === brand.slug ? ' sc-fab-celebrate' : ''}`} disabled aria-label={`${brand.name} 추천 완료. 현재 추천 ${voteCountLabel}건`}><Check size={23} strokeWidth={1.8} aria-hidden="true" /><span>추천 완료</span><span className="sc-fab-count">{voteCountLabel}</span></button>
          : sessionState === 'ready' && !authenticated ? <a className="sc-fab" href={signInUrl} target="_top" aria-label={`${brand.name} 추천을 위해 ChatGPT 계정으로 로그인하기. 로그인 후 투표 버튼을 눌러 주세요.`}><ThumbsUp size={23} strokeWidth={1.8} aria-hidden="true" /><span>로그인하고 투표</span><span className="sc-fab-count">{voteCountLabel}</span></a>
          : <button ref={voteButtonRef} type="button" className="sc-fab" onClick={() => { if (sessionState === 'unavailable') { setMessage(''); setSessionState('loading'); void refreshCounts(); } else void vote(); }} disabled={checkingVote || sameOrigin === null} aria-busy={checkingVote} aria-label={`${brand.name} ${sessionState === 'unavailable' ? '추천 상태 다시 확인' : checkingVote ? '추천 상태 확인 중' : '투표하기. 프로젝트별 한 번 추천할 수 있습니다.'} 현재 추천 ${voteCountLabel}`}>
            <ThumbsUp size={23} strokeWidth={1.8} aria-hidden="true" /><span>{pendingBrand ? '반영 중' : sessionState === 'loading' ? '확인 중' : sessionState === 'unavailable' ? '다시 확인' : '투표하기'}</span><span className="sc-fab-count">{voteCountLabel}</span>
          </button>}
        <span className="sc-vote-policy">프로젝트별 1회 · 다른 프로젝트도 추천 가능{(sameOrigin === false || (sessionState === 'ready' && !authenticated)) && <span className="sc-vote-login">{sameOrigin === false ? '투표 페이지에서 ChatGPT 계정으로 로그인해 주세요.' : 'ChatGPT 로그인 후 투표 버튼을 눌러 주세요.'}</span>}</span>
      </aside>
    </>}
    {celebration && celebration.brand === slug && <div key={celebration.id} className="sc-celebration" aria-hidden="true" style={{ '--like-origin-x': `${celebration.x}px`, '--like-origin-y': `${celebration.y}px` } as CSSProperties}>
      {[0, 1, 2].map(wave => <span key={wave} className="sc-like-ring" style={{ animationDelay: `${wave * 380}ms` }} />)}
      {celebration.particles.map(particle => <span key={particle.id} data-wave={particle.wave} className={`sc-like-particle sc-like-${particle.tone}${particle.hero ? ' sc-like-hero' : ''}`} style={particle.style}>
        <span className="sc-like-bubble"><ThumbsUp strokeWidth={1.65} fill="currentColor" aria-hidden="true" /></span>
      </span>)}
    </div>}
    <dialog ref={dialogRef} className="sc-lightbox" onClose={() => setLightbox(null)} onClick={event => { if (event.target === event.currentTarget) setLightbox(null); }}>
      <div className="sc-lightbox-bar"><span>{brand?.englishName} · {lightbox?.name}</span><button type="button" className="sc-icon-button" aria-label="장표 확대 닫기" onClick={() => setLightbox(null)}><X size={24} /></button></div>
      {lightbox && <div className="sc-lightbox-scroll"><img src={lightbox.src} alt={lightbox.name} width={lightbox.width} height={lightbox.height} /></div>}
    </dialog>
  </div>;
}
