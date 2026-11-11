import { env } from 'cloudflare:workers';

export const dynamic = 'force-dynamic';
const brands = ['gounbat', 'onari', 'hecale', 'ersa'] as const;
const allowedOrigins = new Set(['https://uxidesigner-ux.github.io', 'https://farm-bx-showcase.james8101.chatgpt.site']);
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function headers(request: Request): Headers {
  const output = new Headers({ 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store, max-age=0', 'Vary': 'Origin', 'X-Content-Type-Options': 'nosniff' });
  const origin = request.headers.get('Origin');
  if (origin && (allowedOrigins.has(origin) || origin === new URL(request.url).origin)) {
    output.set('Access-Control-Allow-Origin', origin);
    output.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    output.set('Access-Control-Allow-Headers', 'Content-Type');
  }
  return output;
}

function json(request: Request, value: unknown, status = 200) {
  return new Response(JSON.stringify(value), { status, headers: headers(request) });
}

function aggregate(rows: { brand: string; count: number }[]) {
  const counts: Record<string, number> = Object.fromEntries(brands.map(brand => [brand, 0]));
  for (const row of rows) if (brands.includes(row.brand as typeof brands[number])) counts[row.brand] = Number(row.count);
  return counts;
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin && !allowedOrigins.has(origin) && origin !== new URL(request.url).origin) return json(request, { error: 'origin_not_allowed' }, 403);
  return new Response(null, { status: 204, headers: headers(request) });
}

export async function GET(request: Request) {
  try {
    if (!env.DB) return json(request, { error: 'storage_unavailable' }, 503);
    const result = await env.DB.prepare('SELECT brand, COUNT(*) AS count FROM brand_votes GROUP BY brand').all<{ brand: string; count: number }>();
    return json(request, { counts: aggregate(result.results), duplicateVotesAllowed: true });
  } catch { return json(request, { error: 'temporarily_unavailable' }, 503); }
}

export async function POST(request: Request) {
  const origin = request.headers.get('Origin');
  if (origin && !allowedOrigins.has(origin) && origin !== new URL(request.url).origin) return json(request, { error: 'origin_not_allowed' }, 403);
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) return json(request, { error: 'json_required' }, 415);
  if (Number(request.headers.get('Content-Length') || '0') > 512) return json(request, { error: 'request_too_large' }, 413);
  let input: { brand?: unknown; requestId?: unknown };
  try {
    const text = await request.text();
    if (text.length > 512) return json(request, { error: 'request_too_large' }, 413);
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('invalid body');
    input = parsed;
  } catch { return json(request, { error: 'invalid_json' }, 400); }
  if (typeof input.brand !== 'string' || !brands.includes(input.brand as typeof brands[number]) || typeof input.requestId !== 'string' || !uuid.test(input.requestId)) return json(request, { error: 'invalid_vote' }, 400);
  try {
    if (!env.DB) return json(request, { error: 'storage_unavailable' }, 503);
    // A new click gets a new request ID. Retrying a failed network response reuses
    // the ID, so intentional repeat votes count while transport retries do not.
    // No visitor identifier, account, IP address, or cookie is stored.
    const result = await env.DB.batch([
      env.DB.prepare('INSERT INTO brand_votes (request_id, brand) VALUES (?, ?) ON CONFLICT(request_id) DO NOTHING').bind(input.requestId, input.brand),
      env.DB.prepare('SELECT brand, COUNT(*) AS count FROM brand_votes GROUP BY brand'),
    ]);
    return json(request, { counts: aggregate(result[1].results as { brand: string; count: number }[]), counted: result[0].meta.changes === 1, duplicateVotesAllowed: true });
  } catch { return json(request, { error: 'temporarily_unavailable' }, 503); }
}
