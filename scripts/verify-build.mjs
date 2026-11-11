// 두 Storybook과 포트폴리오의 실제 ID, 자료 분리, 다운로드, 하위 경로 배포를 검사한다.
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS, PAGES, docMarkdownPath, docStoryId, pageStoryId, readJson, root } from './lib/content.mjs';

const output = path.join(root, 'dist');
const dist = path.join(output, 'journal');
const operationsDist = path.join(output, 'operations');
const errors = [];
const fail = (message) => errors.push(message);
if (!fs.existsSync(path.join(dist, 'index.json')) || !fs.existsSync(path.join(operationsDist, 'index.json'))) { console.error('두 Storybook의 dist/journal/index.json, dist/operations/index.json이 필요합니다. npm run build를 먼저 실행하세요.'); process.exit(1); }

const { entries } = JSON.parse(fs.readFileSync(path.join(dist, 'index.json'), 'utf8'));
const { documents } = readJson('content/guide-data.json');
const generated = readJson('src/generated/documents.json');
const portalIndex = readJson('src/generated/portal-index.json');
const portfolio = readJson('content/portfolio-data.json');
const operations = readJson('content/operations-data.json');
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
for (const file of ['favicon.svg', 'brand-lockup.svg', 'iframe.html', 'index.html']) if (!fs.existsSync(path.join(dist, file))) fail(`dist/journal/${file}이 없습니다`);

// 신규 작업 기록·결정·포트폴리오도 실제 빌드된 Storybook ID로 확인한다.
const journalIds = [portalIndex.journal.worklog, portalIndex.journal.decisions, ...portalIndex.journal.portfolios.map((item) => item.id)];
for (const id of journalIds) if (entries[id]?.type !== 'docs') fail(`작업 기록 빌드에 ${id}가 없습니다`);

const operationsEntries = JSON.parse(fs.readFileSync(path.join(operationsDist, 'index.json'), 'utf8')).entries;
const operationIds = [portalIndex.operations.home, ...portalIndex.operations.guides.map((item) => item.storyId), ...portalIndex.operations.portfolios.map((item) => item.id)];
for (const id of operationIds) if (operationsEntries[id]?.type !== 'docs') fail(`운영 기준 빌드에 ${id}가 없습니다`);
for (const id of Object.keys(operationsEntries)) if (!operationIds.includes(id)) fail(`운영 기준에 허용되지 않은 Storybook 엔트리 ${id}가 있습니다`);
for (const guide of portalIndex.operations.guides) if (operationsEntries[guide.storyId]?.title !== guide.title) fail(`운영 문서 ${guide.id}의 제목이 원본과 다릅니다`);

const listFiles = (directory, prefix = '') => fs.existsSync(directory) ? fs.readdirSync(directory).flatMap((name) => {
  const file = path.join(directory, name); const relative = path.posix.join(prefix, name);
  return fs.statSync(file).isDirectory() ? listFiles(file, relative) : [relative];
}) : [];
const identical = (source, target, label) => {
  if (!fs.existsSync(target) || !fs.existsSync(source) || !fs.readFileSync(target).equals(fs.readFileSync(source))) fail(`${label}이 원본과 다릅니다`);
};
for (const name of ['journal-records', 'operations-data', 'portfolio-data']) identical(path.join(root, 'content', `${name}.json`), path.join(dist, 'downloads', `${name}.json`), `작업 기록 다운로드 ${name}.json`);
for (const name of ['operations-data', 'portfolio-data']) identical(path.join(root, 'content', `${name}.json`), path.join(operationsDist, 'downloads', `${name}.json`), `운영 다운로드 ${name}.json`);
const allowedOperationDownloads = new Set(['operations-data.json', 'portfolio-data.json', ...operations.guides.map((guide) => `operations/${guide.id}.md`)]);
const actualOperationDownloads = listFiles(path.join(operationsDist, 'downloads'));
for (const file of actualOperationDownloads) if (!allowedOperationDownloads.has(file)) fail(`운영판에 허용되지 않은 다운로드 ${file}이 있습니다`);
for (const file of allowedOperationDownloads) {
  if (!actualOperationDownloads.includes(file)) fail(`운영판 다운로드 ${file}이 없습니다`);
  else identical(path.join(root, '.cache/operations-public/downloads', file), path.join(operationsDist, 'downloads', file), `운영 다운로드 ${file}`);
}

for (const edition of ['journal', 'operations', 'showcase']) {
  const editionDist = path.join(output, edition);
  for (const brand of portfolio.brands) for (const asset of [brand.hero, ...brand.boards.map((board) => board.src)]) {
    const relative = asset.replace(/^\.\//, '');
    const target = path.join(editionDist, relative);
    if (!fs.existsSync(target) || fs.statSync(target).size === 0) fail(`${edition}의 ${relative}이 없거나 비어 있습니다`);
  }
}

// 운영판·최종 포트폴리오에는 리서치 이름이 UI 코드나 정적 다운로드로 유입되어서도 안 된다.
const reference = /konny|plus[\s.\-]*x|플러스\s*엑스|plus-ex/i;
for (const edition of ['operations', 'showcase']) for (const file of listFiles(path.join(output, edition))) {
  if (/\.(?:json|md|js|html|svg)$/.test(file) && reference.test(fs.readFileSync(path.join(output, edition, file), 'utf8'))) fail(`${edition}/${file}에 외부 디자인 참고 작업의 이름·URL이 포함돼 있습니다`);
}
if (fs.existsSync(path.join(output, 'showcase/downloads'))) fail('최종 포트폴리오에 문서 다운로드 폴더가 포함돼 있습니다');

const gatewayPath = path.join(output, 'index.html');
const gateway = fs.existsSync(gatewayPath) ? fs.readFileSync(gatewayPath, 'utf8') : '';
for (const href of ['./showcase/', './journal/?path=/docs/home--docs', './operations/?path=/docs/ops-home--docs']) if (!gateway.includes(`href="${href}"`)) fail(`게이트웨이에 ${href} 링크가 없습니다`);
if (!gateway.includes("window.location.replace('./journal/' + window.location.search + window.location.hash)")) fail('기존 Storybook 주소의 query/hash 보존 전환이 없습니다');
if (!fs.existsSync(path.join(output, '.nojekyll'))) fail('GitHub Pages용 dist/.nojekyll이 없습니다');
if (!fs.existsSync(path.join(output, 'showcase/index.html'))) fail('전체 화면 포트폴리오 dist/showcase/index.html이 없습니다');

// GitHub Pages의 /저장소명/ 하위 경로에서 깨지는 루트 절대 경로(/assets/…)를 찾는다.
for (const file of ['index.html', 'journal/index.html', 'journal/iframe.html', 'operations/index.html', 'operations/iframe.html', 'showcase/index.html']) {
  const html = fs.existsSync(path.join(output, file)) ? fs.readFileSync(path.join(output, file), 'utf8') : '';
  const absolute = [...html.matchAll(/(?:src|href)=["'](\/(?!\/)[^"']*)["']/g)].map((match) => match[1]);
  if (absolute.length) fail(`${file}: 루트 절대 경로 ${[...new Set(absolute)].slice(0, 5).join(', ')}`);
}
const sourceAbsolute = [];
const walk = (dir) => { for (const name of fs.readdirSync(dir)) { const file = path.join(dir, name); if (fs.statSync(file).isDirectory()) walk(file); else if (/\.(tsx?|css|html)$/.test(name) && /(?:href|src)=["'{`]+\/(?!\/)|url\(["']?\/(?!\/)/.test(fs.readFileSync(file, 'utf8'))) sourceAbsolute.push(path.relative(root, file)); } };
walk(path.join(root, 'src')); walk(path.join(root, '.storybook')); walk(path.join(root, '.storybook-operations'));
if (sourceAbsolute.length) fail(`소스에 루트 절대 경로가 있습니다: ${sourceAbsolute.join(', ')}`);

if (errors.length) {
  console.error(`빌드 검사 실패 (${errors.length}건)`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
console.log(`빌드 검사 통과: 기존 문서 ${documents.length}개 · 색인 ${PAGES.length}개 · 컴포넌트 ${components.size}종 / 스토리 ${stories.length}개 · 기존 다운로드 ${downloads.length}개 보존 · 신규 기록/포트폴리오 ${journalIds.length}개 · 운영 엔트리 ${operationIds.length}개 분리 · 세 공간 자산/상대 경로/기존 URL 전환 정상`);
