import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import { stripTypeScriptTypes } from 'node:module';
import { DatabaseSync } from 'node:sqlite';
import { randomUUID } from 'node:crypto';

// Execute the production handler against isolated SQLite, with no network or production writes.
const db = new DatabaseSync(':memory:');
for (const name of ['0000_brand_votes.sql', '0001_brand_recommendations.sql', '0002_browser_recommendations.sql']) {
  db.exec(await fs.readFile(new URL(name, import.meta.url), 'utf8'));
}
db.exec("INSERT INTO brand_votes VALUES ('old-click', 'onari'); INSERT INTO brand_recommendations VALUES ('old-account', 'onari')");
class Statement {
  constructor(sql, values = []) { this.sql = sql; this.values = values; }
  bind(...values) { return new Statement(this.sql, values); }
  execute() {
    const statement = db.prepare(this.sql);
    if (statement.columns().length) return { results: statement.all(...this.values), meta: { changes: 0 } };
    return { results: [], meta: { changes: Number(statement.run(...this.values).changes) } };
  }
  async all() { return this.execute(); }
}
const environment = { DB: {
  prepare: sql => new Statement(sql),
  async batch(statements) {
    db.exec('BEGIN');
    try { const result = statements.map(statement => statement.execute()); db.exec('COMMIT'); return result; }
    catch (error) { db.exec('ROLLBACK'); throw error; }
  },
} };
globalThis.__browserVoteTestEnvironment = environment;
const source = await fs.readFile(new URL('route.ts', import.meta.url), 'utf8');
const code = stripTypeScriptTypes(source).replace(/import\s*\{\s*env\s*\}\s*from\s*['"]cloudflare:workers['"];?/, 'const env = globalThis.__browserVoteTestEnvironment;');
const handler = await import(`data:text/javascript;base64,${Buffer.from(code).toString('base64')}`);
const a = randomUUID(), b = randomUUID();
let checks = 0;
async function call(method = 'GET', id, payload, extra = {}) {
  const headers = { Origin: 'https://uxidesigner-ux.github.io', ...extra };
  if (id !== undefined) headers['X-Farm-Browser-Id'] = id;
  if (payload !== undefined) headers['Content-Type'] = 'application/json';
  const response = await handler[method](new Request('https://farm-bx-showcase.james8101.chatgpt.site/api/votes', {
    method, headers, ...(payload === undefined ? {} : { body: JSON.stringify(payload) }),
  }));
  return { status: response.status, headers: response.headers, data: response.status === 204 ? null : await response.json() };
}
const check = (condition, message) => { assert.ok(condition, message); checks++; };
try {
  let response = await call();
  check(response.status === 200 && response.data.counts.onari === 1 && response.data.votedBrands.length === 0, 'Retain account totals; exclude historical clicks');
  check(response.data.identityMode === 'browser' && response.data.toggleVotesAllowed && !response.data.duplicateVotesAllowed && response.data.multipleProjectsAllowed, 'Anonymous toggle contract');
  response = await call('OPTIONS', undefined, undefined, { 'Access-Control-Request-Method': 'POST', 'Access-Control-Request-Headers': 'content-type,x-farm-browser-id' });
  check(response.status === 204 && response.headers.get('Access-Control-Allow-Origin') === 'https://uxidesigner-ux.github.io', 'Pages CORS preflight');
  check((await call('POST', undefined, { brand: 'onari', recommended: true })).status === 400, 'Require persistent browser ID');
  check((await call('POST', 'broken', { brand: 'onari', recommended: true })).status === 400, 'Reject malformed browser ID');
  check((await call('POST', a, { brand: 'onari' })).status === 400, 'Require desired boolean state');
  check((await call('POST', a, { brand: 'onari', recommended: true }, { Origin: 'https://untrusted.invalid' })).status === 403, 'Reject untrusted origins');
  response = await call('POST', a, { brand: 'onari', recommended: true });
  check(response.status === 200 && response.data.changed && response.data.recommended && response.data.counts.onari === 2, 'Add anonymous browser recommendation');
  const retries = await Promise.all(Array.from({ length: 10 }, () => call('POST', a, { brand: 'onari', recommended: true })));
  check(retries.every(result => !result.data.changed && result.data.counts.onari === 2), 'Concurrent retries do not duplicate');
  for (const brand of ['gounbat', 'hecale', 'ersa']) await call('POST', a, { brand, recommended: true });
  response = await call('GET', a);
  check(response.data.votedBrands.length === 4 && response.data.counts.ersa === 1, 'All four projects independent and retained after read');
  await call('POST', b, { brand: 'onari', recommended: true });
  response = await call('POST', a, { brand: 'onari', recommended: false });
  check(response.data.changed && !response.data.recommended && response.data.counts.onari === 2 && response.data.votedBrands.length === 3, 'Withdrawal removes only current browser/project');
  response = await call('POST', a, { brand: 'onari', recommended: false });
  check(!response.data.changed && response.data.counts.onari === 2, 'Repeated withdrawal is idempotent');
  check((await call('GET', b)).data.votedBrands.includes('onari'), 'Another browser retains its vote');
  response = await call('POST', a, { brand: 'onari', recommended: true });
  check(response.data.changed && response.data.counts.onari === 3, 'Re-recommend after withdrawal');
  check(response.headers.get('Cache-Control').includes('no-store') && response.headers.get('Vary').includes('X-Farm-Browser-Id'), 'No shared browser-state cache');
  check(db.prepare('SELECT COUNT(*) AS n FROM brand_recommendations').get().n === 1 && db.prepare('SELECT COUNT(*) AS n FROM brand_votes').get().n === 1, 'Historical records preserved');
  environment.DB = undefined;
  check((await call('GET', a)).status === 503, 'Unavailable database is a retryable failure');
  console.log(`PASS: ${checks} browser recommendation API checks (isolated SQLite; zero production writes)`);
} finally { delete globalThis.__browserVoteTestEnvironment; db.close(); }
