import {
  Activity,
  CloudRain,
  Zap,
  Car,
  Fish,
  TrendingUp,
  Building2,
} from 'lucide-react';

const widgets = [
  {
    icon: CloudRain,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    label: 'Flood Risk Today',
    value: 'Low',
    valueColor: 'text-success-600',
    status: 'No advisories',
  },
  {
    icon: Zap,
    iconBg: 'bg-accent-100',
    iconColor: 'text-accent-600',
    label: 'Power Interruptions',
    value: '2',
    valueColor: 'text-accent-600',
    status: 'Scheduled today',
  },
  {
    icon: Car,
    iconBg: 'bg-error-100',
    iconColor: 'text-error-600',
    label: 'Traffic Alert',
    value: 'Heavy',
    valueColor: 'text-error-600',
    status: 'Lagao area',
  },
  {
    icon: Fish,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    label: 'Fish Port Price',
    value: '₱210/kg',
    valueColor: 'text-gray-900',
    status: 'Yellowfin Tuna',
  },
  {
    icon: TrendingUp,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    label: 'Market Trend',
    value: 'Fried Chicken',
    valueColor: 'text-sm font-bold text-gray-900',
    status: 'Booming demand',
  },
  {
    icon: Building2,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    label: 'New Businesses',
    value: '12',
    valueColor: 'text-gray-900',
    status: 'Registered today',
  },
];

const CityIntelligence = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Activity className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                Live City Intelligence
              </h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              What&apos;s happening in General Santos right now
            </p>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-success-500 animate-pulse" />
            <span className="text-xs text-success-600 font-medium">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {widgets.map((widget) => (
            <div
              key={widget.label}
              className="bg-white rounded-xl border border-gray-200 p-4 text-center"
            >
              <div
                className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${widget.iconBg}`}
              >
                <widget.icon className={`w-5 h-5 ${widget.iconColor}`} />
              </div>
              <p className="text-xs text-gray-500 mb-1">{widget.label}</p>
              <p className={`font-bold text-lg ${widget.valueColor}`}>
                {widget.value}
              </p>
              <p className="text-xs text-gray-400">{widget.status}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CityIntelligence;
