import generated from './generated/documents.json';
import research from '../content/benchmarks.json';
import type { Brand, Category, GuideDocument } from './types';
export const documents = generated.documents as GuideDocument[];
export const routes = generated.routes;
export const brands = research.brands as Brand[];
export const researchData = research;
export const categoryMeta: Record<Category, { label: string; english: string; description: string; tone: string }> = {
  BX: { label: 'BX', english: 'BRAND EXPERIENCE', description: '왜 존재하고, 어떤 경험을 약속하는가.', tone: 'green' },
  디자인: { label: '디자인', english: 'DESIGN SYSTEM', description: '브랜드의 기준을 보이는 언어로.', tone: 'orange' },
  개발: { label: '개발', english: 'DEVELOPMENT', description: '같은 기준으로 만들고 연결하는 방법.', tone: 'blue' },
  마케팅: { label: '마케팅', english: 'MARKETING', description: '가치를 전달하고 반응을 확인하는 방법.', tone: 'purple' },
  운영: { label: '운영', english: 'WORKING TOGETHER', description: '기록과 의사결정을 함께 이어가는 방법.', tone: 'neutral' },
};
export const files = [
 { id: 'research', type: 'PDF', title: '프리미엄 농작물 BX 리서치', description: '국내 12 · 해외 23개 비교, 브랜드 전략과 검증 계획', detail: '23쪽 · 172 KB', version: 'v1.0', status: '리서치 완료', href: './downloads/premium_vegetables_BX_research_20261110.pdf' },
 { id: 'wbs', type: 'XLSX', title: '기능 정의 · WBS · 필요 직군', description: '구축 작업, 선행 조건, 담당 역량을 정리한 계획', detail: 'Excel · 78 KB', version: 'v1.0', status: '초안', href: './downloads/premium_vegetables_features_WBS_roles_v1.xlsx' },
 { id: 'template', type: 'MD', title: '새 문서 작성 템플릿', description: '목적, 근거, 제안, 적용 기준과 변경 기록의 공통 형식', detail: 'Markdown', version: 'v1.0', status: '운영 기준', href: './downloads/guide-template.md' },
];
export function bookHref(storyId: string, kind: 'docs' | 'story' = 'docs') {
  return `./?path=/${kind}/${encodeURIComponent(storyId)}`;
}
export function absoluteBookUrl(storyId: string) {
  const url = new URL(bookHref(storyId), window.location.href);
  return url.href;
}
export function docById(id: string) { return documents.find(doc => doc.id === id); }
export function normalize(value: string) { return value.normalize('NFKC').toLocaleLowerCase('ko-KR').trim(); }
export function matchesDoc(doc: GuideDocument, query: string) {
  if (!query) return true;
  const text = normalize([doc.title, doc.summary, doc.category, ...doc.tags, ...doc.sections.flatMap(s => [s.title, ...s.body, ...(s.bullets || [])])].join(' '));
  return normalize(query).split(/\s+/).every(term => text.includes(term));
}
export async function copyText(value: string) {
  if (!navigator.clipboard?.writeText) throw new Error('이 환경에서는 자동 복사를 지원하지 않습니다. 주소를 직접 복사해주세요.');
  await navigator.clipboard.writeText(value);
}
export function markdownFor(doc: GuideDocument) {
  return `# ${doc.title}\n\n> ${doc.status} · ${doc.updatedAt} · ${doc.category}\n\n${doc.summary}\n\n` + doc.sections.map(s => `## ${s.title}\n\n${s.body.join('\n\n')}\n\n${s.bullets ? s.bullets.map(b => `- ${b}`).join('\n') + '\n\n' : ''}${s.table ? `| ${s.table.headers.join(' | ')} |\n| ${s.table.headers.map(() => '---').join(' | ')} |\n${s.table.rows.map(r => `| ${r.join(' | ')} |`).join('\n')}\n\n` : ''}${s.callout ? `> **${s.callout.title}**\n> ${s.callout.body}\n\n` : ''}`).join('') + (doc.sources?.length ? `## 출처\n\n${doc.sources.map(s => `- [${s.label}](${s.url})`).join('\n')}` : '');
}
export function downloadText(filename: string, text: string, mime = 'text/markdown;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement('a'); a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
