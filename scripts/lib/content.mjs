// 생성·검증 스크립트가 함께 쓰는 콘텐츠 규칙.
// 공유 URL은 여기서 정한 고정 ID로 만들어지므로, 제목이나 배열 순서를 바꿔도 주소가 유지된다.
import fs from 'node:fs';
import path from 'node:path';

export const root = process.cwd();
export const CATEGORIES = ['BX', '디자인', '개발', '마케팅', '운영'];
export const STATUSES = ['리서치 완료', '검토 중', '초안', '운영 기준'];
export const ID_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
export const CODE_PATTERN = /^[A-Z]{1,4}\d{2}$/;

/** 문서가 아닌 색인·도구 화면. id는 Storybook 문서 ID의 앞부분으로 고정된다. */
export const PAGES = [
  { key: 'home', id: 'home', file: 'home', title: '시작하기/H01 프로젝트 홈', component: 'HomePage' },
  { key: 'explore', id: 'explore', file: 'explore', title: '시작하기/H02 문서 탐색', component: 'ExplorePage' },
  { key: 'benchmarks', id: 'benchmarks', file: 'benchmarks', title: 'BX/B00 글로벌 벤치마크', component: 'BenchmarkPage' },
  { key: 'tokens', id: 'tokens', file: 'tokens', title: '디자인/D00 디자인 토큰', component: 'TokensPage' },
  { key: 'archive', id: 'archive', file: 'archive', title: '자료실/A01 산출물 다운로드', component: 'ArchivePage' },
];

/** 원본 산출물. path는 public/ 기준이며 화면에서는 상대 경로(./downloads/…)로 연결한다. */
export const ASSETS = [
  { id: 'research', path: 'downloads/premium_vegetables_BX_research_20261110.pdf' },
  { id: 'wbs', path: 'downloads/premium_vegetables_features_WBS_roles_v1.xlsx' },
  { id: 'template', path: 'downloads/guide-template.md' },
  { id: 'guide-data', path: 'downloads/guide-data.json' },
  { id: 'benchmarks-data', path: 'downloads/benchmarks.json' },
];

export const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
export const docStoryId = (doc) => `doc-${doc.id}--docs`;
export const pageStoryId = (page) => `${page.id}--docs`;
export const docStoryTitle = (doc) => `${doc.category}/${doc.code} ${doc.title}`;
export const docMarkdownPath = (doc) => `downloads/docs/${doc.id}.md`;

const cell = (value) => String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function markdownFor(doc) {
  const out = [`# ${doc.title}`, '', `> ${doc.code} · ${doc.category} · 상태: ${doc.status} · 갱신: ${doc.updatedAt}`, '', doc.summary, ''];
  for (const section of doc.sections) {
    out.push(`## ${section.title}`, '');
    for (const paragraph of section.body) out.push(paragraph, '');
    if (section.bullets?.length) out.push(...section.bullets.map((item) => `- ${item}`), '');
    if (section.table) {
      out.push(`| ${section.table.headers.map(cell).join(' | ')} |`, `| ${section.table.headers.map(() => '---').join(' | ')} |`);
      out.push(...section.table.rows.map((row) => `| ${row.map(cell).join(' | ')} |`), '');
    }
    if (section.callout) out.push(`> **${section.callout.title}**`, `> ${section.callout.body}`, '');
  }
  if (doc.sources?.length) out.push('## 출처', '', ...doc.sources.map((source) => `- [${source.label}](${source.url})`), '');
  return out.join('\n');
}
