import { env } from 'cloudflare:workers';

export const dynamic = 'force-dynamic';
const brands = ['gounbat', 'onari', 'hecale', 'ersa'] as const;
const siteOrigin = 'https://farm-bx-showcase.james8101.chatgpt.site';
const publicOrigins = new Set(['https://uxidesigner-ux.github.io', siteOrigin]);
const policy = { duplicateVotesAllowed: false, multipleProjectsAllowed: true };
type CountRow = { brand: string; count: number };

function authenticatedId(request: Request): string | null {
  // Sites dispatch supplies this authenticated identity header. Never accept a
  // voter ID, account, or identity claim from the request body or query string.
  return request.headers.get('oai-authenticated-user-id')?.trim() || null;
}

function responseHeaders(request: Request, personal = false): Headers {
  const output = new Headers({
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'private, no-store, max-age=0',
    'Vary': 'Origin, Cookie',
    'X-Content-Type-Options': 'nosniff',
  });
  const origin = request.headers.get('Origin');
  if (!personal && origin && (publicOrigins.has(origin) || origin === new URL(request.url).origin)) {
    output.set('Access-Control-Allow-Origin', origin);
    output.set('Access-Control-Allow-Methods', 'GET, OPTIONS');
  }
  return output;
}

function json(request: Request, value: unknown, status = 200, personal = false) {
  return new Response(JSON.stringify(value), { status, headers: responseHeaders(request, personal) });
}

function aggregate(rows: CountRow[]) {
  const counts: Record<string, number> = Object.fromEntries(brands.map(brand => [brand, 0]));
  for (const row of rows) if (brands.includes(row.brand as typeof brands[number])) counts[row.brand] = Number(row.count);
  return counts;
}

function votedBrands(rows: { brand: string }[]) {
  return rows.map(row => row.brand).filter(brand => brands.includes(brand as typeof brands[number]));
}

async function voterKey(userId: string) {
  // Only an opaque hash is persisted. Email and display name are unnecessary.
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(`farm-bx-recommendation-v2:${userId}`));
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
}

function sameOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  return !origin || origin === new URL(request.url).origin;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('Origin');
  const method = request.headers.get('Access-Control-Request-Method')?.toUpperCase() || 'GET';
  if (origin && !publicOrigins.has(origin) && origin !== new URL(request.url).origin) return json(request, { error: 'origin_not_allowed' }, 403);
  if (method !== 'GET' && method !== 'OPTIONS') return json(request, { error: 'same_origin_voting_required' }, 403);
  return new Response(null, { status: 204, headers: responseHeaders(request) });
}

export async function GET(request: Request) {
  const userId = authenticatedId(request);
  try {
    if (!env.DB) return json(request, { error: 'storage_unavailable' }, 503, Boolean(userId));
    const countQuery = env.DB.prepare('SELECT brand, COUNT(*) AS count FROM brand_recommendations GROUP BY brand');
    if (!userId) {
      const result = await countQuery.all<CountRow>();
      return json(request, { counts: aggregate(result.results), authenticated: false, votedBrands: [], ...policy });
    }
    const result = await env.DB.batch([
      countQuery,
      env.DB.prepare('SELECT brand FROM brand_recommendations WHERE voter_id = ?').bind(await voterKey(userId)),
    ]);
    return json(request, { counts: aggregate(result[0].results as CountRow[]), authenticated: true, votedBrands: votedBrands(result[1].results as { brand: string }[]), ...policy }, 200, true);
  } catch { return json(request, { error: 'temporarily_unavailable' }, 503, Boolean(userId)); }
}

export async function POST(request: Request) {
  if (!sameOrigin(request)) return json(request, { error: 'same_origin_voting_required' }, 403, true);
  const userId = authenticatedId(request);
  if (!userId) return json(request, { error: 'authentication_required' }, 401, true);
  if (!/^application\/json(?:\s*;|$)/i.test(request.headers.get('Content-Type') || '')) return json(request, { error: 'json_required' }, 415, true);
  if (Number(request.headers.get('Content-Length') || '0') > 512) return json(request, { error: 'request_too_large' }, 413, true);
  let input: { brand?: unknown };
  try {
    const text = await request.text();
    if (text.length > 512) return json(request, { error: 'request_too_large' }, 413, true);
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid body');
    input = parsed;
  } catch { return json(request, { error: 'invalid_json' }, 400, true); }
  if (typeof input.brand !== 'string' || !brands.includes(input.brand as typeof brands[number])) return json(request, { error: 'invalid_vote' }, 400, true);
  try {
    if (!env.DB) return json(request, { error: 'storage_unavailable' }, 503, true);
    const key = await voterKey(userId);
    // The composite primary key prevents repeat votes atomically, including
    // simultaneous requests, network retries, and votes from another device.
    // Legacy anonymous brand_votes rows remain untouched as historical records.
    const result = await env.DB.batch([
      env.DB.prepare('INSERT INTO brand_recommendations (voter_id, brand) VALUES (?, ?) ON CONFLICT(voter_id, brand) DO NOTHING').bind(key, input.brand),
      env.DB.prepare('SELECT brand, COUNT(*) AS count FROM brand_recommendations GROUP BY brand'),
      env.DB.prepare('SELECT brand FROM brand_recommendations WHERE voter_id = ?').bind(key),
    ]);
    return json(request, {
      counts: aggregate(result[1].results as CountRow[]),
      counted: result[0].meta.changes === 1,
      authenticated: true,
      votedBrands: votedBrands(result[2].results as { brand: string }[]),
      ...policy,
    }, 200, true);
  } catch { return json(request, { error: 'temporarily_unavailable' }, 503, true); }
}
