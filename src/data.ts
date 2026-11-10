import generated from './generated/documents.json';
import research from '../content/benchmarks.json';
import type { ArchiveFile, Brand, Category, DocStatus, GuideDocument } from './types';

export const documents = generated.documents as GuideDocument[];
export const routes = generated.routes;
export const stats = generated.stats;
export const brands = research.brands as Brand[];
export const researchData = research;

export const categories: Category[] = ['BX', '디자인', '개발', '마케팅', '운영'];
export const statuses: DocStatus[] = ['리서치 완료', '검토 중', '초안', '운영 기준'];
export const categoryMeta: Record<Category, { label: string; english: string; description: string; tone: string }> = {
  BX: { label: 'BX', english: 'BRAND EXPERIENCE', description: '왜 존재하고, 어떤 경험을 약속하는가.', tone: 'green' },
  디자인: { label: '디자인', english: 'DESIGN SYSTEM', description: '브랜드의 기준을 보이는 언어로.', tone: 'orange' },
  개발: { label: '개발', english: 'DEVELOPMENT', description: '같은 기준으로 만들고 연결하는 방법.', tone: 'blue' },
  마케팅: { label: '마케팅', english: 'MARKETING', description: '가치를 전달하고 반응을 확인하는 방법.', tone: 'purple' },
  운영: { label: '운영', english: 'WORKING TOGETHER', description: '기록과 의사결정을 함께 이어가는 방법.', tone: 'neutral' },
};
/** 상태는 문서의 성숙도다. 사업 결정이 확정됐다는 뜻으로 읽히지 않도록 설명을 함께 보여준다. */
export const statusMeta: Record<DocStatus, { short: string; note: string }> = {
  '리서치 완료': { short: '조사와 정리를 마친 자료', note: '조사 범위 안에서 사실 확인을 마친 자료입니다. 여기서 도출한 해석과 제안은 확정된 전략이 아닙니다.' },
  '검토 중': { short: '결정 전 검토안', note: '의사결정을 위해 검토 중인 안입니다. 농가·고객 검증 전에는 확정된 기준으로 사용하지 않습니다.' },
  초안: { short: '첫 제안', note: '논의를 시작하기 위한 첫 제안입니다. 내용이 크게 바뀔 수 있습니다.' },
  '운영 기준': { short: '문서 공간의 작업 기준', note: '이 문서 공간과 협업 방식에 지금 적용하는 기준입니다. 상품 브랜드나 사업 전략의 확정을 뜻하지 않습니다.' },
};

const size = (bytes: number) => (bytes < 1024 ? `${bytes} B` : bytes < 1024 * 1024 ? `${Math.round(bytes / 1024)} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`);
const asset = (id: keyof typeof generated.assets) => generated.assets[id];
export const files: ArchiveFile[] = [
  { id: 'research', type: 'PDF', title: '프리미엄 농작물 BX 리서치', description: '국내 12 · 해외 23개 비교, 브랜드 전략과 검증 계획', detail: `23쪽 · ${size(asset('research').bytes)}`, version: 'v1.0', status: '리서치 완료', href: asset('research').href },
  { id: 'wbs', type: 'XLSX', title: '기능 정의 · WBS · 필요 직군', description: '구축 작업, 선행 조건, 담당 역량을 정리한 계획', detail: `Excel · ${size(asset('wbs').bytes)}`, version: 'v1.0', status: '초안', href: asset('wbs').href },
  { id: 'template', type: 'MD', title: '새 문서 작성 템플릿', description: '목적, 근거, 제안, 적용 기준과 변경 기록의 공통 형식', detail: `Markdown · ${size(asset('template').bytes)}`, version: 'v1.0', status: '운영 기준', href: asset('template').href },
];
export const dataFiles: ArchiveFile[] = [
  { id: 'guide-data', type: 'JSON', title: '문서 원본 데이터', description: `가이드 문서 ${stats.documents}개의 본문·표·출처·상태를 담은 구조화 데이터`, detail: `JSON · ${size(asset('guide-data').bytes)}`, version: 'v1.0', status: '운영 기준', href: asset('guide-data').href },
  { id: 'benchmarks-data', type: 'JSON', title: '벤치마크 원본 데이터', description: `비교 사례 ${brands.length}개의 관찰 사실·해석·공식 출처와 가격 관찰`, detail: `JSON · ${size(asset('benchmarks-data').bytes)}`, version: 'v1.0', status: '리서치 완료', href: asset('benchmarks-data').href },
];

export function bookHref(storyId: string, kind: 'docs' | 'story' = 'docs') {
  return `./?path=/${kind}/${encodeURIComponent(storyId)}`;
}
export function absoluteBookUrl(storyId: string) {
  return new URL(bookHref(storyId), window.location.href).href;
}
export function docById(id: string) { return documents.find(doc => doc.id === id); }
export function normalize(value: string) { return value.normalize('NFKC').toLocaleLowerCase('ko-KR').trim(); }
export function terms(query: string) { return normalize(query).split(/\s+/).filter(Boolean); }

/** 본문 검색용 텍스트 조각. 제목·요약·태그뿐 아니라 절 본문·목록·표·안내 박스까지 포함한다. */
function docParts(doc: GuideDocument) {
  return [
    { where: '제목', text: `${doc.code} ${doc.title}` },
    { where: '요약', text: doc.summary },
    { where: '태그', text: [doc.category, doc.status, ...doc.tags].join(' · ') },
    ...doc.sections.flatMap(section => [
      { where: section.title, text: section.title },
      ...section.body.map(text => ({ where: section.title, text })),
      ...(section.bullets ?? []).map(text => ({ where: section.title, text })),
      ...(section.table ? [section.table.headers, ...section.table.rows].map(row => ({ where: `${section.title} · 표`, text: row.join(' · ') })) : []),
      ...(section.callout ? [{ where: section.title, text: `${section.callout.title} — ${section.callout.body}` }] : []),
    ]),
    ...(doc.sources ?? []).map(source => ({ where: '출처', text: source.label })),
  ];
}
export function matchesDoc(doc: GuideDocument, query: string) {
  const list = terms(query);
  if (!list.length) return true;
  const text = normalize(docParts(doc).map(part => part.text).join(' '));
  return list.every(term => text.includes(term));
}
/** 검색어가 본문 어디에서 발견됐는지 보여줄 발췌. 제목·요약에서만 일치하면 null. */
export function findSnippet(doc: GuideDocument, query: string) {
  const list = terms(query);
  if (!list.length) return null;
  for (const part of docParts(doc).slice(2)) {
    const text = normalize(part.text);
    const term = list.find(item => text.includes(item));
    if (!term) continue;
    const index = text.indexOf(term);
    const start = Math.max(0, index - 36);
    const end = Math.min(part.text.length, index + term.length + 64);
    return { where: part.where, text: `${start > 0 ? '…' : ''}${part.text.slice(start, end)}${end < part.text.length ? '…' : ''}` };
  }
  return null;
}

export async function copyText(value: string) {
  try {
    if (!navigator.clipboard?.writeText) throw new Error('clipboard unavailable');
    await navigator.clipboard.writeText(value);
  } catch {
    // 권한이 막힌 환경을 위한 두 번째 시도. 이것도 실패하면 호출한 쪽에서 주소를 직접 보여준다.
    const area = document.createElement('textarea');
    area.value = value; area.setAttribute('readonly', ''); area.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(area); area.select();
    let copied = false;
    try { copied = document.execCommand('copy'); } catch { copied = false; }
    area.remove();
    if (!copied) throw new Error('이 환경에서는 자동 복사를 지원하지 않습니다. 주소를 직접 복사해주세요.');
  }
}

/** Storybook 안에서는 새로고침 없이 문서를 전환하고, 단독으로 열린 경우에는 일반 링크로 이동한다. */
export async function openBook(storyId: string) {
  if (window.parent === window) return false;
  try {
    const { addons } = await import('storybook/preview-api');
    addons.getChannel().emit('selectStory', { storyId });
    return true;
  } catch { return false; }
}
export const SEARCH_HANDOFF_KEY = 'fieldnotes:explore';
export function handOffSearch(state: { query?: string; category?: string; status?: string }) {
  try { window.sessionStorage.setItem(SEARCH_HANDOFF_KEY, JSON.stringify(state)); } catch { /* 저장소가 막힌 환경에서는 빈 검색으로 연다 */ }
}
export function takeSearchHandOff(): { query?: string; category?: string; status?: string } {
  try {
    const raw = window.sessionStorage.getItem(SEARCH_HANDOFF_KEY);
    window.sessionStorage.removeItem(SEARCH_HANDOFF_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}
