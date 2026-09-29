import { createClient } from 'npm:@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') ?? '';
const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
const MAPBOX_TOKEN = Deno.env.get('MAPBOX_SEARCH_TOKEN') ?? '';
const GUEST_SALT = Deno.env.get('EARTHLINE_GUEST_HASH_SALT') ?? '';
const ORIGINS = (Deno.env.get('EARTHLINE_ALLOWED_ORIGINS') ?? 'https://earthlinedevelopment.org,https://www.earthlinedevelopment.org,https://live.earthlinedevelopment.org')
  .split(',').map(v => v.trim()).filter(Boolean);

const admin = SUPABASE_URL && SERVICE_ROLE
  ? createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false, autoRefreshToken: false } })
  : null;

function cors(origin: string | null) {
  const allowed = origin && ORIGINS.includes(origin) ? origin : ORIGINS[0] ?? 'https://earthlinedevelopment.org';
  return {
    'Access-Control-Allow-Origin': allowed,
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Vary': 'Origin',
    'Cache-Control': 'no-store'
  };
}

function json(body: unknown, status: number, origin: string | null) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...cors(origin), 'Content-Type': 'application/json; charset=utf-8' }
  });
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function actor(req: Request) {
  const authorization = req.headers.get('authorization') ?? '';
  if (authorization.toLowerCase().startsWith('bearer ') && admin) {
    const token = authorization.slice(7).trim();
    const { data, error } = await admin.auth.getUser(token);
    if (!error && data.user?.id) return { key: `user:${data.user.id}`, account: true };
  }

  const ip = (req.headers.get('cf-connecting-ip') || req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for') || '')
    .split(',')[0].trim();
  if (!ip || !GUEST_SALT) return null;
  return { key: `guest:${await sha256(`${GUEST_SALT}|${ip}`)}`, account: false };
}

Deno.serve(async (req) => {
  const origin = req.headers.get('origin');
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) });
  if (req.method !== 'GET') return json({ error: 'method-not-allowed' }, 405, origin);
  if (!origin || !ORIGINS.includes(origin)) return json({ error: 'origin-not-allowed' }, 403, origin);
  if (!admin || !MAPBOX_TOKEN || !GUEST_SALT) return json({ error: 'search-breaker-not-configured' }, 503, origin);

  const a = await actor(req);
  if (!a) return json({ error: 'search-breaker-no-actor' }, 503, origin);

  const url = new URL(req.url);
  const q = (url.searchParams.get('q') ?? '').trim();
  if (!q || q.length > 180) return json({ error: 'invalid-query' }, 400, origin);

  // One authoritative atomic claim happens BEFORE every upstream Mapbox search.
  const { data: gate, error: gateError } = await admin.rpc('earthline_claim_search', {
    p_actor_key: a.key,
    p_is_account: a.account
  });
  if (gateError || !gate?.allowed) {
    return json({ error: gate?.reason ?? 'quota-error', quota: gate ?? null }, 429, origin);
  }

  const upstream = new URL(`https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(q)}.json`);
  upstream.searchParams.set('access_token', MAPBOX_TOKEN);
  upstream.searchParams.set('limit', String(Math.min(10, Math.max(1, Number(url.searchParams.get('limit') ?? 5)))));
  const country = (url.searchParams.get('country') ?? '').trim();
  const language = (url.searchParams.get('language') ?? '').trim();
  const proximity = (url.searchParams.get('proximity') ?? '').trim();
  const types = (url.searchParams.get('types') ?? '').trim();
  if (country) upstream.searchParams.set('country', country);
  if (language) upstream.searchParams.set('language', language);
  if (/^-?\d+(?:\.\d+)?,-?\d+(?:\.\d+)?$/.test(proximity)) upstream.searchParams.set('proximity', proximity);
  if (/^[a-z_,]+$/i.test(types)) upstream.searchParams.set('types', types);

  try {
    const r = await fetch(upstream, { headers: { 'Accept': 'application/json' } });
    const body = await r.text();
    return new Response(body, {
      status: r.status,
      headers: { ...cors(origin), 'Content-Type': r.headers.get('content-type') ?? 'application/json' }
    });
  } catch (_) {
    return json({ error: 'upstream-search-unavailable' }, 503, origin);
  }
});
