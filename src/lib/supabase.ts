import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as
  | string
  | undefined

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Missing Supabase env vars. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local'
  )
}

// NB: leave the default Web Locks API lock in place. A passthrough lock
// previously caused intermittent first-paint failures on admin pages —
// the lock was actually coordinating concurrent session restores between
// the BetterGensan AuthContext and the BangonAuthContext.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

// Silence the noisy "Lock 'sb-…-auth-token' was released because another
// request stole it" message that fires in dev when React strict mode
// double-mounts auth contexts. The lock is doing its job (coordinating
// session restoration); the message is just informational and does not
// indicate a real failure. Both console.error and console.warn paths are
// patched because the Supabase auth-js library has used both over versions.
if (typeof console !== 'undefined') {
  const lockNoisePattern = /Lock ["']?sb-[^"']+auth[^"']*["']? was released because another request stole it/i;
  const filter = (orig: (...args: unknown[]) => void) => {
    return (...args: unknown[]) => {
      const first = args[0];
      const msg = typeof first === 'string' ? first
        : first instanceof Error ? first.message
        : '';
      if (lockNoisePattern.test(msg)) return;
      orig(...args);
    };
  };
  console.error = filter(console.error.bind(console));
  console.warn = filter(console.warn.bind(console));
}
