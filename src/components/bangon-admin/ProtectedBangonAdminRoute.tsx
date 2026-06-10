// ProtectedBangonAdminRoute — guard for /bangon-gensan/admin.
//
// No session → redirect to /bangon-gensan/login.
// Has session but not a Bangon admin → redirect to login with ?denied=1.

import { Navigate, Outlet } from 'react-router-dom';
import { useBangonAuth } from '../../contexts/BangonAuthContext';

export default function ProtectedBangonAdminRoute() {
  const { user, isBangonAdmin, loading } = useBangonAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0e14] flex items-center justify-center">
        <div className="text-gray-500 text-xs font-bold uppercase tracking-widest">Loading…</div>
      </div>
    );
  }
  if (!user) return <Navigate to="/bangon-gensan/login" replace />;
  if (!isBangonAdmin) return <Navigate to="/bangon-gensan/login?denied=1" replace />;
  return <Outlet />;
}
