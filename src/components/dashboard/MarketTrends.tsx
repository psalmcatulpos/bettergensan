import { BarChart3, TrendingUp, TrendingDown } from 'lucide-react';

const trends = [
  {
    business: 'Milk Tea',
    demand: 'Very High',
    area: 'City Heights, Lagao',
    trend: 'up',
    change: '+18%',
  },
  {
    business: 'Fried Chicken',
    demand: 'High',
    area: 'Dadiangas, Calumpang',
    trend: 'up',
    change: '+12%',
  },
  {
    business: 'Rice Retail',
    demand: 'Steady',
    area: 'City-wide',
    trend: 'up',
    change: '+8%',
  },
  {
    business: 'Ukay-Ukay',
    demand: 'Medium',
    area: 'Public Market area',
    trend: 'down',
    change: '-5%',
  },
  {
    business: 'Street BBQ',
    demand: 'High',
    area: 'Lagao, Tambler',
    trend: 'up',
    change: '+22%',
  },
  {
    business: 'Laundry Shop',
    demand: 'Growing',
    area: 'Near schools',
    trend: 'up',
    change: '+15%',
  },
];

const MarketTrends = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Local Market Trends
          </h2>
        </div>
        <p className="text-sm text-gray-500 mb-6">
          What&apos;s growing, what&apos;s slowing in General Santos
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {trends.map(t => (
            <div
              key={t.business}
              className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition cursor-pointer"
            >
              <h3 className="font-semibold text-gray-900 mb-2">
                {t.business}
              </h3>
              <div className="flex items-center gap-1 mb-2">
                {t.trend === 'up' ? (
                  <TrendingUp className="h-4 w-4 text-success-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-error-600" />
                )}
                <span
                  className={`text-sm font-bold ${
                    t.trend === 'up'
                      ? 'text-success-600'
                      : 'text-error-600'
                  }`}
                >
                  {t.change}
                </span>
              </div>
              <p className="text-xs text-gray-500">
                Demand: {t.demand}
              </p>
              <p className="text-xs text-gray-400">{t.area}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 text-center">
          <a
            href="/market-trends"
            className="inline-flex items-center gap-2 rounded-full bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition hover:bg-primary-700"
          >
            View Market Trends →
          </a>
        </div>
      </div>
    </section>
  );
};

export default MarketTrends;
