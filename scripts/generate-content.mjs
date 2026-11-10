import fs from 'node:fs';
import path from 'node:path';
import { toId } from 'storybook/internal/csf';
const root = process.cwd();
const source = JSON.parse(fs.readFileSync(path.join(root, 'content/guide-data.json'), 'utf8'));
const counters = {};
const codes = { BX: 'B', '디자인': 'D', '개발': 'DEV', '마케팅': 'M', '운영': 'OPS' };
const documents = source.documents.map(doc => {
 const n = counters[doc.category] = (counters[doc.category] || 0) + 1;
 const code = codes[doc.category] + String(n).padStart(2, '0');
 const storyTitle = `${doc.category}/${code} ${doc.title}`;
 return { ...doc, code, storyTitle, storyId: toId(storyTitle, 'docs') };
});
const custom = [
 { file: 'home', title: '시작하기/H01 프로젝트 홈', component: 'HomePage' },
 { file: 'benchmarks', title: 'BX/B00 글로벌 벤치마크', component: 'BenchmarkPage' },
 { file: 'archive', title: '자료실/A01 산출물 다운로드', component: 'ArchivePage' },
];
const routes = Object.fromEntries(custom.map(d => [d.file, toId(d.title, 'docs')]));
fs.mkdirSync('src/generated', { recursive: true });
fs.mkdirSync('src/stories', { recursive: true });
fs.writeFileSync('src/generated/documents.json', JSON.stringify({ documents, routes }, null, 2));
for (const file of fs.readdirSync('src/stories')) if (/^doc-.*\.mdx$/.test(file)) fs.unlinkSync(path.join('src/stories', file));
for (const doc of documents) {
 fs.writeFileSync(`src/stories/doc-${doc.id}.mdx`, `import { Meta } from '@storybook/addon-docs/blocks';\nimport { GuidePage } from '../pages/GuidePage';\n\n<Meta title=${JSON.stringify(doc.storyTitle)} />\n\n<GuidePage documentId=${JSON.stringify(doc.id)} />\n`);
}
for (const item of custom) {
 fs.writeFileSync(`src/stories/${item.file}.mdx`, `import { Meta } from '@storybook/addon-docs/blocks';\nimport { ${item.component} } from '../pages/${item.component}';\n\n<Meta title=${JSON.stringify(item.title)} />\n\n<${item.component} />\n`);
}
fs.copyFileSync('content/benchmarks.json', 'public/downloads/benchmarks.json');
fs.copyFileSync('content/guide-data.json', 'public/downloads/guide-data.json');
console.log(`Generated ${documents.length} guides + ${custom.length} index pages.`);
