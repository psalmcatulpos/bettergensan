import { TrendingUp } from 'lucide-react';

const businesses = [
  {
    name: 'Street BBQ',
    revenue: '₱2,500',
    cost: '₱1,600',
    profit: '₱900',
  },
  {
    name: 'Fishball Cart',
    revenue: '₱1,800',
    cost: '₱900',
    profit: '₱900',
  },
  {
    name: 'Banana Cue Stall',
    revenue: '₱1,200',
    cost: '₱600',
    profit: '₱600',
  },
  {
    name: 'Milk Tea Stall',
    revenue: '₱3,500',
    cost: '₱2,000',
    profit: '₱1,500',
  },
];

const HowMuchToEarn = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold">How Much Can You Earn?</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Daily earnings breakdown for popular GenSan businesses
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
          {businesses.map((biz) => (
            <div
              key={biz.name}
              className="bg-white border rounded-xl p-5 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-lg text-gray-900 mb-3">
                {biz.name}
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Revenue:</span>
                  <span className="font-bold text-gray-900">
                    {biz.revenue}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Cost:</span>
                  <span className="font-bold text-error-600">{biz.cost}</span>
                </div>
                <div className="border-t my-2" />
                <div className="flex justify-between">
                  <span className="text-gray-500">Profit:</span>
                  <span className="font-bold text-success-600 text-lg">
                    {biz.profit}
                  </span>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">per day</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowMuchToEarn;
