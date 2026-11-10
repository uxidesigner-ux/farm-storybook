// content/*.json → Storybook MDX, 화면용 메타데이터, 문서별 Markdown을 생성한다.
// 문서 코드와 공유 ID는 원본 JSON에 적힌 값을 그대로 쓴다(배열 순서·제목에서 만들지 않는다).
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS, PAGES, docMarkdownPath, docStoryId, docStoryTitle, markdownFor, pageStoryId, readJson, root } from './lib/content.mjs';

const source = readJson('content/guide-data.json');
const plusx = readJson('content/plusx-research.json');
const at = (...parts) => path.join(root, ...parts);
const write = (file, text) => { fs.mkdirSync(path.dirname(at(file)), { recursive: true }); fs.writeFileSync(at(file), text); };

const documents = source.documents.map((doc) => ({
  ...doc,
  storyTitle: docStoryTitle(doc),
  storyId: docStoryId(doc),
  markdownHref: `./${docMarkdownPath(doc)}`,
}));

// 컴포넌트·스토리 수는 스토리 파일에서 센다(홈 화면의 현황 숫자에 사용).
const componentDir = at('src/stories/components');
const componentFiles = fs.readdirSync(componentDir).filter((file) => /\.stories\.tsx?$/.test(file));
const storyCount = componentFiles.reduce((sum, file) => sum + (fs.readFileSync(path.join(componentDir, file), 'utf8').match(/^export const \w+/gm) || []).length, 0);

fs.copyFileSync(at('content/benchmarks.json'), at('public/downloads/benchmarks.json'));
fs.copyFileSync(at('content/guide-data.json'), at('public/downloads/guide-data.json'));
fs.copyFileSync(at('content/plusx-research.json'), at('public/downloads/plusx-research.json'));

fs.rmSync(at('public/downloads/docs'), { recursive: true, force: true });
for (const doc of documents) write(`public/${docMarkdownPath(doc)}`, markdownFor(doc));

const assets = Object.fromEntries(ASSETS.map((asset) => [asset.id, { href: `./${asset.path}`, bytes: fs.statSync(at('public', asset.path)).size }]));
const routes = Object.fromEntries(PAGES.map((page) => [page.key, pageStoryId(page)]));
const stats = {
  documents: documents.length,
  sections: documents.reduce((sum, doc) => sum + doc.sections.length, 0),
  components: componentFiles.length,
  stories: storyCount,
  plusxProjects: plusx.counts.projects,
  plusxDeepDives: plusx.counts.deepDives,
  plusxStaticVisuals: plusx.counts.staticVisuals,
};
write('src/generated/documents.json', `${JSON.stringify({ documents, routes, assets, stats }, null, 2)}\n`);

const mdx = (id, title, component, props = '') => `{/* 자동 생성 파일입니다. scripts/generate-content.mjs와 content/*.json을 수정하세요. */}
import { Meta } from '@storybook/addon-docs/blocks';
import { ${component} } from '../pages/${component}';

<Meta id=${JSON.stringify(id)} title=${JSON.stringify(title)} />

<${component}${props} />
`;
const storyDir = at('src/stories');
for (const file of fs.readdirSync(storyDir)) if (file.endsWith('.mdx')) fs.unlinkSync(path.join(storyDir, file));
for (const doc of documents) write(`src/stories/doc-${doc.id}.mdx`, mdx(`doc-${doc.id}`, doc.storyTitle, 'GuidePage', ` documentId=${JSON.stringify(doc.id)}`));
for (const page of PAGES) write(`src/stories/${page.file}.mdx`, mdx(page.id, page.title, page.component));

console.log(`생성 완료: 문서 ${documents.length}개(${stats.sections}개 절), 색인 화면 ${PAGES.length}개, 컴포넌트 ${stats.components}종·스토리 ${stats.stories}개.`);
