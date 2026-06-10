// bangon-create-staff — super-admin-only endpoint to create new BangonGensan
// admin accounts.
//
// Auth model:
//   - Caller must be authenticated and `is_bangon_super_admin = true` in
//     public.profiles. We verify this on the edge function side by decoding
//     the caller's JWT and re-checking via the service-role client.
//   - The created user is automatically email-confirmed (no verification
//     mail required) and promoted to `is_bangon_admin = true` (NOT super).
//
// Deploy: supabase functions deploy bangon-create-staff
//   (verify_jwt is enabled — only authenticated requests get past the gate.)

import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import { createClient } from 'jsr:@supabase/supabase-js@2';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: cors });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  const authHeader = req.headers.get('authorization');
  if (!authHeader) return json({ error: 'Missing authorization header' }, 401);
  const jwt = authHeader.replace(/^Bearer\s+/i, '');
  if (!jwt) return json({ error: 'Invalid authorization header' }, 401);

  const admin = createClient(supabaseUrl, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  // Verify caller identity + super-admin gate.
  const { data: caller, error: callerErr } = await admin.auth.getUser(jwt);
  if (callerErr || !caller?.user) {
    return json({ error: 'Invalid token' }, 401);
  }
  const { data: profile, error: profileErr } = await admin
    .from('profiles')
    .select('is_bangon_super_admin')
    .eq('id', caller.user.id)
    .maybeSingle();
  if (profileErr) return json({ error: profileErr.message }, 500);
  if (!profile?.is_bangon_super_admin) {
    return json({ error: 'Forbidden — super-admin only' }, 403);
  }

  // Parse and validate the body.
  let payload: { email?: string; password?: string; display_name?: string };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Body must be valid JSON' }, 400);
  }
  const email = (payload.email ?? '').trim().toLowerCase();
  const password = payload.password ?? '';
  const display_name = (payload.display_name ?? '').trim().slice(0, 50);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return json({ error: 'Invalid email' }, 400);
  }
  if (password.length < 8) {
    return json({ error: 'Password must be at least 8 characters' }, 400);
  }
  if (display_name.length < 1) {
    return json({ error: 'Display name is required' }, 400);
  }

  // Create the Supabase auth user. The trigger on auth.users creates a
  // matching profiles row; we then promote it.
  const { data: created, error: createErr } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { display_name },
  });
  if (createErr || !created?.user) {
    const msg = createErr?.message ?? 'Could not create user';
    const status = msg.toLowerCase().includes('already') ? 409 : 400;
    return json({ error: msg }, status);
  }

  const { error: updateErr } = await admin
    .from('profiles')
    .update({ is_bangon_admin: true, display_name })
    .eq('id', created.user.id);
  if (updateErr) {
    // Best-effort: don't roll back the auth user, but surface the issue.
    return json({
      ok: true,
      id: created.user.id,
      email,
      warning: `Auth user created but profile promotion failed: ${updateErr.message}`,
    });
  }

  return json({
    ok: true,
    id: created.user.id,
    email,
    display_name,
    is_bangon_admin: true,
  });
});
