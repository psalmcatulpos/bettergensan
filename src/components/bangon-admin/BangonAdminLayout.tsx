// BangonAdminLayout — shell with left sidebar + outlet for the admin pages.

import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BadgeAlert, ScrollText, MessageSquare, UserCircle, LogOut, Heart } from 'lucide-react';
import { useBangonAuth } from '../../contexts/BangonAuthContext';

const NAV = [
  { to: '/bangon-gensan/admin',             label: 'Dashboard',   icon: <LayoutDashboard size={14} />, end: true },
  { to: '/bangon-gensan/admin/fundraisers', label: 'Fundraisers', icon: <BadgeAlert size={14} /> },
  { to: '/bangon-gensan/admin/audit',       label: 'Audit',       icon: <ScrollText size={14} /> },
  { to: '/bangon-gensan/admin/chat',        label: 'Chat',        icon: <MessageSquare size={14} /> },
  { to: '/bangon-gensan/admin/profile',     label: 'Profile',     icon: <UserCircle size={14} /> },
];

export default function BangonAdminLayout() {
  const { signOut, profile } = useBangonAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/bangon-gensan/login', { replace: true });
  };

  return (
    <div className="min-h-screen bg-[#0a0e14] text-gray-100 flex flex-col lg:flex-row">
      <aside className="lg:w-56 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-[#1e2a3a] bg-[#0d1117] flex lg:flex-col flex-row items-center lg:items-stretch">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#1e2a3a] lg:w-full">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-500 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-red-500" />
          </span>
          <div className="font-bold uppercase tracking-widest text-sm text-white">BangonGensan</div>
          <span className="hidden lg:inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-red-600/15 border border-red-500/40 text-red-200 text-[9px] font-bold uppercase tracking-widest ml-auto">
            <Heart size={9} />Admin
          </span>
        </div>
        <nav className="flex lg:flex-col flex-row overflow-x-auto lg:overflow-visible flex-1 lg:flex-none">
          {NAV.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex items-center gap-2 px-4 py-2.5 text-[12px] font-bold uppercase tracking-widest border-b lg:border-b border-[#1e2a3a] transition-colors whitespace-nowrap ${
                  isActive ? 'bg-red-600/20 text-white border-l-2 border-l-red-500' : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="hidden lg:block mt-auto border-t border-[#1e2a3a] px-4 py-3">
          <div className="text-[10px] text-gray-500 uppercase tracking-widest mb-1">Signed in</div>
          <div className="text-[12px] text-gray-300 truncate">{profile?.display_name || profile?.email || 'Admin'}</div>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="mt-2 w-full flex items-center justify-center gap-1 px-2 py-1.5 rounded-md bg-gray-800 hover:bg-gray-700 text-gray-200 text-[10px] font-bold uppercase tracking-widest"
          >
            <LogOut size={11} /> Sign out
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
    </div>
  );
}
