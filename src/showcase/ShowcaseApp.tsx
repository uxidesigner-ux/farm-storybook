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
type VoteSnapshot = { counts: Counts; votedBrands: string[] };
type BrowserVoteRecord = { version: 1; id: string; votedBrands: string[] };
type BrowserVoteSnapshot = VoteSnapshot & { browserId: string };
type LikeParticle = { id: number; wave: number; hero: boolean; tone: 'blue' | 'ice' | 'brand'; style: CSSProperties };
type VoteCelebration = { id: number; brand: string; x: number; y: number; particles: LikeParticle[] };
const celebrationLifetime = 4900;
const formatCount = (n: number) => new Intl.NumberFormat('ko-KR').format(n);
const slugs = portfolio.brands.map(brand => brand.slug);
const defaultApi = 'https://farm-bx-showcase.james8101.chatgpt.site/api/votes';
const browserVoteStorageKey = 'farm-bx-showcase:browser-votes:v1';
const browserIdPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const storageFailureMessage = '이 브라우저에 추천 기록을 저장할 수 없습니다. 사이트 데이터 저장을 허용한 뒤 다시 확인해 주세요.';

class BrowserStorageError extends Error {}
class BrowserIdentityChangedError extends Error {}

function parsedBrowserRecord(value: string): BrowserVoteRecord {
  let raw: Record<string, unknown>;
  try { raw = JSON.parse(value) as Record<string, unknown>; }
  catch { throw new BrowserStorageError('저장된 추천 기록을 읽지 못했습니다. 이 사이트의 브라우저 데이터를 확인한 뒤 다시 시도해 주세요.'); }
  if (!raw || raw.version !== 1 || typeof raw.id !== 'string' || !browserIdPattern.test(raw.id) ||
    !Array.isArray(raw.votedBrands) || !raw.votedBrands.every(brand => typeof brand === 'string' && slugs.includes(brand))) {
    throw new BrowserStorageError('저장된 추천 기록을 읽지 못했습니다. 이 사이트의 브라우저 데이터를 확인한 뒤 다시 시도해 주세요.');
  }
  return { version: 1, id: raw.id.toLowerCase(), votedBrands: slugs.filter(brand => (raw.votedBrands as string[]).includes(brand)) };
}

function readBrowserRecord(create = true): BrowserVoteRecord {
  try {
    const storage = window.localStorage;
    const saved = storage.getItem(browserVoteStorageKey);
    if (saved !== null) return parsedBrowserRecord(saved);
    if (!create) throw new BrowserIdentityChangedError();
    const initial: BrowserVoteRecord = { version: 1, id: window.crypto.randomUUID(), votedBrands: [] };
    storage.setItem(browserVoteStorageKey, JSON.stringify(initial));
    // Re-read the shared value: another tab may have initialized this browser at the same time.
    const confirmed = storage.getItem(browserVoteStorageKey);
    if (confirmed === null) throw new BrowserStorageError(storageFailureMessage);
    return parsedBrowserRecord(confirmed);
  } catch (error) {
    if (error instanceof BrowserStorageError || error instanceof BrowserIdentityChangedError) throw error;
    throw new BrowserStorageError(storageFailureMessage);
  }
}

function persistBrowserSnapshot(id: string, votedBrands: string[]) {
  const current = readBrowserRecord(false);
  if (current.id !== id) throw new BrowserIdentityChangedError();
  try {
    // Only server-confirmed markers are persisted; counts always come from the server.
    window.localStorage.setItem(browserVoteStorageKey, JSON.stringify({ version: 1, id, votedBrands: slugs.filter(brand => votedBrands.includes(brand)) }));
    if (readBrowserRecord(false).id !== id) throw new BrowserIdentityChangedError();
  } catch (error) {
    if (error instanceof BrowserStorageError || error instanceof BrowserIdentityChangedError) throw error;
    throw new BrowserStorageError(storageFailureMessage);
  }
}

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
  if (raw.identityMode !== 'browser' || raw.toggleVotesAllowed !== true || raw.duplicateVotesAllowed !== false || raw.multipleProjectsAllowed !== true ||
    !Array.isArray(raw.votedBrands) || !raw.votedBrands.every(value => typeof value === 'string' && slugs.includes(value))) throw new Error('추천 상태를 확인하지 못했습니다.');
  return { counts: validatedCounts(raw.counts), votedBrands: [...new Set(raw.votedBrands as string[])] };
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
  const [storageError, setStorageError] = useState('');
  const [votedBrands, setVotedBrands] = useState<string[]>([]);
  const [sessionState, setSessionState] = useState<SessionState>('loading');
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
  const browserIdRef = useRef<string | null>(null);
  const refreshQueued = useRef(false);
  const requestVersion = useRef(0);
  const requestController = useRef<AbortController | null>(null);
  const activeSlug = useRef<string | null>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const brand = portfolio.brands.find(item => item.slug === slug);
  const nextBrand = brand ? portfolio.brands[(portfolio.brands.indexOf(brand) + 1) % portfolio.brands.length] : null;
  const hasVoted = Boolean(brand && votedBrands.includes(brand.slug));

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

  const applySnapshot = useCallback((next: VoteSnapshot, browserId: string) => {
    persistBrowserSnapshot(browserId, next.votedBrands);
    browserIdRef.current = browserId;
    setCounts(next.counts);
    setVotedBrands(next.votedBrands);
    setSessionState('ready');
    setCountError(false);
    setStorageError('');
    setVoteState('idle');
    setMessage('');
    if (activeSlug.current && !next.votedBrands.includes(activeSlug.current)) clearCelebration();
  }, [clearCelebration]);

  const refreshCounts = useCallback(async (): Promise<BrowserVoteSnapshot | null> => {
    if (inFlight.current) { refreshQueued.current = true; return null; }
    refreshQueued.current = false;
    const version = ++requestVersion.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    try {
      // Retry once if another tab replaced the browser record while this read was in flight.
      for (let attempt = 0; attempt < 2; attempt++) {
        const record = readBrowserRecord();
        if (browserIdRef.current !== record.id) {
          browserIdRef.current = record.id;
          setVotedBrands(record.votedBrands);
          setSessionState('loading');
          clearCelebration();
        }
        setStorageError('');
        const endpoint = voteEndpoint(apiBase);
        const response = await fetch(endpoint.url, {
          cache: 'no-store', credentials: 'omit',
          headers: { 'X-Farm-Browser-Id': record.id },
          mode: endpoint.sameOrigin ? 'same-origin' : 'cors',
          signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
        });
        if (!response.ok) throw new Error('count request failed');
        const next = validatedSnapshot(await response.json());
        if (version !== requestVersion.current) return null;
        try { applySnapshot(next, record.id); }
        catch (error) { if (error instanceof BrowserIdentityChangedError && attempt === 0) continue; throw error; }
        return { ...next, browserId: record.id };
      }
      return null;
    } catch (error) {
      if (version !== requestVersion.current) return null;
      setCountError(true);
      setSessionState('unavailable');
      if (error instanceof BrowserStorageError) setStorageError(error.message);
      else if (error instanceof BrowserIdentityChangedError) setMessage('브라우저의 추천 기록이 변경되었습니다. 다시 확인해 주세요.');
      return null;
    }
  }, [apiBase, applySnapshot, clearCelebration]);

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
    browserIdRef.current = null;
    setVotedBrands([]);
    setSessionState('loading');
    setStorageError('');
    setPendingBrand(null);
    inFlight.current = false;
    void refreshCounts();
    const onFocus = () => { if (!document.hidden) void refreshCounts(); };
    const onStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === browserVoteStorageKey) {
        setMessage('');
        void refreshCounts();
      }
    };
    window.addEventListener('focus', onFocus);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onFocus);
    const interval = setInterval(onFocus, 30000);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onFocus);
      clearInterval(interval);
      ++requestVersion.current;
      requestController.current?.abort();
      inFlight.current = false;
      refreshQueued.current = false;
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
    if (!brand || inFlight.current || sessionState !== 'ready') return;
    let record: BrowserVoteRecord;
    try {
      record = readBrowserRecord();
      persistBrowserSnapshot(record.id, record.votedBrands);
    }
    catch (error) {
      setStorageError(error instanceof BrowserStorageError ? error.message : storageFailureMessage);
      setSessionState('unavailable');
      return;
    }
    if (record.id !== browserIdRef.current) {
      setMessage('브라우저의 추천 기록이 변경되어 최신 상태를 확인하고 있어요.');
      setSessionState('loading');
      void refreshCounts();
      return;
    }
    const endpoint = voteEndpoint(apiBase);
    const target = brand.slug;
    const recommended = !hasVoted;
    const browserId = record.id;
    const version = ++requestVersion.current;
    requestController.current?.abort();
    const controller = new AbortController();
    requestController.current = controller;
    inFlight.current = true;
    setPendingBrand(target);
    setVoteState('sending');
    setMessage('');
    clearCelebration();
    let reconcile = false;
    try {
      const response = await fetch(endpoint.url, {
        method: 'POST', credentials: 'omit', mode: endpoint.sameOrigin ? 'same-origin' : 'cors',
        headers: { 'Content-Type': 'application/json', 'X-Farm-Browser-Id': browserId },
        body: JSON.stringify({ brand: target, recommended }),
        signal: AbortSignal.any([controller.signal, AbortSignal.timeout(12000)]),
      });
      if (version !== requestVersion.current) return;
      if (!response.ok) throw new Error('vote request failed');
      const data = await response.json() as Record<string, unknown>;
      const next = validatedSnapshot(data);
      if (typeof data.changed !== 'boolean' || data.recommended !== recommended || next.votedBrands.includes(target) !== recommended) throw new Error('vote response incomplete');
      if (version !== requestVersion.current) return;
      applySnapshot(next, browserId);
      if (activeSlug.current === target) {
        setVoteState('success');
        setMessage(recommended
          ? data.changed ? '추천했어요. 다시 누르면 해제할 수 있어요.' : '이미 추천한 상태입니다. 다시 누르면 해제할 수 있어요.'
          : data.changed ? '추천을 해제했어요. 언제든 다시 추천할 수 있습니다.' : '추천이 해제된 상태입니다.');
        if (data.changed === true && data.recommended === true) celebrateVote(target);
      }
    } catch (error) {
      if (version !== requestVersion.current) return;
      // Reconcile a lost response before allowing another explicit desired-state request.
      reconcile = true;
      setSessionState('loading');
      if (error instanceof BrowserStorageError) setStorageError(error.message);
      if (activeSlug.current === target) {
        setMessage('');
      }
    } finally {
      if (version === requestVersion.current) {
        inFlight.current = false;
        setPendingBrand(null);
      }
    }
    if (reconcile || refreshQueued.current) {
      const refresh = refreshCounts();
      const reconciliationVersion = requestVersion.current;
      const latest = await refresh;
      if (!reconcile || requestVersion.current !== reconciliationVersion || activeSlug.current !== target) return;
      if (latest && latest.browserId !== browserId) {
        setVoteState('idle');
        setMessage('브라우저 기록이 변경되어 최신 상태로 갱신했어요. 원하는 상태를 다시 선택해 주세요.');
      } else if (latest && latest.votedBrands.includes(target) === recommended) {
        setVoteState('success');
        setMessage(recommended ? '추천 완료를 확인했어요. 다시 누르면 해제할 수 있어요.' : '추천 해제를 확인했어요.');
      } else {
        setVoteState('error');
        setMessage(latest ? '추천 상태를 변경하지 못했습니다. 다시 눌러 주세요.' : '추천 결과를 확인하지 못했습니다. 연결을 확인한 뒤 다시 확인해 주세요.');
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
  const voteMessage = storageError || message || (countError ? '추천 상태를 불러오지 못했습니다. 다시 확인해 주세요.' : '');
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
          <div className="sc-card-body"><div><h2>{item.slug === 'gounbat' ? item.name : item.englishName}</h2><p>{item.oneLine}</p></div><div className="sc-card-voting"><span className="sc-vote-count" aria-label={counts ? `${item.name} 추천 ${formatCount(counts[item.slug])}건` : `${item.name} 추천 수 불러오는 중`}><ThumbsUp size={17} aria-hidden="true" /><span>{counts ? formatCount(counts[item.slug]) : '—'}</span><small>추천</small></span>{votedBrands.includes(item.slug) && <span className="sc-voted-badge"><Check size={12} aria-hidden="true" />추천 완료</span>}</div></div>
          <div className="sc-card-tags">{item.keywords.map(keyword => <span key={keyword}>{keyword}</span>)}<span>{item.boardCount} scenes</span></div>
        </a>)}</div>
      </section>
      <div className="sc-vote-info"><ThumbsUp size={20} aria-hidden="true" /><div><strong>마음에 드는 프로젝트를 추천하고, 다시 눌러 해제하세요.</strong><p>로그인 없이 네 프로젝트에 각각 추천할 수 있어요. 추천 기록은 접속한 사이트와 브라우저별로 저장됩니다.<br />다른 브라우저를 사용하거나 사이트 데이터를 지우면 새 기록으로 시작합니다.</p>{(countError || storageError) && <p className="sc-connection-message">{storageError || (counts ? '최신 추천 상태를 확인하지 못했습니다.' : '추천 수를 불러오지 못했습니다.')} <button type="button" onClick={() => { setMessage(''); void refreshCounts(); }}>다시 확인하기</button></p>}</div></div>
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
        <div className={`sc-vote-message ${voteState === 'error' || countError || storageError ? 'sc-vote-message-error' : ''}`} role="status" aria-live="polite">{voteMessage}</div>
        <button ref={voteButtonRef} type="button" className={`sc-fab${hasVoted ? ' sc-fab-completed' : ''}${hasVoted && celebration?.brand === brand.slug ? ' sc-fab-celebrate' : ''}`} onClick={() => { if (sessionState === 'unavailable') { setMessage(''); setSessionState('loading'); void refreshCounts(); } else void vote(); }} disabled={checkingVote} aria-pressed={hasVoted} aria-busy={checkingVote} aria-label={`${brand.name} ${sessionState === 'unavailable' ? '추천 상태 다시 확인' : checkingVote ? '추천 상태 반영 중' : hasVoted ? '추천 해제하기' : '투표하기'}. 현재 추천 ${voteCountLabel}건`}>
          {hasVoted ? <Check size={23} strokeWidth={1.8} aria-hidden="true" /> : <ThumbsUp size={23} strokeWidth={1.8} aria-hidden="true" />}<span>{pendingBrand ? '반영 중' : sessionState === 'loading' ? '확인 중' : sessionState === 'unavailable' ? '다시 확인' : hasVoted ? '추천 완료' : '투표하기'}</span><span className="sc-fab-count">{voteCountLabel}</span>
        </button>
        <span className="sc-vote-policy">{hasVoted ? '다시 누르면 추천 해제' : '네 프로젝트에 각각 추천할 수 있어요'}<span className="sc-vote-storage">로그인 없이 이 브라우저에 저장</span></span>
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
