// bangon-fetch-comments — POC. Probes Regiment for the comments endpoint
// shape so we know how to design the full feature. Returns the first 2xx
// JSON response from a list of candidate URLs, or a 502 with every attempt
// recorded if none of them work.
//
// Status (2026-06-11): all 11 candidates returned 404 "route not found"
// from Regiment, even after the user reported they updated Regiment.
// The MCP wrappers (mcp__regiment__facebook__post-comments, etc.) also
// return "Unknown action". Regiment's working endpoints
// (/facebook/pages/{id}/posts, /facebook/search/posts) are unaffected
// and continue to power bangon-social-sync.
//
// Next session: get the correct endpoint shape from Regiment (docs or
// direct ask). When known, point this POC at it and verify, then design
// the storage table + UI feature.
//
// Usage: GET /functions/v1/bangon-fetch-comments?post=<FB_URL_OR_PFBID>
// Auth: anon. Deploy: supabase functions deploy bangon-fetch-comments --no-verify-jwt

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};
const json = (b: unknown, s = 200) =>
  new Response(JSON.stringify(b, null, 2), {
    status: s,
    headers: { 'Content-Type': 'application/json', ...cors },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });

  const u = new URL(req.url);
  const post = u.searchParams.get('post');
  if (!post) return json({ error: 'post param required' }, 400);

  const supa = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    { auth: { persistSession: false } },
  );
  const key =
    Deno.env.get('REGIMENT_API_KEY') ??
    (await supa.rpc('get_vault_secret', { secret_name: 'REGIMENT_API_KEY' })).data;
  if (!key) return json({ error: 'no key' }, 500);

  // Try pfbid alone too, in case Regiment wants the bare hash.
  const m = post.match(/pfbid[a-zA-Z0-9]+/);
  const pfbid = m ? m[0] : post;

  const candidates = [
    `https://regiment.me/api/v1/facebook/posts/${pfbid}/comments`,
    `https://regiment.me/api/v1/facebook/scrape-comments?postUrl=${encodeURIComponent(post)}`,
    `https://regiment.me/api/v1/facebook/scrape/comments?postUrl=${encodeURIComponent(post)}`,
    `https://regiment.me/api/v1/facebook/comments/scrape?postUrl=${encodeURIComponent(post)}`,
    `https://regiment.me/api/v1/facebook/post-comments?postUrl=${encodeURIComponent(post)}`,
    `https://regiment.me/api/v1/facebook/post-comments?url=${encodeURIComponent(post)}`,
    `https://regiment.me/api/v1/facebook/post/comments?url=${encodeURIComponent(post)}`,
    `https://regiment.me/api/v1/facebook/post/${pfbid}/comments`,
    `https://regiment.me/api/v1/facebook/comments?url=${encodeURIComponent(post)}`,
    // Route discovery / health.
    `https://regiment.me/api/v1/facebook`,
    `https://regiment.me/api/v1`,
  ];

  // deno-lint-ignore no-explicit-any
  const attempts: any[] = [];
  for (const url of candidates) {
    const t0 = Date.now();
    try {
      const r = await fetch(url, {
        headers: { 'X-API-Key': key, Accept: 'application/json' },
      });
      const text = await r.text();
      attempts.push({
        url,
        status: r.status,
        ms: Date.now() - t0,
        bodyPreview: text.slice(0, 1200),
      });
      if (r.ok) {
        try {
          return json({ ok: true, working_url: url, response: JSON.parse(text), attempts });
        } catch {
          return json({ ok: true, working_url: url, raw: text.slice(0, 8000), attempts });
        }
      }
    } catch (e) {
      attempts.push({
        url,
        error: e instanceof Error ? e.message : String(e),
        ms: Date.now() - t0,
      });
    }
  }
  return json({ ok: false, attempts }, 502);
});
