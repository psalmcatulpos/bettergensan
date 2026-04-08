import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Database,
  ListOrdered,
  AlertTriangle,
  Gauge,
  ShieldCheck,
  Camera,
  Settings as SettingsIcon,
} from 'lucide-react';

const navItems = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/admin/sources', label: 'Sources', icon: Database },
  { to: '/admin/runs', label: 'Runs', icon: ListOrdered },
  { to: '/admin/alerts', label: 'Alerts', icon: AlertTriangle },
  { to: '/admin/freshness', label: 'Freshness', icon: Gauge },
  { to: '/admin/data-quality', label: 'Data Quality', icon: ShieldCheck },
  { to: '/admin/snapshots', label: 'Snapshots', icon: Camera },
  { to: '/admin/settings', label: 'Settings', icon: SettingsIcon },
];

const AdminSidebar = () => {
  return (
    <aside className="w-56 shrink-0 bg-gray-900 text-gray-100 flex flex-col">
      <div className="h-16 flex items-center gap-2 px-4 border-b border-gray-800">
        <img
          src="/logo.png"
          alt="BetterGensan"
          className="h-8 w-8 object-contain"
        />
        <div>
          <div className="text-sm font-semibold">BetterGensan</div>
          <div className="text-[10px] uppercase tracking-wider text-gray-400">
            Admin
          </div>
        </div>
      </div>
      <nav className="flex-1 py-4 space-y-0.5">
        {navItems.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-2 text-sm transition ${
                isActive
                  ? 'bg-gray-800 text-white border-l-2 border-primary-500'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white border-l-2 border-transparent'
              }`
            }
          >
            <Icon className="w-4 h-4" />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-800 text-[11px] text-gray-500">
        Ops view — scraper monitoring
      </div>
    </aside>
  );
};

export default AdminSidebar;
