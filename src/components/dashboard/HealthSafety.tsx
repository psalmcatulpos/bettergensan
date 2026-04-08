import {
  Heart,
  Hospital,
  Bug,
  ShieldAlert,
  Droplets,
  Phone,
} from 'lucide-react';

const items = [
  {
    icon: Hospital,
    label: 'Hospitals',
    detail: '12 hospitals & clinics',
    color: 'bg-error-100 text-error-600',
  },
  {
    icon: Bug,
    label: 'Dengue Alert',
    detail: '23 cases this week',
    color: 'bg-accent-100 text-accent-600',
  },
  {
    icon: ShieldAlert,
    label: 'Crime Hotspots',
    detail: 'Apopong, San Isidro',
    color: 'bg-gray-100 text-gray-600',
  },
  {
    icon: Droplets,
    label: 'Flood Zones',
    detail: 'Lagao, Dadiangas South',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    icon: Phone,
    label: 'Emergency Numbers',
    detail: '911 / (083) 302-1174',
    color: 'bg-success-100 text-success-600',
  },
  {
    icon: Heart,
    label: 'CHO Programs',
    detail: 'Free check-ups, vaccines',
    color: 'bg-secondary-100 text-secondary-600',
  },
];

const HealthSafety = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-1">
          <Heart className="h-6 w-6 text-error-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Health & Safety
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          Stay safe and healthy in General Santos City
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {items.map(item => (
            <div
              key={item.label}
              className="bg-white border border-gray-200 rounded-xl p-4 text-center hover:shadow-md transition cursor-pointer"
            >
              <div
                className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${item.color}`}
              >
                <item.icon className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-sm text-gray-900">
                {item.label}
              </h3>
              <p className="text-xs text-gray-500 mt-1">{item.detail}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/safety"
            className="inline-flex items-center gap-2 rounded-full bg-error-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-error-700"
          >
            View Safety Map →
          </a>
        </div>
      </div>
    </section>
  );
};

export default HealthSafety;
