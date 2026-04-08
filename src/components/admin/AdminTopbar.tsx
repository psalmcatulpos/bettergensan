import { useEffect, useState } from 'react';
import { LogOut, Home } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { signOut } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

function timeAgo(iso: string | null) {
  if (!iso) return '—';
  const diff = Date.now() - new Date(iso).getTime();
  const s = Math.floor(diff / 1000);
  if (s < 60) return `${s}s ago`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

const AdminTopbar = () => {
  const { user } = useAuth();
  const [lastSync, setLastSync] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await supabase
        .from('scrape_runs')
        .select('started_at')
        .eq('status', 'success')
        .order('started_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      if (!cancelled) setLastSync(data?.started_at ?? null);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <header className="h-16 shrink-0 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div className="text-xs text-gray-500">
        Last successful sync:{' '}
        <span className="font-medium text-gray-800">{timeAgo(lastSync)}</span>
      </div>
      <div className="flex items-center gap-4">
        <Link
          to="/"
          className="text-xs text-gray-500 hover:text-gray-800 inline-flex items-center gap-1"
        >
          <Home className="w-3.5 h-3.5" />
          Public site
        </Link>
        <div className="text-xs text-gray-600">{user?.email ?? ''}</div>
        <button
          onClick={() => signOut()}
          className="text-xs text-gray-600 hover:text-red-600 inline-flex items-center gap-1"
        >
          <LogOut className="w-3.5 h-3.5" />
          Sign out
        </button>
      </div>
    </header>
  );
};

export default AdminTopbar;
