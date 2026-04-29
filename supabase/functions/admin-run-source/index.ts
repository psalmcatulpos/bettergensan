// admin-run-source: authenticated admin-only entry point that triggers a
// scraper for a given source slug. Route table maps slugs to edge functions.
//
// For multi-endpoint scrapers (gensan-procurement-refresh, gensan-splis-refresh)
// the slug also drives the body params forwarded to the underlying function.
//
// Deploy after merging the feature branch:
//   supabase functions deploy admin-run-source --verify-jwt

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface Route {
  fn: string;
  endpoint?: string;
  body?: Record<string, unknown>;
}

const SLUG_TO_FN: Record<string, Route> = {
  'indeed-jobs': { fn: 'jobs-refresh' },
  'linkedin-jobs': { fn: 'linkedin-refresh' },
  'gensan-executive-orders': { fn: 'gensan-eo-refresh' },
  'gensan-procurement-bidresults': {
    fn: 'gensan-procurement-refresh',
    endpoint: 'bidresults',
  },
  'gensan-procurement-indicative-items': {
    fn: 'gensan-procurement-refresh',
    endpoint: 'indicative-items',
  },
  'gensan-procurement-infra-publications': {
    fn: 'gensan-procurement-refresh',
    endpoint: 'infra-publications',
  },
  'gensan-procurement-ongoing-alter-bids': {
    fn: 'gensan-procurement-refresh',
    endpoint: 'ongoing-alter-bids',
  },
  'gensan-procurement-ongoing-alternative-bids': {
    fn: 'gensan-procurement-refresh',
    endpoint: 'ongoing-alternative-bids',
  },
  'gensan-procurement-ongoing-competitive-bids': {
    fn: 'gensan-procurement-refresh',
    endpoint: 'ongoing-competitive-bids',
  },
  'gensan-procurement-price-catalogue': {
    fn: 'gensan-procurement-refresh',
    endpoint: 'price-catalogue',
  },
  'gensan-splis-ordinances': {
    fn: 'gensan-splis-refresh',
    body: { record_type: 'Ordinance' },
  },
  'gensan-splis-resolutions': {
    fn: 'gensan-splis-refresh',
    body: { record_type: 'Resolution' },
  },
  'bisto-infrastructure': { fn: 'bisto-sync' },
  'gensan-hrmdo': { fn: 'hrmdo-refresh' },
};

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'POST required' }, 405);

  const authHeader = req.headers.get('Authorization') ?? '';
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false },
  });

  const { data: userRes, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userRes?.user) return json({ error: 'Unauthorized' }, 401);

  const { data: isAdmin, error: adminErr } = await userClient.rpc('is_admin');
  if (adminErr) return json({ error: adminErr.message }, 500);
  if (!isAdmin) return json({ error: 'Forbidden' }, 403);

  let body: { slug?: string; trigger?: string; force?: boolean } = {};
  try {
    body = await req.json();
  } catch {
    // empty body is allowed
  }
  const slug = body.slug ?? 'indeed-jobs';
  const trigger = body.trigger ?? 'manual';

  const route = SLUG_TO_FN[slug];
  if (!route) {
    return json({ error: `No scraper wired for slug '${slug}'` }, 404);
  }

  const targetUrl = new URL(`${supabaseUrl}/functions/v1/${route.fn}`);
  targetUrl.searchParams.set('force', '1');
  targetUrl.searchParams.set('trigger', trigger);
  if (route.endpoint) targetUrl.searchParams.set('endpoint', route.endpoint);

  const fetchBody: Record<string, unknown> = {
    trigger,
    force: true,
    ...(route.body ?? {}),
  };
  if (route.endpoint) fetchBody.endpoint = route.endpoint;

  const res = await fetch(targetUrl.toString(), {
    method: 'POST',
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(fetchBody),
  });
  const text = await res.text();
  let payload: unknown = text;
  try {
    payload = JSON.parse(text);
  } catch {
    // leave as text
  }

  return json(
    {
      ok: res.ok,
      slug,
      trigger,
      upstream: payload,
    },
    res.ok ? 200 : 502,
  );
});
