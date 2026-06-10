// Dedicated Supabase client for the BangonGensan admin surface.
//
// Why a SECOND client instead of reusing `./supabase`?
//
//   Both clients talk to the same project, but they each persist their
//   session under a different `storageKey` in localStorage. That
//   isolates the admin auth state from the public BangonGensan page's
//   (anon) client and from the BetterGensan AuthContext.
//
//   Without this split, opening `/bangon-gensan/admin` in one tab and
//   `/bangon-gensan` in another would cause Supabase's cross-tab
//   `BroadcastChannel` + Web Locks coordination to fight over the same
//   session token. That race serialises every DB call behind a stalled
//   auth refresh and the public page's queries time out at ~12 s
//   (visible as `[gensanCache] read* timed out`).
//
//   Two clients, two storage keys, two locks → no cross-tab contention.
//
// Use this client from:
//   - src/contexts/BangonAuthContext.tsx
//   - src/lib/bangonAudit.ts
//   - src/pages/bangon-admin/*
//
// Do NOT use it from the public /bangon-gensan page or from the
// BetterGensan admin (`/admin/*`). Those keep using `./supabase`.

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local',
  );
}

export const supabaseBangonAdmin = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    // Distinct storage key so this client's session is invisible to the
    // public supabase client (and vice versa). Both clients can coexist
    // in different browser tabs of the same origin without racing.
    storageKey: 'sb-bangon-admin-auth',
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
