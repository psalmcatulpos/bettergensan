import { Coins } from 'lucide-react';

const tiers = [
  {
    border: 'border-success-300',
    bg: 'bg-success-50/30',
    capital: '₱1,000',
    name: 'Banana Cue Stall',
    description: 'Cook and sell banana cue near schools or terminals',
    earnings: '₱300–₱500/day',
    time: '1 day setup',
  },
  {
    border: 'border-accent-300',
    bg: 'bg-accent-50/30',
    capital: '₱3,000',
    name: 'Fishball Cart',
    description: 'Classic street food cart in high-traffic areas',
    earnings: '₱500–₱800/day',
    time: '2–3 days setup',
  },
  {
    border: 'border-primary-300',
    bg: 'bg-primary-50/30',
    capital: '₱5,000',
    name: 'Load Retailing',
    description:
      'Sell e-load and WiFi vouchers from home or a small stall',
    earnings: '₱200–₱400/day',
    time: 'Same day start',
  },
];

const LowCapitalStarters = () => {
  return (
    <section className="bg-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-1">
          <Coins className="w-5 h-5 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Low Capital Starters
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Start earning with what you have right now
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`border-2 ${tier.border} ${tier.bg} rounded-2xl p-6 text-center hover:shadow-lg transition`}
            >
              <p className="text-3xl font-bold text-primary-600">
                {tier.capital}
              </p>
              <hr className="my-4 border-gray-200" />
              <p className="font-semibold text-lg text-gray-900">
                {tier.name}
              </p>
              <p className="text-sm text-gray-500 mt-1">
                {tier.description}
              </p>
              <div className="flex justify-center gap-6 mt-4 text-xs text-gray-500">
                <div>
                  <span className="block font-medium text-gray-700">
                    Daily Earnings
                  </span>
                  {tier.earnings}
                </div>
                <div>
                  <span className="block font-medium text-gray-700">
                    Time to Start
                  </span>
                  {tier.time}
                </div>
              </div>
              <button className="mt-4 text-primary-600 font-medium text-sm hover:underline">
                Learn How
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LowCapitalStarters;
