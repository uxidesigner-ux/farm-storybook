// 두 Storybook의 엔트리와 공개 자료를 각각 생성한다.
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const at = (...parts) => path.join(root, ...parts);
const read = (file) => JSON.parse(fs.readFileSync(at(file), 'utf8'));
const write = (file, value) => { fs.mkdirSync(path.dirname(at(file)), { recursive: true }); fs.writeFileSync(at(file), value); };
const operations = read('content/operations-data.json');
const journal = read('content/journal-records.json');
const portfolio = read('content/portfolio-data.json');

const mdx = (id, title, component, props = '') => `{/* 자동 생성: scripts/generate-portals.mjs */}
import { Meta } from '@storybook/addon-docs/blocks';
import { ${component} } from '../../portals/${component.startsWith('Operations') ? 'Operations' : component === 'PortfolioPage' ? 'Portfolio' : 'Journal'}';

<Meta id=${JSON.stringify(id)} title=${JSON.stringify(title)} />

<${component}${props} />
`;

for (const edition of ['journal', 'operations']) {
  fs.rmSync(at('src/portal-stories', edition), { recursive: true, force: true });
  fs.mkdirSync(at('src/portal-stories', edition), { recursive: true });
}

write('src/portal-stories/journal/worklog.mdx', mdx('journal-worklog', '작업 기록/J01 전체 작업 기록', 'WorklogPage'));
write('src/portal-stories/journal/decisions.mdx', mdx('journal-decisions', '작업 기록/J02 결정과 변경 이유', 'DecisionsPage'));
write('src/portal-stories/operations/home.mdx', mdx('ops-home', '운영 시작/O00 운영 기준 홈', 'OperationsHomePage'));

for (const brand of portfolio.brands) {
  const props = ` brandSlug=${JSON.stringify(brand.slug)}`;
  write(`src/portal-stories/journal/portfolio-${brand.slug}.mdx`, mdx(`portfolio-${brand.slug}`, `최종 포트폴리오/${brand.name}`, 'PortfolioPage', props));
  write(`src/portal-stories/operations/portfolio-${brand.slug}.mdx`, mdx(`portfolio-${brand.slug}`, `브랜드 포트폴리오/${brand.name}`, 'PortfolioPage', props));
}

for (const guide of operations.guides) {
  write(`src/portal-stories/operations/${guide.id}.mdx`, mdx(`ops-${guide.id}`, `${guide.category}/${guide.code} ${guide.title}`, 'OperationsGuidePage', ` guideId=${JSON.stringify(guide.id)}`));
}

const cell = (value) => String(value).replace(/\|/g, '\\|').replace(/\n/g, ' ');
export function operationMarkdown(guide) {
  const lines = [`# ${guide.title}`, '', `> ${guide.code} · ${guide.category} · ${guide.status} · 담당: ${guide.owner}`, '', guide.summary, ''];
  for (const section of guide.sections) {
    lines.push(`## ${section.title}`, '', ...section.body.flatMap((text) => [text, '']));
    if (section.bullets?.length) lines.push(...section.bullets.map((text) => `- ${text}`), '');
    if (section.checklist?.length) lines.push(...section.checklist.map((text) => `- [ ] ${text}`), '');
    if (section.table) {
      lines.push(`| ${section.table.headers.map(cell).join(' | ')} |`, `| ${section.table.headers.map(() => '---').join(' | ')} |`);
      lines.push(...section.table.rows.map((row) => `| ${row.map(cell).join(' | ')} |`), '');
    }
  }
  if (guide.sources?.length) lines.push('## 출처', '', ...guide.sources.map((source) => `- [${source.label}](${source.url})`), '');
  return lines.join('\n');
}

// 작업 기록은 원본 조사와 신규 기록을 함께 보존한다.
for (const name of ['journal-records', 'operations-data', 'portfolio-data']) {
  fs.copyFileSync(at(`content/${name}.json`), at(`public/downloads/${name}.json`));
}

// 운영판은 명시적 허용 목록만 복사한다. 기존 public 전체를 공유하지 않는다.
const opPublic = '.cache/operations-public';
fs.rmSync(at(opPublic), { recursive: true, force: true });
fs.mkdirSync(at(opPublic, 'downloads', 'operations'), { recursive: true });
for (const file of ['favicon.svg', 'brand-lockup.svg']) fs.copyFileSync(at('public', file), at(opPublic, file));
for (const name of ['operations-data', 'portfolio-data']) fs.copyFileSync(at(`content/${name}.json`), at(opPublic, `downloads/${name}.json`));
if (!fs.existsSync(at('public/portfolio-v15'))) throw new Error('public/portfolio-v15 자산을 먼저 준비하세요.');
fs.cpSync(at('public/portfolio-v15'), at(opPublic, 'portfolio-v15'), { recursive: true });
for (const guide of operations.guides) write(`${opPublic}/downloads/operations/${guide.id}.md`, operationMarkdown(guide));

// 공개 포트폴리오에는 장표·브랜드 자산만 포함한다.
const showcasePublic = '.cache/showcase-public';
fs.rmSync(at(showcasePublic), { recursive: true, force: true });
fs.mkdirSync(at(showcasePublic), { recursive: true });
fs.cpSync(at('public/portfolio-v15'), at(showcasePublic, 'portfolio-v15'), { recursive: true });

const index = {
  journal: {
    home: 'home--docs', worklog: 'journal-worklog--docs', decisions: 'journal-decisions--docs',
    portfolios: portfolio.brands.map((brand) => ({ slug: brand.slug, id: `portfolio-${brand.slug}--docs`, title: `최종 포트폴리오/${brand.name}` })),
  },
  operations: {
    home: 'ops-home--docs',
    guides: operations.guides.map((guide) => ({ id: guide.id, storyId: `ops-${guide.id}--docs`, title: `${guide.category}/${guide.code} ${guide.title}` })),
    portfolios: portfolio.brands.map((brand) => ({ slug: brand.slug, id: `portfolio-${brand.slug}--docs`, title: `브랜드 포트폴리오/${brand.name}` })),
  },
  counts: { milestones: journal.milestones.length, decisions: journal.decisions.length, guides: operations.guides.length, brands: portfolio.brands.length, boards: portfolio.brands.reduce((count, brand) => count + brand.boards.length, 0) },
};
write('src/generated/portal-index.json', `${JSON.stringify(index, null, 2)}\n`);
console.log(`포털 생성 완료: 작업 단계 ${index.counts.milestones}개 · 결정 ${index.counts.decisions}개 · 운영 문서 ${index.counts.guides}개 · 최종 포트폴리오 ${index.counts.brands}개 / ${index.counts.boards}장`);
