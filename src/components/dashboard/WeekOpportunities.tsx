import { Calendar } from 'lucide-react';

const opportunities = [
  {
    trigger: 'School Opening',
    demand: 'Uniform & supplies demand',
    prepare:
      'Stock school supplies, bags, and uniforms near schools',
    timing: 'This Monday',
  },
  {
    trigger: 'Barangay Fiesta',
    demand: 'Food stall demand',
    prepare:
      'Prepare extra street food, BBQ, and refreshments inventory',
    timing: 'Wednesday–Friday',
  },
  {
    trigger: 'Payday Week',
    demand: 'Retail spike',
    prepare:
      'Load up on grocery items, snacks, and personal care products',
    timing: '15th & 30th',
  },
  {
    trigger: 'Weekend Market',
    demand: 'Vendor opportunities',
    prepare:
      'Reserve spots at weekend tiangge near malls and terminals',
    timing: 'Saturday–Sunday',
  },
];

const WeekOpportunities = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2">
          <Calendar className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            This Week&apos;s Opportunities
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Upcoming demand spikes you can prepare for
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {opportunities.map(item => (
            <div
              key={item.trigger}
              className="rounded-xl border bg-white p-5 transition hover:shadow-md"
            >
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-primary-600">
                {item.trigger}
              </p>
              <p className="font-semibold text-gray-900">
                {item.demand}
              </p>
              <p className="mt-2 text-sm text-gray-500">
                {item.prepare}
              </p>
              <span className="mt-3 inline-block rounded-full bg-accent-100 px-3 py-1 text-xs text-accent-700">
                {item.timing}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WeekOpportunities;
