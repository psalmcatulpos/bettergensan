import { useState } from 'react';
import {
  Search,
  Banknote,
  Briefcase,
  Store,
  AlertTriangle,
  Wrench,
  Building2,
} from 'lucide-react';

const quickActions = [
  { icon: Banknote, label: 'Make Money' },
  { icon: Briefcase, label: 'Find Job' },
  { icon: Store, label: 'Start Business' },
  { icon: AlertTriangle, label: 'City Alerts' },
  { icon: Wrench, label: 'MSME Tools' },
  { icon: Building2, label: 'Government Help' },
];

const DashboardHero = () => {
  const [query, setQuery] = useState('');

  return (
    <section className="bg-gradient-to-r from-primary-700 to-primary-800 py-10 md:py-16">
      <div className="max-w-4xl mx-auto text-center px-4">
        <p className="text-sm text-white/70 mb-2 tracking-wide">
          General Santos City &mdash; Citizen Dashboard
        </p>
        <h1 className="text-3xl md:text-4xl font-bold mb-6 text-white">
          What do you want to do today?
        </h1>

        <div className="relative w-full max-w-2xl mx-auto">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Start a business, find a job, sell products, check flooding..."
            className="w-full bg-white rounded-xl px-6 py-4 text-lg text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-white/50"
          />
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg p-2.5 transition"
            aria-label="Search"
          >
            <Search className="w-5 h-5" />
          </button>
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {quickActions.map(({ icon: Icon, label }) => (
            <button
              key={label}
              className="flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium bg-white/10 text-white border border-white/20 hover:bg-white/20 transition"
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardHero;
