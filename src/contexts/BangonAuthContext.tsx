// BangonAuthContext — separate auth provider for the BangonGensan admin.
//
// Keeps state isolated from the BetterGenSan `AuthContext` so the two
// admin panels don't share `profile.is_admin` or stomp on each other.

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface BangonProfile {
  id: string;
  email: string | null;
  is_bangon_admin: boolean;
  display_name: string | null;
  avatar_url: string | null;
}

interface Ctx {
  user: User | null;
  session: Session | null;
  profile: BangonProfile | null;
  isBangonAdmin: boolean;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refresh: () => Promise<void>;
}

const BangonAuthCtx = createContext<Ctx | null>(null);

async function loadProfile(userId: string): Promise<BangonProfile | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('profiles')
    .select('id, email, is_bangon_admin, display_name, avatar_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('[BangonAuth] loadProfile error', error.message);
    return null;
  }
  return (data as BangonProfile | null) ?? null;
}

export function BangonAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<BangonProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) { setProfile(null); return; }
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

    const { data: sub } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        const p = await loadProfile(newSession.user.id);
        setProfile(p);
      } else {
        setProfile(null);
      }
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
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
    loading,
    signIn,
    signOut,
    refresh,
  };

  return <BangonAuthCtx.Provider value={value}>{children}</BangonAuthCtx.Provider>;
}

// eslint-disable-next-line react-refresh/only-export-components
export function useBangonAuth(): Ctx {
  const ctx = useContext(BangonAuthCtx);
  if (!ctx) throw new Error('useBangonAuth must be used inside <BangonAuthProvider />');
  return ctx;
}
