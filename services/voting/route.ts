import { env } from 'cloudflare:workers';

export const dynamic = 'force-dynamic';
const brands = ['gounbat', 'onari', 'hecale', 'ersa'] as const;
const browserIdHeader = 'X-Farm-Browser-Id';
const uuidV4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
const publicOrigins = new Set(['https://uxidesigner-ux.github.io', 'https://farm-bx-showcase.james8101.chatgpt.site']);
const policy = { identityMode: 'browser', toggleVotesAllowed: true, duplicateVotesAllowed: false, multipleProjectsAllowed: true, authenticated: false };
type CountRow = { brand: string; count: number };

// Historical account recommendations stay in totals. Earlier anonymous clicks
// in brand_votes are retained separately and are never counted by this API.
const countSql = `SELECT brand, SUM(count) AS count FROM (
  SELECT brand, COUNT(*) AS count FROM brand_recommendations GROUP BY brand
  UNION ALL
  SELECT brand, COUNT(*) AS count FROM browser_recommendations GROUP BY brand
) GROUP BY brand`;

function allowedOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  return !origin || publicOrigins.has(origin) || origin === new URL(request.url).origin;
}

function responseHeaders(request: Request): Headers {
  const output = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store, max-age=0',
    'Vary': `Origin, ${browserIdHeader}`,
    'X-Content-Type-Options': 'nosniff',
  });
  const origin = request.headers.get('Origin');
  if (origin && allowedOrigin(request)) {
    output.set('Access-Control-Allow-Origin', origin);
    output.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.set('Access-Control-Allow-Headers', `Content-Type, ${browserIdHeader}`);
  }
  return output;
}

function json(request: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: responseHeaders(request) });
}

function browserId(request: Request): string | null {
  const value = request.headers.get(browserIdHeader);
  return value === null ? null : value.trim().toLowerCase();
}

function aggregate(rows: CountRow[]) {
  const counts: Record<string, number> = Object.fromEntries(brands.map(brand => [brand, 0]));
  for (const row of rows) if (brands.includes(row.brand as typeof brands[number])) counts[row.brand] = Number(row.count);
  return counts;
}

function votedBrands(rows: { brand: string }[]) {
  return rows.map(row => row.brand).filter(brand => brands.includes(brand as typeof brands[number]));
}

async function browserKey(id: string) {
  // This identifies one persisted browser record, not a person or an account.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`farm-bx-browser-v1:${id}`));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

export async function OPTIONS(request: Request) {
  if (!allowedOrigin(request)) return json(request, { error: 'origin_not_allowed' }, 403);
  const method = request.headers.get('Access-Control-Request-Method')?.toUpperCase() || 'GET';
  if (!['GET', 'POST', 'OPTIONS'].includes(method)) return json(request, { error: 'method_not_allowed' }, 405);
  const requestedHeaders = (request.headers.get('Access-Control-Request-Headers') || '').split(',').map(value => value.trim().toLowerCase()).filter(Boolean);
  if (requestedHeaders.some(header => !['content-type', browserIdHeader.toLowerCase()].includes(header))) return json(request, { error: 'headers_not_allowed' }, 403);
  return new Response(null, { status: 204, headers: responseHeaders(request) });
}

export async function GET(request: Request) {
  const id = browserId(request);
  if (id !== null && !uuidV4.test(id)) return json(request, { error: 'invalid_browser_id' }, 400);
  try {
    if (!env.DB) return json(request, { error: 'storage_unavailable' }, 503);
    if (id === null) {
      const result = await env.DB.prepare(countSql).all<CountRow>();
      return json(request, { counts: aggregate(result.results), votedBrands: [], ...policy });
    }
    const result = await env.DB.batch([
      env.DB.prepare(countSql),
      env.DB.prepare('SELECT brand FROM browser_recommendations WHERE browser_id = ?').bind(await browserKey(id)),
    ]);
    return json(request, { counts: aggregate(result[0].results as CountRow[]), votedBrands: votedBrands(result[1].results as { brand: string }[]), ...policy });
  } catch { return json(request, { error: 'temporarily_unavailable' }, 503); }
}

export async function POST(request: Request) {
  if (!allowedOrigin(request)) return json(request, { error: 'origin_not_allowed' }, 403);
  const id = browserId(request);
  if (id === null) return json(request, { error: 'browser_id_required' }, 400);
  if (!uuidV4.test(id)) return json(request, { error: 'invalid_browser_id' }, 400);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return json(request, { error: 'json_required' }, 415);
  if (Number(request.headers.get('Content-Length') || '0') > 512) return json(request, { error: 'request_too_large' }, 413);
  let input: { brand?: unknown; recommended?: unknown };
  try {
    const text = await request.text();
    if (new TextEncoder().encode(text).byteLength > 512) return json(request, { error: 'request_too_large' }, 413);
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid body');
    input = parsed;
  } catch { return json(request, { error: 'invalid_json' }, 400); }
  if (typeof input.brand !== 'string' || !brands.includes(input.brand as typeof brands[number]) || typeof input.recommended !== 'boolean') return json(request, { error: 'invalid_vote' }, 400);
  try {
    if (!env.DB) return json(request, { error: 'storage_unavailable' }, 503);
    const key = await browserKey(id);
    // Desired state makes retries idempotent. The primary key permits at most
    // one recommendation per browser/project; removal touches only that row.
    const mutation = input.recommended
      ? env.DB.prepare('INSERT INTO browser_recommendations (browser_id, brand) VALUES (?, ?) ON CONFLICT(browser_id, brand) DO NOTHING').bind(key, input.brand)
      : env.DB.prepare('DELETE FROM browser_recommendations WHERE browser_id = ? AND brand = ?').bind(key, input.brand);
    const result = await env.DB.batch([
      mutation,
      env.DB.prepare(countSql),
      env.DB.prepare('SELECT brand FROM browser_recommendations WHERE browser_id = ?').bind(key),
    ]);
    const selected = votedBrands(result[2].results as { brand: string }[]);
    return json(request, {
      counts: aggregate(result[1].results as CountRow[]),
      votedBrands: selected,
      changed: result[0].meta.changes === 1,
      recommended: selected.includes(input.brand),
      ...policy,
    });
  } catch { return json(request, { error: 'temporarily_unavailable' }, 503); }
}
