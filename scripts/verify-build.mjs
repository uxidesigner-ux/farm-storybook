// 정적 빌드 검사: dist/index.json의 실제 Storybook ID, 다운로드 파일, 하위 경로 배포용 상대 경로.
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS, PAGES, docMarkdownPath, docStoryId, pageStoryId, readJson, root } from './lib/content.mjs';

const dist = path.join(root, 'dist');
const errors = [];
const fail = (message) => errors.push(message);
if (!fs.existsSync(path.join(dist, 'index.json'))) { console.error('dist/index.json이 없습니다. npm run build를 먼저 실행하세요.'); process.exit(1); }

const { entries } = JSON.parse(fs.readFileSync(path.join(dist, 'index.json'), 'utf8'));
const { documents } = readJson('content/guide-data.json');
const generated = readJson('src/generated/documents.json');
const assetsById = new Map(ASSETS.map((asset) => [asset.id, asset]));

for (const doc of documents) {
  const entry = entries[docStoryId(doc)];
  if (!entry) fail(`문서 ${doc.id}: 빌드에 ${docStoryId(doc)}가 없습니다`);
  else if (entry.type !== 'docs' || entry.title !== `${doc.category}/${doc.code} ${doc.title}`) fail(`문서 ${doc.id}: 빌드된 제목 "${entry.title}"가 원본과 다릅니다`);
  const downloadIds = doc.downloadAssetIds;
  if (downloadIds !== undefined) {
    if (!Array.isArray(downloadIds) || !downloadIds.every((id) => typeof id === 'string' && assetsById.has(id))) fail(`문서 ${doc.id}: downloadAssetIds에 등록되지 않은 자료가 있습니다`);
    else for (const id of downloadIds) {
      if (generated.assets?.[id]?.href !== `./${assetsById.get(id).path}`) fail(`문서 ${doc.id}: 다운로드 자료 ${id}의 생성 경로가 원본과 다릅니다`);
    }
  }
}
if (!PAGES.some((page) => page.key === 'plusx')) fail('Plus X 탐색 화면이 PAGES에 등록되지 않았습니다');
for (const page of PAGES) {
  const entry = entries[pageStoryId(page)];
  if (!entry || entry.type !== 'docs') fail(`화면 ${page.key}: 빌드에 ${pageStoryId(page)}가 없습니다`);
  if (generated.routes[page.key] !== pageStoryId(page)) fail(`화면 ${page.key}: 생성된 경로가 빌드 ID와 다릅니다`);
}

const stories = Object.values(entries).filter((entry) => entry.type === 'story');
const components = new Set(stories.map((entry) => entry.title));
const autodocs = Object.values(entries).filter((entry) => entry.type === 'docs' && entry.id.startsWith('ui-'));
if (components.size !== generated.stats.components) fail(`컴포넌트 수 ${components.size} ≠ 생성 통계 ${generated.stats.components}`);
if (stories.length !== generated.stats.stories) fail(`스토리 수 ${stories.length} ≠ 생성 통계 ${generated.stats.stories}`);
if (autodocs.length !== components.size) fail(`컴포넌트 문서 ${autodocs.length}개 ≠ 컴포넌트 ${components.size}종`);
for (const title of components) { const prefix = stories.find((entry) => entry.title === title).id.split('--')[0]; if (!entries[`${prefix}--docs`]) fail(`컴포넌트 ${title}: ${prefix}--docs 문서가 없습니다`); }
if (!entries['ui-button--docs']) fail('홈·토큰 화면이 연결하는 ui-button--docs가 없습니다');
for (const id of Object.keys(entries)) if (!/^[a-z0-9-]+$/.test(id)) fail(`ID ${id}: 공유 URL에 쓰이는 ID는 영문 소문자·숫자·하이픈만 사용합니다`);
for (const entry of stories) if (!entry.id.startsWith('ui-')) fail(`스토리 ${entry.id}: 컴포넌트 ID는 ui-로 시작해야 합니다`);

const downloads = [...ASSETS.map((asset) => asset.path), ...documents.map(docMarkdownPath)];
for (const file of downloads) {
  const target = path.join(dist, file);
  if (!fs.existsSync(target) || fs.statSync(target).size === 0) fail(`다운로드 dist/${file}이 없거나 비어 있습니다`);
}
// 빌드 안의 다운로드가 현재 원본인지 확인한다. 내용이 다른 오래된 복사본도 실패한다.
for (const [assetId, original] of [['guide-data', 'content/guide-data.json'], ['benchmarks-data', 'content/benchmarks.json'], ['plusx-research-data', 'content/plusx-research.json']]) {
  const asset = assetsById.get(assetId);
  if (!asset) { fail(`구조화 자료 ${assetId}가 ASSETS에 없습니다`); continue; }
  const source = path.join(root, original);
  const target = path.join(dist, asset.path);
  if (!fs.existsSync(source)) fail(`구조화 자료의 원본 ${original}이 없습니다`);
  else if (!fs.existsSync(target) || !fs.readFileSync(target).equals(fs.readFileSync(source))) fail(`다운로드 dist/${asset.path}가 ${original}과 다릅니다. 콘텐츠 생성 후 다시 빌드하세요`);
  if (generated.assets?.[assetId]?.href !== `./${asset.path}`) fail(`구조화 자료 ${assetId}의 생성 경로가 ASSETS와 다릅니다`);
}
for (const file of ['favicon.svg', 'brand-lockup.svg', 'iframe.html', 'index.html']) if (!fs.existsSync(path.join(dist, file))) fail(`dist/${file}이 없습니다`);

// GitHub Pages의 /저장소명/ 하위 경로에서 깨지는 루트 절대 경로(/assets/…)를 찾는다.
for (const file of ['index.html', 'iframe.html']) {
  const html = fs.existsSync(path.join(dist, file)) ? fs.readFileSync(path.join(dist, file), 'utf8') : '';
  const absolute = [...html.matchAll(/(?:src|href)=["'](\/(?!\/)[^"']*)["']/g)].map((match) => match[1]);
  if (absolute.length) fail(`${file}: 루트 절대 경로 ${[...new Set(absolute)].slice(0, 5).join(', ')}`);
}
const sourceAbsolute = [];
const walk = (dir) => { for (const name of fs.readdirSync(dir)) { const file = path.join(dir, name); if (fs.statSync(file).isDirectory()) walk(file); else if (/\.(tsx?|css|html)$/.test(name) && /(?:href|src)=["'{`]+\/(?!\/)|url\(["']?\/(?!\/)/.test(fs.readFileSync(file, 'utf8'))) sourceAbsolute.push(path.relative(root, file)); } };
walk(path.join(root, 'src')); walk(path.join(root, '.storybook'));
if (sourceAbsolute.length) fail(`소스에 루트 절대 경로가 있습니다: ${sourceAbsolute.join(', ')}`);

if (errors.length) {
  console.error(`빌드 검사 실패 (${errors.length}건)`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`빌드 검사 통과: 문서 ${documents.length}개 · 색인 화면 ${PAGES.length}개 · 컴포넌트 ${components.size}종(문서 ${autodocs.length}) · 스토리 ${stories.length}개 · 다운로드 ${downloads.length}개 · 루트 절대 경로 없음`);
