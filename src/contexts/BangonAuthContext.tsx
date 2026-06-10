// BangonAuthContext — separate auth provider for the BangonGensan admin.
//
// Keeps state isolated from the BetterGenSan `AuthContext` so the two
// admin panels don't share `profile.is_admin` or stomp on each other.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabaseBangonAdmin as supabase } from '../lib/supabaseBangonAdmin';

interface BangonProfile {
  id: string;
  email: string | null;
  is_bangon_admin: boolean;
  is_bangon_super_admin: boolean;
  display_name: string | null;
  avatar_url: string | null;
}

interface Ctx {
  user: User | null;
  session: Session | null;
  profile: BangonProfile | null;
  isBangonAdmin: boolean;
  isBangonSuperAdmin: boolean;
  loading: boolean;
  signIn: (
    email: string,
    password: string
  ) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const BangonAuthCtx = createContext<Ctx | null>(null);

async function loadProfile(userId: string): Promise<BangonProfile | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select(
      'id, email, is_bangon_admin, is_bangon_super_admin, display_name, avatar_url'
    )
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[BangonAuth] loadProfile error', error.message);
    return null;
  }
  return (data as BangonProfile | null) ?? null;
}

export function BangonAuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<BangonProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      return;
    }
    const p = await loadProfile(user.id);
    setProfile(p);
  }, [user]);

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const { data } = await supabase.auth.getSession();
      if (!mounted) return;
      setSession(data.session);
      setUser(data.session?.user ?? null);
      if (data.session?.user) {
        const p = await loadProfile(data.session.user.id);
        if (mounted) setProfile(p);
      }
      if (mounted) setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange(
      (_event, newSession) => {
        setSession(newSession);
        setUser(newSession?.user ?? null);
        if (newSession?.user) {
          // IMPORTANT: never await a Supabase call directly inside this
          // callback. onAuthStateChange runs while the auth lock
          // (navigator.locks) is held; loadProfile() issues a DB query that
          // needs the same lock to attach the access token, which deadlocks.
          // On refresh that hangs forever and the admin route is stuck on
          // its "Loading…" screen. Defer the read so it runs after the
          // callback returns and the lock is released.
          const uid = newSession.user.id;
          setTimeout(() => {
            if (!mounted) return;
            void loadProfile(uid).then(p => {
              if (mounted) setProfile(p);
            });
          }, 0);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return { error: error.message };
    return { error: null };
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value: Ctx = {
    user,
    session,
    profile,
    isBangonAdmin: !!profile?.is_bangon_admin,
    isBangonSuperAdmin: !!profile?.is_bangon_super_admin,
    loading,
    signIn,
    signOut,
    refresh,
  };

  return (
    <BangonAuthCtx.Provider value={value}>{children}</BangonAuthCtx.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBangonAuth(): Ctx {
  const ctx = useContext(BangonAuthCtx);
  if (!ctx)
    throw new Error('useBangonAuth must be used inside <BangonAuthProvider />');
  return ctx;
}
