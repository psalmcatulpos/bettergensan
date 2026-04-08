import { supabase } from './supabase';

export type Profile = {
  id: string;
  email: string | null;
  is_admin: boolean;
};

export async function getCurrentProfile(): Promise<Profile | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('id, email, is_admin')
    .eq('id', user.id)
    .maybeSingle();

  return data ?? null;
}

export function signInWithPassword(email: string, password: string) {
  return supabase.auth.signInWithPassword({ email, password });
}

export function signInWithOtp(email: string) {
  return supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/admin`,
    },
  });
}

export function signUpWithPassword(email: string, password: string) {
  return supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/admin`,
    },
  });
}

export function signOut() {
  return supabase.auth.signOut();
}
