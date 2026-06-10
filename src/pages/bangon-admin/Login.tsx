// /bangon-gensan/login — BangonGensan admin sign-in.

import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { ShieldAlert, LogIn, ArrowLeft } from 'lucide-react';
import { useBangonAuth } from '../../contexts/BangonAuthContext';

export default function BangonAdminLogin() {
  const { signIn, user, isBangonAdmin, loading } = useBangonAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const denied = params.get('denied') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && user && isBangonAdmin) {
      navigate('/bangon-gensan/admin', { replace: true });
    }
  }, [loading, user, isBangonAdmin, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true); setError(null);
    const res = await signIn(email.trim(), password);
    setBusy(false);
    if (res.error) { setError(res.error); return; }
    // Onsuccess effect handles the redirect once isBangonAdmin reflects.
  };

  return (
    <>
      <Helmet>
        <title>Admin Sign-in — BangonGensan</title>
      </Helmet>
      <main className="min-h-screen bg-[#0a0e14] text-gray-100 flex items-center justify-center p-4">
        <div className="w-full max-w-sm">
          <Link to="/bangon-gensan" className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-gray-500 hover:text-gray-300 mb-4">
            <ArrowLeft size={12} /> BangonGensan
          </Link>
          <div className="bg-[#0d1117] border border-[#1e2a3a] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-[#1e2a3a] flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
              </span>
              <h1 className="text-white font-bold uppercase tracking-widest text-sm">BangonGensan Admin</h1>
            </div>

            {denied && (
              <div className="mx-5 mt-4 p-2.5 rounded-md bg-amber-900/30 border border-amber-700/40 text-[11px] text-amber-200 flex items-start gap-1.5">
                <ShieldAlert size={13} className="mt-0.5" />
                <span>Your account is not a BangonGensan admin. Ask an existing admin to grant access.</span>
              </div>
            )}

            <form onSubmit={onSubmit} className="px-5 py-4 space-y-3">
              <label className="block">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Email</span>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  autoComplete="email" autoFocus
                  className="w-full px-3 py-2.5 rounded-md bg-[#111720] border border-gray-700 text-white text-sm placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
              </label>
              <label className="block">
                <span className="block text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Password</span>
                <input type="password" required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                  className="w-full px-3 py-2.5 rounded-md bg-[#111720] border border-gray-700 text-white text-sm placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
              </label>
              {error && (
                <div className="p-2 rounded-md bg-red-900/40 border border-red-700/60 text-[11px] text-red-200">
                  {error}
                </div>
              )}
              <button type="submit" disabled={busy}
                className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white text-[12px] font-bold uppercase tracking-widest">
                {busy ? 'Signing in…' : (<><LogIn size={14} /> Sign in</>)}
              </button>
            </form>

            <div className="px-5 py-3 border-t border-[#1e2a3a] text-[10px] text-gray-500">
              Admin access is invite-only. No public sign-up.
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
