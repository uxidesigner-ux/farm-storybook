// 콘텐츠 무결성 검사: ID·필수 값·출처·표 구조·다운로드 경로·생성물 동기화.
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS, CATEGORIES, CODE_PATTERN, ID_PATTERN, STATUSES, docMarkdownPath, docStoryId, markdownFor, readJson, root } from './lib/content.mjs';

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const httpsUrl = (value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const duplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];

const { documents } = readJson('content/guide-data.json');
const registry = readJson('content/published-ids.json');
const research = readJson('content/benchmarks.json');

for (const id of duplicates(documents.map((doc) => doc.id))) fail('문서', `ID 중복 "${id}"`);
for (const code of duplicates(documents.map((doc) => doc.code))) fail('문서', `코드 중복 "${code}"`);
const ids = new Set(documents.map((doc) => doc.id));

for (const doc of documents) {
  const where = `문서 ${doc.id ?? '(ID 없음)'}`;
  if (!ID_PATTERN.test(doc.id ?? '')) fail(where, 'id는 영문 소문자·숫자·하이픈만 사용합니다');
  if (!CODE_PATTERN.test(doc.code ?? '')) fail(where, 'code는 "B01"처럼 영문 대문자와 두 자리 숫자입니다');
  if (!CATEGORIES.includes(doc.category)) fail(where, `category "${doc.category}"는 ${CATEGORIES.join(' / ')} 중 하나여야 합니다`);
  if (!STATUSES.includes(doc.status)) fail(where, `status "${doc.status}"는 ${STATUSES.join(' / ')} 중 하나여야 합니다`);
  for (const key of ['title', 'eyebrow', 'summary']) if (!text(doc[key])) fail(where, `${key}가 비어 있습니다`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(doc.updatedAt ?? '') || Number.isNaN(Date.parse(doc.updatedAt))) fail(where, 'updatedAt은 YYYY-MM-DD 형식입니다');
  if (!Number.isInteger(doc.readingMinutes) || doc.readingMinutes < 1) fail(where, 'readingMinutes는 1 이상의 정수입니다');
  if (!Array.isArray(doc.tags) || !doc.tags.length || !doc.tags.every(text)) fail(where, 'tags는 한 개 이상의 문자열입니다');
  if (!Array.isArray(doc.sections) || !doc.sections.length) { fail(where, 'sections가 비어 있습니다'); continue; }
  for (const id of duplicates(doc.sections.map((section) => section.id))) fail(where, `절 ID 중복 "${id}"`);
  for (const section of doc.sections) {
    const at = `${where} › ${section.id ?? '(절 ID 없음)'}`;
    if (!ID_PATTERN.test(section.id ?? '')) fail(at, '절 id 형식이 잘못됐습니다');
    if (!text(section.title)) fail(at, '절 제목이 비어 있습니다');
    if (!Array.isArray(section.body) || !section.body.length || !section.body.every(text)) fail(at, 'body는 한 개 이상의 문단입니다');
    if (section.bullets && (!section.bullets.length || !section.bullets.every(text))) fail(at, 'bullets에 빈 항목이 있습니다');
    if (section.table) {
      const { headers, rows } = section.table;
      if (!Array.isArray(headers) || headers.length < 2 || !headers.every(text)) fail(at, '표 머리글은 두 칸 이상입니다');
      else if (!Array.isArray(rows) || !rows.length) fail(at, '표에 행이 없습니다');
      else rows.forEach((row, index) => { if (row.length !== headers.length || !row.every(text)) fail(at, `표 ${index + 1}행의 칸 수(${row.length})가 머리글(${headers.length})과 다르거나 빈 칸이 있습니다`); });
    }
    if (section.callout && (!text(section.callout.title) || !text(section.callout.body))) fail(at, '안내 박스의 제목·본문이 필요합니다');
  }
  for (const source of doc.sources ?? []) if (!text(source.label) || !httpsUrl(source.url)) fail(where, `출처 "${source.label}"의 이름 또는 https 주소가 잘못됐습니다`);
  for (const related of doc.related ?? []) {
    if (related === doc.id) fail(where, '관련 문서에 자기 자신이 있습니다');
    else if (!ids.has(related)) fail(where, `관련 문서 "${related}"가 없습니다`);
  }
}

// 한 번 공유된 ID는 사라지면 안 된다. 새 문서는 등록부에 직접 추가한다.
for (const id of registry.documents) if (!ids.has(id)) fail('공유 ID', `"${id}"가 등록부에는 있지만 문서에서 사라졌습니다. 공유된 링크가 깨집니다`);
for (const id of ids) if (!registry.documents.includes(id)) fail('공유 ID', `새 문서 "${id}"를 content/published-ids.json에 추가하세요`);

for (const id of duplicates(research.brands.map((brand) => brand.id))) fail('벤치마크', `ID 중복 "${id}"`);
if (!text(research.scope) || !text(research.asOf)) fail('벤치마크', 'scope와 asOf가 필요합니다');
for (const brand of research.brands) {
  const where = `벤치마크 ${brand.id}`;
  if (!/^[KGAP]\d{2}$/.test(brand.id ?? '')) fail(where, 'id는 K·G·A·P와 두 자리 숫자입니다');
  for (const key of ['name', 'region', 'model', 'status', 'fact', 'lesson']) if (!text(brand[key])) fail(where, `${key}가 비어 있습니다`);
  if (!Array.isArray(brand.urls) || !brand.urls.length || !brand.urls.every(httpsUrl)) fail(where, '공식 출처(https)가 한 개 이상 필요합니다');
}
const brandIds = new Set(research.brands.map((brand) => brand.id));
for (const row of research.prices) {
  if (row.length !== 4 || !row.every(text)) fail('가격 관찰', `"${row[0]}" 행은 네 칸이어야 합니다`);
  const ref = /\[([KGAP]\d{2})\]/.exec(row[0])?.[1];
  if (!ref || !brandIds.has(ref)) fail('가격 관찰', `"${row[0]}"가 가리키는 사례가 없습니다`);
}
for (const row of research.extraSources) if (row.length !== 4 || !httpsUrl(row[2])) fail('추가 출처', `"${row[0]}"의 형식 또는 주소가 잘못됐습니다`);

for (const asset of ASSETS) {
  const file = path.join(root, 'public', asset.path);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) fail('다운로드', `public/${asset.path} 파일이 없거나 비어 있습니다`);
}
for (const [copy, original] of [['public/downloads/guide-data.json', 'content/guide-data.json'], ['public/downloads/benchmarks.json', 'content/benchmarks.json']]) {
  if (!fs.existsSync(path.join(root, copy)) || fs.readFileSync(path.join(root, copy), 'utf8') !== fs.readFileSync(path.join(root, original), 'utf8')) fail('생성물', `${copy}가 원본과 다릅니다. npm run content를 실행하세요`);
}

// 생성물이 원본과 같은 상태인지 확인한다.
const generatedPath = path.join(root, 'src/generated/documents.json');
if (!fs.existsSync(generatedPath)) fail('생성물', 'src/generated/documents.json이 없습니다. npm run content를 실행하세요');
else {
  const generated = JSON.parse(fs.readFileSync(generatedPath, 'utf8'));
  const stale = generated.documents.length !== documents.length || documents.some((doc, index) => {
    const { storyTitle, storyId, markdownHref, ...rest } = generated.documents[index] ?? {};
    return storyId !== docStoryId(doc) || JSON.stringify(rest) !== JSON.stringify(doc);
  });
  if (stale) fail('생성물', 'src/generated/documents.json이 원본과 다릅니다. npm run content를 실행하세요');
  for (const doc of documents) {
    const mdx = path.join(root, `src/stories/doc-${doc.id}.mdx`);
    if (!fs.existsSync(mdx) || !fs.readFileSync(mdx, 'utf8').includes(`id="doc-${doc.id}"`)) fail('생성물', `src/stories/doc-${doc.id}.mdx가 없거나 고정 ID가 없습니다`);
    const md = path.join(root, 'public', docMarkdownPath(doc));
    if (!fs.existsSync(md) || fs.readFileSync(md, 'utf8') !== markdownFor(doc)) fail('생성물', `public/${docMarkdownPath(doc)}가 원본과 다릅니다`);
  }
}

if (errors.length) {
  console.error(`콘텐츠 검사 실패 (${errors.length}건)`);
  for (const error of errors) console.error(` - ${error}`);
  process.exit(1);
}
const count = (list, test) => list.filter(test).length;
console.log(`콘텐츠 검사 통과: 문서 ${documents.length}개 · 절 ${documents.reduce((sum, doc) => sum + doc.sections.length, 0)}개 · 벤치마크 ${research.brands.length}개(국내 ${count(research.brands, (b) => b.region === '한국')} · 해외 ${count(research.brands, (b) => b.region !== '한국')}) · 다운로드 ${ASSETS.length + documents.length}개`);
