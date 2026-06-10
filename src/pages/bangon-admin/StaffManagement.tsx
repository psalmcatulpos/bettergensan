// /bangon-gensan/admin/staff — super-admin-only page to add new staff.
//
// Only renders for admins where profile.is_bangon_super_admin === true.
// Regular staff who somehow reach the route see a denied screen instead of
// the form. The actual user creation runs in the bangon-create-staff edge
// function with service-role privileges (browsers can't touch auth.users).

import { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { ShieldCheck, UserPlus, Check, Copy, ShieldAlert } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { supabaseBangonAdmin as supabase } from '../../lib/supabaseBangonAdmin';
import { useBangonAuth } from '../../contexts/BangonAuthContext';
import { cleanText } from '../../lib/bangonSanitize';

type StaffRow = {
  id: string;
  email: string;
  display_name: string | null;
  is_bangon_admin: boolean;
  is_bangon_super_admin: boolean;
};

function randomPassword(): string {
  // 12 chars, alphanumeric — readable enough to dictate, strong enough.
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  let out = '';
  const buf = new Uint8Array(12);
  crypto.getRandomValues(buf);
  for (let i = 0; i < 12; i++) out += chars[buf[i] % chars.length];
  return out;
}

export default function StaffManagement() {
  const { profile, session, isBangonSuperAdmin, loading } = useBangonAuth();
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState(() => randomPassword());
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastCreated, setLastCreated] = useState<{ email: string; password: string; display_name: string } | null>(null);
  const [staffList, setStaffList] = useState<StaffRow[]>([]);
  const [copied, setCopied] = useState(false);

  const loadStaff = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('profiles')
      .select('id, email, display_name, is_bangon_admin, is_bangon_super_admin')
      .eq('is_bangon_admin', true)
      .order('email', { ascending: true });
    setStaffList((data as StaffRow[]) ?? []);
  };

  useEffect(() => { void loadStaff(); }, []);

  if (loading) {
    return <div className="p-6 text-gray-400 text-xs uppercase tracking-widest">Loading…</div>;
  }
  if (!isBangonSuperAdmin) {
    return <Navigate to="/bangon-gensan/admin" replace />;
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session?.access_token) { setError('Not signed in.'); return; }
    const cleanEmail = cleanText(email, 120).toLowerCase();
    const cleanName = cleanText(displayName, 50);
    if (!cleanEmail || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(cleanEmail)) {
      setError('Enter a valid email.'); return;
    }
    if (cleanName.length < 1) { setError('Display name is required.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setBusy(true);
    setError(null);
    try {
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/bangon-create-staff`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ email: cleanEmail, password, display_name: cleanName }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setError(data.error || `Failed (${res.status})`);
        return;
      }
      setLastCreated({ email: cleanEmail, password, display_name: cleanName });
      setEmail('');
      setDisplayName('');
      setPassword(randomPassword());
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Network error.');
    } finally {
      setBusy(false);
    }
  };

  const copyCreds = () => {
    if (!lastCreated) return;
    const text = `BangonGensan Admin\nEmail: ${lastCreated.email}\nPassword: ${lastCreated.password}\nName: ${lastCreated.display_name}\nLogin: ${window.location.origin}/bangon-gensan/login`;
    void navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <>
      <Helmet><title>Staff Management — BangonGensan Admin</title></Helmet>
      <div className="p-4 sm:p-6 space-y-4 max-w-3xl">
        <div className="flex items-center gap-3">
          <ShieldCheck size={18} className="text-red-300" />
          <h1 className="text-white font-bold uppercase tracking-widest text-base sm:text-lg">Staff Management</h1>
          <span className="ml-auto inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-600/15 border border-red-500/40 text-red-200 text-[9px] font-bold uppercase tracking-widest">
            <ShieldAlert size={9} />Super Admin Only
          </span>
        </div>

        <p className="text-[12px] text-gray-400 leading-relaxed">
          Create new BangonGensan admin accounts. Staff you add here get
          access to the admin panel (verification queue, fundraisers, chat,
          audit log) but cannot create more accounts.
        </p>

        {/* ── Create form ── */}
        <form onSubmit={submit} className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <UserPlus size={14} className="text-gray-400" />
            <h2 className="text-[12px] font-bold uppercase tracking-widest text-gray-300">Add new staff</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Display name</span>
              <input
                type="text"
                value={displayName}
                onChange={e => setDisplayName(e.target.value)}
                maxLength={50}
                placeholder="Juan Dela Cruz"
                className="w-full px-3 py-3 sm:py-2.5 rounded-md bg-[#111720] border border-gray-700 text-white text-sm sm:text-[13px] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </label>
            <label className="block">
              <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</span>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="staff@example.com"
                autoComplete="off"
                className="w-full px-3 py-3 sm:py-2.5 rounded-md bg-[#111720] border border-gray-700 text-white text-sm sm:text-[13px] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </label>
          </div>

          <label className="block">
            <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-2">
              Password
              <button type="button" onClick={() => setPassword(randomPassword())}
                className="text-[9px] font-bold text-red-300 hover:text-red-200 normal-case tracking-normal underline">
                regenerate
              </button>
            </span>
            <input
              type="text"
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-3 py-3 sm:py-2.5 rounded-md bg-[#111720] border border-gray-700 text-white text-sm sm:text-[13px] font-mono focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
            />
            <span className="block text-[10px] text-gray-500 mt-1">
              The new staff member should change this on first sign-in via Profile.
            </span>
          </label>

          {error && (
            <div className="p-2.5 rounded-md bg-red-900/40 border border-red-700/60 text-sm sm:text-[12px] text-red-200">
              {error}
            </div>
          )}

          <button type="submit" disabled={busy}
            className="px-4 py-3 sm:py-2.5 min-h-[48px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white text-sm sm:text-[12px] font-bold uppercase tracking-widest flex items-center justify-center gap-1.5">
            <UserPlus size={13} /> {busy ? 'Creating…' : 'Create staff account'}
          </button>
        </form>

        {/* ── Last created credentials ── */}
        {lastCreated && (
          <div className="bg-emerald-900/30 border border-emerald-700/60 rounded-xl p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Check size={14} className="text-emerald-300" />
              <h3 className="text-[12px] font-bold uppercase tracking-widest text-emerald-200">Account created — share these credentials</h3>
            </div>
            <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-[12px]">
              <dt className="text-gray-400 uppercase tracking-widest text-[9px]">Email</dt>
              <dd className="text-white font-mono break-all">{lastCreated.email}</dd>
              <dt className="text-gray-400 uppercase tracking-widest text-[9px]">Password</dt>
              <dd className="text-white font-mono break-all">{lastCreated.password}</dd>
              <dt className="text-gray-400 uppercase tracking-widest text-[9px]">Name</dt>
              <dd className="text-white break-all">{lastCreated.display_name}</dd>
            </dl>
            <button type="button" onClick={copyCreds}
              className="px-3 py-2 rounded-md bg-emerald-700 hover:bg-emerald-600 text-white text-[11px] font-bold uppercase tracking-widest flex items-center gap-1.5">
              <Copy size={11} /> {copied ? 'Copied!' : 'Copy to clipboard'}
            </button>
            <p className="text-[10px] text-emerald-300/80">
              Credentials are shown once. After leaving this page they cannot be recovered — you'd have to reset the password manually.
            </p>
          </div>
        )}

        {/* ── Existing staff list ── */}
        <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-xl p-4 space-y-2">
          <h3 className="text-[12px] font-bold uppercase tracking-widest text-gray-300">Existing admins ({staffList.length})</h3>
          {staffList.length === 0 ? (
            <p className="text-[11px] text-gray-500">No admins yet.</p>
          ) : (
            <ul className="space-y-1">
              {staffList.map(s => (
                <li key={s.id} className="flex items-center gap-2 py-2 border-b border-[#1e2a3a] last:border-b-0">
                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border ${s.is_bangon_super_admin ? 'bg-red-600/15 border-red-500/40 text-red-200' : 'bg-gray-700/30 border-gray-500/40 text-gray-300'}`}>
                    {s.is_bangon_super_admin ? 'Super' : 'Staff'}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-[13px] text-white truncate">{s.display_name || '—'}</div>
                    <div className="text-[10px] text-gray-500 font-mono truncate">{s.email}</div>
                  </div>
                  {s.id === profile?.id && (
                    <span className="text-[9px] uppercase tracking-widest text-gray-500">you</span>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </>
  );
}
