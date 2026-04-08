import {
  ShieldAlert,
  AlertTriangle,
  Car,
  FileText,
  Shield,
  MapPin,
} from 'lucide-react';

const alerts = [
  {
    type: 'Flood-Prone Zone',
    description: 'Expect waterlogging during heavy rain',
    location: 'Lagao, Dadiangas South',
    borderColor: 'border-l-error-500',
    iconBg: 'bg-error-100',
    iconColor: 'text-error-600',
    Icon: AlertTriangle,
  },
  {
    type: 'Traffic Congestion',
    description: 'Peak hours 7–9 AM, 5–7 PM daily',
    location: 'National Highway, KCC area',
    borderColor: 'border-l-accent-500',
    iconBg: 'bg-accent-100',
    iconColor: 'text-accent-600',
    Icon: Car,
  },
  {
    type: 'Permit Crackdown',
    description: 'City enforcing vendor permits this month',
    location: 'Public Market area',
    borderColor: 'border-l-primary-500',
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    Icon: FileText,
  },
  {
    type: 'Low Visibility Area',
    description: 'Poor street lighting reported',
    location: 'Apopong, Brgy. San Isidro',
    borderColor: 'border-l-gray-400',
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    Icon: Shield,
  },
];

const RiskAlerts = () => {
  return (
    <section className="bg-white py-10">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-6 h-6 text-primary-600" />
              <h2 className="text-2xl font-bold">Risk Alerts</h2>
            </div>
            <p className="text-sm text-gray-500 mt-1">
              Stay informed and avoid trouble spots
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
            <span className="text-xs font-medium text-gray-500">Live</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
          {alerts.map((alert) => (
            <div
              key={alert.type}
              className={`border rounded-xl p-4 border-l-4 ${alert.borderColor}`}
            >
              <div
                className={`w-8 h-8 rounded-full ${alert.iconBg} flex items-center justify-center mb-2`}
              >
                <alert.Icon className={`w-4 h-4 ${alert.iconColor}`} />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">
                {alert.type}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{alert.description}</p>
              <div className="flex items-center gap-1 mt-2">
                <MapPin className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">{alert.location}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RiskAlerts;
