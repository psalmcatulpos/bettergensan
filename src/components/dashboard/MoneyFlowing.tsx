import { MapPin } from 'lucide-react';

const locations = [
  {
    bar: 'bg-error-500',
    name: 'Lagao',
    activity: 'High spending',
    activityColor: 'text-error-600',
    stat: '₱2.1M daily volume',
  },
  {
    bar: 'bg-success-500',
    name: 'City Heights',
    activity: 'New businesses',
    activityColor: 'text-success-600',
    stat: '8 opened this week',
  },
  {
    bar: 'bg-accent-500',
    name: 'Tambler',
    activity: 'Hiring surge',
    activityColor: 'text-accent-600',
    stat: '+23 jobs posted',
  },
  {
    bar: 'bg-primary-500',
    name: 'Calumpang',
    activity: 'Food demand',
    activityColor: 'text-primary-600',
    stat: 'Street food trending',
  },
  {
    bar: 'bg-secondary-500',
    name: 'Fatima',
    activity: 'Rental demand',
    activityColor: 'text-secondary-600',
    stat: '5 spaces inquired',
  },
];

const MoneyFlowing = () => {
  return (
    <section className="bg-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-1">
          <MapPin className="w-5 h-5 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Where Money is Flowing
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Economic activity hotspots in General Santos City
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mt-6">
          {locations.map((loc) => (
            <div
              key={loc.name}
              className="border rounded-xl p-5 hover:shadow-md transition cursor-pointer relative overflow-hidden"
            >
              <div className={`h-1 rounded ${loc.bar} mb-4`} />
              <p className="font-semibold text-lg text-gray-900">{loc.name}</p>
              <p className={`text-sm font-medium ${loc.activityColor}`}>
                {loc.activity}
              </p>
              <p className="text-xs text-gray-400 mt-2">{loc.stat}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MoneyFlowing;
