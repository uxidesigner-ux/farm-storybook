// 콘텐츠 무결성 검사: ID·필수 값·출처·표 구조·다운로드 경로·생성물 동기화.
import fs from 'node:fs';
import path from 'node:path';
import { ASSETS, CATEGORIES, CODE_PATTERN, ID_PATTERN, STATUSES, docMarkdownPath, docStoryId, markdownFor, readJson, root } from './lib/content.mjs';

const errors = [];
const fail = (where, message) => errors.push(`${where}: ${message}`);
const text = (value) => typeof value === 'string' && value.trim().length > 0;
const httpsUrl = (value) => { try { return new URL(value).protocol === 'https:'; } catch { return false; } };
const duplicates = (values) => [...new Set(values.filter((value, index) => values.indexOf(value) !== index))];
const record = (value) => value !== null && typeof value === 'object' && !Array.isArray(value);
const officialPlusXUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' && !url.username && !url.password
      && (url.hostname === 'plus-ex.com' || url.hostname.endsWith('.plus-ex.com'));
  } catch { return false; }
};
const assetIds = new Set(ASSETS.map((asset) => asset.id));

for (const id of duplicates(ASSETS.map((asset) => asset.id))) fail('다운로드', `자료 ID 중복 "${id}"`);

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
  if (doc.downloadAssetIds !== undefined) {
    if (!Array.isArray(doc.downloadAssetIds) || !doc.downloadAssetIds.every(text)) fail(where, 'downloadAssetIds는 자료 ID 문자열 배열이어야 합니다');
    else {
      for (const id of duplicates(doc.downloadAssetIds)) fail(where, `다운로드 자료 ID 중복 "${id}"`);
      for (const id of doc.downloadAssetIds) if (!assetIds.has(id)) fail(where, `다운로드 자료 "${id}"가 ASSETS에 없습니다`);
    }
  }
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

// 공개 목록의 수와 근거 수준을 원본 메타데이터에 대조한다.
// 심층·시각 검토는 기본 본문 근거 수준을 덮어쓰지 않는 별도 매핑이다.
let plusx;
try { plusx = readJson('content/plusx-research.json'); }
catch (error) { fail('Plus X 리서치', `원본 JSON을 읽을 수 없습니다: ${error.message}`); }

function validatePlusX(data) {
  const where = 'Plus X 리서치';
  if (!record(data)) { fail(where, '최상위 값은 객체여야 합니다'); return; }
  if (data.schemaVersion !== 1) fail(where, '지원하지 않는 schemaVersion입니다');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(data.asOf ?? '') || Number.isNaN(Date.parse(data.asOf))) fail(where, 'asOf는 YYYY-MM-DD 형식입니다');
  if (!record(data.scope)) fail(where, 'scope 메타데이터가 필요합니다');
  else {
    for (const key of ['title', 'description', 'baseEvidenceNote']) if (!text(data.scope[key])) fail(where, `scope.${key}가 비어 있습니다`);
    if (!Array.isArray(data.scope.limits) || !data.scope.limits.length || !data.scope.limits.every(text)) fail(where, 'scope.limits는 한 개 이상의 한계 설명입니다');
  }
  if (!Array.isArray(data.projects)) { fail(where, 'projects는 배열이어야 합니다'); return; }
  const projects = data.projects.filter(record);
  if (projects.length !== data.projects.length) fail(where, 'projects의 모든 항목은 객체여야 합니다');
  const categories = ['BX', 'UX', 'BX+UX', 'other'];
  const evidence = ['official_text', 'brief_or_image_led', 'insufficient'];
  const slugs = new Set(projects.map((project) => project.slug));
  const indices = new Set(projects.map((project) => project.index));
  const slugPattern = /^[a-z0-9]+(?:[_-][a-z0-9]+)*$/;
  for (const slug of duplicates(projects.map((project) => project.slug))) fail(where, `slug 중복 "${slug}"`);
  for (const index of duplicates(projects.map((project) => project.index))) fail(where, `index 중복 "${index}"`);
  const missingIndices = Array.from({ length: projects.length }, (_, index) => index + 1).filter((index) => !indices.has(index));
  if (missingIndices.length) fail(where, `공개 목록의 index가 빠졌습니다: ${missingIndices.join(', ')}`);

  const mapping = (key) => {
    const values = data[key];
    if (!Array.isArray(values)) { fail(where, `${key}는 slug 배열이어야 합니다`); return new Set(); }
    for (const slug of duplicates(values)) fail(where, `${key}의 slug 중복 "${slug}"`);
    for (const slug of values) {
      if (typeof slug !== 'string' || !slugPattern.test(slug)) fail(where, `${key}의 slug "${slug}" 형식이 잘못됐습니다`);
      else if (!slugs.has(slug)) fail(where, `${key}가 참조하는 프로젝트 "${slug}"가 없습니다`);
    }
    return new Set(values);
  };
  const deepDiveSlugs = mapping('deepDive18');
  const visualSlugs = mapping('staticVisual9');

  for (const project of projects) {
    const at = `${where} › ${project.slug ?? '(slug 없음)'}`;
    if (typeof project.slug !== 'string' || !slugPattern.test(project.slug)) fail(at, 'slug 형식이 잘못됐습니다');
    if (!Number.isInteger(project.index) || project.index < 1 || project.index > projects.length) fail(at, 'index는 공개 목록 범위 안의 양의 정수여야 합니다');
    if (!categories.includes(project.category)) fail(at, `category "${project.category}"가 허용된 분류가 아닙니다`);
    if (!evidence.includes(project.baseEvidence)) fail(at, `baseEvidence "${project.baseEvidence}"가 허용된 근거 수준이 아닙니다`);
    if (!['high', 'medium', 'low'].includes(project.relevance)) fail(at, 'relevance는 high / medium / low 중 하나입니다');
    for (const key of ['name', 'sourceFacts', 'interpretation', 'relevanceReason', 'limits']) if (!text(project[key])) fail(at, `${key}가 비어 있습니다`);
    for (const key of ['supplementalEvidence', 'metadataNote']) if (typeof project[key] !== 'string') fail(at, `${key}는 문자열이어야 합니다`);
    if (!Array.isArray(project.sources) || !project.sources.length) fail(at, '공식 출처가 한 개 이상 필요합니다');
    else for (const source of project.sources) {
      if (!record(source) || !text(source.label) || !officialPlusXUrl(source.url)) fail(at, '출처에는 이름과 Plus X 공식 https URL이 필요합니다');
    }
    if (!record(project.visual)) fail(at, 'visual 검토 상태가 필요합니다');
    else {
      if (typeof project.visual.verified !== 'boolean') fail(at, 'visual.verified는 boolean이어야 합니다');
      if (!text(project.visual.note)) fail(at, 'visual.note에 확인 범위가 필요합니다');
      if (typeof project.visual.observation !== 'string' || (project.visual.verified && !text(project.visual.observation))) fail(at, '시각 확인 완료 항목에는 관찰 기록이 필요합니다');
      if (visualSlugs.has(project.slug) !== project.visual.verified) fail(at, 'staticVisual9 매핑과 visual.verified가 다릅니다');
    }
    if (project.deepDive !== null) {
      if (!record(project.deepDive)) fail(at, 'deepDive는 심층 분석 객체 또는 null이어야 합니다');
      else {
        for (const key of ['analysis', 'validation', 'avoidCopying', 'limits', 'evidenceNote']) if (!text(project.deepDive[key])) fail(at, `deepDive.${key}가 비어 있습니다`);
        if (!Array.isArray(project.deepDive.officialFacts) || !project.deepDive.officialFacts.length || !project.deepDive.officialFacts.every(text)) fail(at, 'deepDive.officialFacts는 한 개 이상의 공식 사실입니다');
        if (!Array.isArray(project.deepDive.touchpoints) || !project.deepDive.touchpoints.every((point) => record(point) && text(point.label) && text(point.text))) fail(at, 'deepDive.touchpoints의 접점 이름·설명이 잘못됐습니다');
      }
    }
    if (deepDiveSlugs.has(project.slug) !== record(project.deepDive)) fail(at, 'deepDive18 매핑과 심층 분석 객체가 다릅니다');
  }

  if (!record(data.counts)) { fail(where, 'counts 메타데이터가 필요합니다'); return; }
  const compareCount = (label, declared, actual) => {
    if (!Number.isInteger(declared) || declared < 0) fail(where, `${label}는 0 이상의 정수여야 합니다`);
    else if (declared !== actual) fail(where, `${label} 메타데이터 ${declared} ≠ 실제 ${actual}`);
  };
  compareCount('counts.projects', data.counts.projects, projects.length);
  compareCount('counts.deepDives', data.counts.deepDives, projects.filter((project) => record(project.deepDive)).length);
  compareCount('deepDive18 매핑 수', data.counts.deepDives, Array.isArray(data.deepDive18) ? data.deepDive18.length : 0);
  compareCount('counts.staticVisuals', data.counts.staticVisuals, projects.filter((project) => project.visual?.verified === true).length);
  compareCount('staticVisual9 매핑 수', data.counts.staticVisuals, Array.isArray(data.staticVisual9) ? data.staticVisual9.length : 0);
  for (const [key, values, field] of [['categories', categories, 'category'], ['baseEvidence', evidence, 'baseEvidence']]) {
    if (!record(data.counts[key])) { fail(where, `counts.${key} 메타데이터가 필요합니다`); continue; }
    for (const value of Object.keys(data.counts[key])) if (!values.includes(value)) fail(where, `counts.${key}의 알 수 없는 분류 "${value}"`);
    for (const value of values) compareCount(`counts.${key}.${value}`, data.counts[key][value], projects.filter((project) => project[field] === value).length);
    const sum = values.reduce((total, value) => total + data.counts[key][value], 0);
    if (sum !== data.counts.projects) fail(where, `counts.${key} 합계 ${sum} ≠ 전체 메타데이터 ${data.counts.projects}`);
  }
}
if (plusx !== undefined) validatePlusX(plusx);

for (const asset of ASSETS) {
  const file = path.join(root, 'public', asset.path);
  if (!fs.existsSync(file) || fs.statSync(file).size === 0) fail('다운로드', `public/${asset.path} 파일이 없거나 비어 있습니다`);
}
for (const [assetId, original] of [['guide-data', 'content/guide-data.json'], ['benchmarks-data', 'content/benchmarks.json'], ['plusx-research-data', 'content/plusx-research.json']]) {
  const asset = ASSETS.find((item) => item.id === assetId);
  if (!asset) { fail('생성물', `구조화 자료 "${assetId}"가 ASSETS에 없습니다`); continue; }
  const copy = path.join('public', asset.path);
  if (!fs.existsSync(path.join(root, original))) fail('생성물', `원본 ${original}이 없습니다`);
  else if (!fs.existsSync(path.join(root, copy)) || !fs.readFileSync(path.join(root, copy)).equals(fs.readFileSync(path.join(root, original)))) fail('생성물', `${copy}가 원본과 다릅니다. npm run content를 실행하세요`);
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
console.log(`콘텐츠 검사 통과: 문서 ${documents.length}개 · 절 ${documents.reduce((sum, doc) => sum + doc.sections.length, 0)}개 · 벤치마크 ${research.brands.length}개(국내 ${count(research.brands, (b) => b.region === '한국')} · 해외 ${count(research.brands, (b) => b.region !== '한국')}) · Plus X ${plusx.projects.length}개(심층 ${plusx.counts.deepDives} · 정적 시각 ${plusx.counts.staticVisuals}) · 다운로드 ${ASSETS.length + documents.length}개`);
