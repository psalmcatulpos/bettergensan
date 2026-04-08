import {
  CheckCircle2,
  LayoutDashboard,
  Banknote,
  Briefcase,
  Store,
  Activity,
  Wrench,
  TrendingUp,
  Building2,
  Database,
} from 'lucide-react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', active: true },
  { icon: Banknote, label: 'Make Money' },
  { icon: Briefcase, label: 'Find Jobs' },
  { icon: Store, label: 'Start Business' },
  { icon: Activity, label: 'City Intelligence' },
  { icon: Wrench, label: 'MSME Tools' },
  { icon: TrendingUp, label: 'Market Trends' },
  { icon: Building2, label: 'Government Help' },
  { icon: Database, label: 'Data Explorer' },
];

const DashboardSidebar = () => {
  return (
    <aside className="hidden lg:block w-64 h-screen fixed left-0 top-0 bg-gray-900 text-white">
      <div className="p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6 text-primary-400" />
          <div>
            <span className="font-bold text-lg">BetterGensan</span>
            <p className="text-xs text-gray-400">Citizen Dashboard</p>
          </div>
        </div>
      </div>

      <div className="border-t border-gray-800 my-4" />

      <nav className="space-y-1 px-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition cursor-pointer ${
                item.active
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </a>
          );
        })}
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">General Santos City</p>
        <p className="text-xs text-gray-600">Community Portal v1.0</p>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
