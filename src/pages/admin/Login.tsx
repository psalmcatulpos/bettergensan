import { useState, type FormEvent } from 'react';
import { Navigate, useLocation, useSearchParams } from 'react-router-dom';
import { Lock, Mail, Loader2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithPassword } from '../../lib/auth';

const Login = () => {
  const { user, isAdmin, loading } = useAuth();
  const [params] = useSearchParams();
  const location = useLocation();
  const denied = params.get('denied') === '1';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
      </div>
    );
  }

  if (user && isAdmin) {
    const from =
      (location.state as { from?: string } | null)?.from ?? '/admin';
    return <Navigate to={from} replace />;
  }

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const { error } = await signInWithPassword(email, password);
      if (error) throw error;
      // onAuthStateChange will populate the context; the redirect above fires
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign-in failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="flex items-center gap-3 mb-6">
          <img
            src="/logo.png"
            alt="BetterGensan"
            className="h-10 w-10 object-contain"
          />
          <div>
            <h1 className="text-xl font-semibold text-gray-900">
              BetterGensan Admin
            </h1>
            <p className="text-xs text-gray-500">
              Operations dashboard — admins only
            </p>
          </div>
        </div>

        {denied && user && !isAdmin && (
          <div className="mb-4 flex gap-2 p-3 rounded-md bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5" />
            <div>
              Signed in as <strong>{user.email}</strong>, but this account is
              not an admin. Ask a site admin to flip{' '}
              <code className="text-xs">profiles.is_admin</code>.
            </div>
          </div>
        )}

        <form onSubmit={onSubmit} className="space-y-3">
          <label className="block">
            <span className="text-xs font-medium text-gray-700">Email</span>
            <div className="mt-1 relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                placeholder="you@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-medium text-gray-700">Password</span>
            <div className="mt-1 relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 text-sm"
                minLength={6}
              />
            </div>
          </label>

          {error && (
            <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white rounded-md py-2 text-sm font-medium transition flex items-center justify-center gap-2"
          >
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}
            Sign in
          </button>
        </form>

        <p className="mt-6 text-xs text-gray-400 text-center">
          Admin accounts are provisioned manually. Contact the site owner for
          access.
        </p>
      </div>
    </div>
  );
};

export default Login;
