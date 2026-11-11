// 두 문서판의 구분, 기록 상태, 운영 문서와 포트폴리오 자산 연결을 검사한다.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => JSON.parse(fs.readFileSync(path.join(root, file), 'utf8'));
const errors = [];
const fail = (where, text) => errors.push(`${where}: ${text}`);
const nonempty = (value) => typeof value === 'string' && value.trim().length > 0;
const idPattern = /^[a-z][a-z0-9]*(-[a-z0-9]+)*$/;
const unique = (rows, key, label) => { const seen = new Set(); for (const row of rows) { if (!idPattern.test(row[key] ?? '')) fail(label, `잘못된 ${key}: ${row[key]}`); if (seen.has(row[key])) fail(label, `중복 ${key}: ${row[key]}`); seen.add(row[key]); } };
const link = (value) => { try { const url = new URL(value, 'https://example.invalid/journal/'); return ['http:', 'https:'].includes(url.protocol) && !/^(?:sandbox:|file:|\/workspace\/)/i.test(value); } catch { return false; } };
const reference = /konny|plus[\s.\-]*x|플러스\s*엑스|plus-ex/i;

const journal = read('content/journal-records.json');
const operations = read('content/operations-data.json');
const portfolio = read('content/portfolio-data.json');
const index = read('src/generated/portal-index.json');

for (const key of ['summary', 'version', 'updatedAt']) if (!nonempty(journal[key])) fail('작업 기록', `${key}가 필요합니다`);
unique(journal.milestones, 'id', '작업 단계'); unique(journal.decisions, 'id', '결정 기록');
let previous = -1;
for (const row of journal.milestones) {
  for (const key of ['title', 'phase', 'request', 'decision', 'reason', 'outcome']) if (!nonempty(row[key])) fail(row.id, `${key}가 비어 있습니다`);
  if (!Number.isInteger(row.sequence) || row.sequence <= previous) fail(row.id, 'sequence는 증가하는 정수여야 합니다');
  previous = row.sequence;
  if (!['all', 'gounbat', 'onari', 'hecale', 'ersa'].includes(row.brand)) fail(row.id, '브랜드 분류가 잘못됐습니다');
  if (!['completed', 'superseded', 'approved', 'open'].includes(row.status)) fail(row.id, '단계 상태가 잘못됐습니다');
  for (const item of row.evidence ?? []) if (!nonempty(item.label) || !link(item.url)) fail(row.id, '근거 링크가 잘못됐습니다');
  for (const item of row.artifacts ?? []) if (!nonempty(item.label) || !link(item.href)) fail(row.id, '산출물 링크가 잘못됐습니다');
}
for (const row of journal.decisions) {
  for (const key of ['title', 'scope', 'decision', 'rationale']) if (!nonempty(row[key])) fail(row.id, `${key}가 비어 있습니다`);
  if (!['approved', 'open', 'superseded'].includes(row.status)) fail(row.id, '결정 상태가 잘못됐습니다');
}

unique(operations.guides, 'id', '운영 문서');
const codes = new Set();
if (reference.test(JSON.stringify(operations))) fail('운영 기준', '외부 디자인 참고 작업의 이름·URL이 포함돼 있습니다');
for (const guide of operations.guides) {
  if (codes.has(guide.code)) fail(guide.id, `문서 코드 중복: ${guide.code}`); codes.add(guide.code);
  for (const key of ['code', 'title', 'summary', 'owner']) if (!nonempty(guide[key])) fail(guide.id, `${key}가 비어 있습니다`);
  if (!['브랜드', '디자인', '콘텐츠', '개발', '마케팅', '운영'].includes(guide.category)) fail(guide.id, '문서 분류가 잘못됐습니다');
  if (!['확정 기준', '운영 제안', '결정 대기'].includes(guide.status)) fail(guide.id, '운영 상태가 잘못됐습니다');
  unique(guide.sections, 'id', guide.id);
  for (const section of guide.sections) {
    if (!nonempty(section.title) || !Array.isArray(section.body) || !section.body.length || !section.body.every(nonempty)) fail(guide.id, `절 ${section.id}의 제목·본문이 필요합니다`);
    if (section.table) {
      if (!Array.isArray(section.table.headers) || !section.table.headers.every(nonempty) || section.table.headers.length < 2) fail(guide.id, '표 머리글 형식이 잘못됐습니다');
      else for (const row of section.table.rows) if (row.length !== section.table.headers.length || !row.every(nonempty)) fail(guide.id, '표 행의 칸 수 또는 값이 잘못됐습니다');
    }
    for (const key of ['bullets', 'checklist']) if (section[key] !== undefined && (!Array.isArray(section[key]) || !section[key].every(nonempty))) fail(guide.id, `${key} 형식이 잘못됐습니다`);
  }
  for (const source of guide.sources ?? []) if (!nonempty(source.label) || !link(source.url)) fail(guide.id, '출처 링크 형식이 잘못됐습니다');
}

unique(portfolio.brands, 'slug', '포트폴리오');
if (portfolio.brands.length !== 4) fail('포트폴리오', '네 브랜드가 필요합니다');
if (reference.test(JSON.stringify(portfolio))) fail('최종 포트폴리오', '외부 디자인 참고 작업의 이름·URL이 포함돼 있습니다');
for (const brand of portfolio.brands) {
  for (const key of ['name', 'title', 'oneLine', 'figmaUrl']) if (!nonempty(brand[key])) fail(brand.slug, `${key}가 필요합니다`);
  if (!brand.boards.length || brand.boardCount !== brand.boards.length) fail(brand.slug, '장표 수가 실제 배열과 다릅니다');
  for (const item of [{ src: brand.hero }, ...brand.boards]) {
    if (!nonempty(item.src) || item.src.startsWith('/') || !item.src.replace(/^\.\//, '').startsWith('portfolio-v15/')) fail(brand.slug, `상대 자산 경로가 필요합니다: ${item.src}`);
    else if (!fs.existsSync(path.join(root, 'public', item.src.replace(/^\.\//, '')))) fail(brand.slug, `자산이 없습니다: ${item.src}`);
  }
  for (const board of brand.boards) if (!(board.width > 0 && board.height > 0)) fail(brand.slug, `장표 ${board.index}의 크기가 잘못됐습니다`);
}

const sourcePairs = [['journal-records', 'public/downloads'], ['operations-data', 'public/downloads'], ['portfolio-data', 'public/downloads'], ['operations-data', '.cache/operations-public/downloads'], ['portfolio-data', '.cache/operations-public/downloads']];
for (const [name, dest] of sourcePairs) {
  const source = path.join(root, `content/${name}.json`); const target = path.join(root, dest, `${name}.json`);
  if (!fs.existsSync(target) || !fs.readFileSync(target).equals(fs.readFileSync(source))) fail('포털 생성물', `${dest}/${name}.json이 원본과 다릅니다`);
}
for (const row of index.operations.guides) if (!fs.existsSync(path.join(root, `src/portal-stories/operations/${row.id}.mdx`))) fail('운영 엔트리', `${row.id}가 생성되지 않았습니다`);
if (index.counts.milestones !== journal.milestones.length || index.counts.decisions !== journal.decisions.length || index.counts.guides !== operations.guides.length) fail('포털 통계', '생성 통계가 원본과 다릅니다');

if (errors.length) { console.error(`포털 콘텐츠 검사 실패 (${errors.length}건)\n${errors.map((text) => ` - ${text}`).join('\n')}`); process.exit(1); }
console.log(`포털 콘텐츠 검사 통과: 작업 단계 ${journal.milestones.length}개 · 결정 ${journal.decisions.length}개 · 운영 문서 ${operations.guides.length}개 · 최종 장표 ${index.counts.boards}장 · 운영/최종 자료의 외부 레퍼런스 언급 없음`);
