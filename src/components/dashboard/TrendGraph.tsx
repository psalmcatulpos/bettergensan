import {
  BarChart3,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

const trends = [
  {
    name: 'Milk Tea',
    change: '+18%',
    up: true,
    barColor: 'bg-success-400',
  },
  {
    name: 'Fried Chicken',
    change: '+12%',
    up: true,
    barColor: 'bg-success-400',
  },
  {
    name: 'Ukay-Ukay',
    change: '-5%',
    up: false,
    barColor: 'bg-error-400',
  },
  {
    name: 'Rice Retail',
    change: '+8%',
    up: true,
    barColor: 'bg-success-300',
  },
  {
    name: 'Street BBQ',
    change: '+22%',
    up: true,
    barColor: 'bg-success-500',
  },
  {
    name: 'Vape Shop',
    change: '-3%',
    up: false,
    barColor: 'bg-error-300',
  },
];

const TrendGraph = () => {
  return (
    <section className="bg-white py-10">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Trend Watch
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Business demand trends in General Santos this month
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
          {trends.map(item => (
            <div
              key={item.name}
              className="rounded-xl border p-4 text-center transition hover:shadow-sm"
            >
              <p className="mb-2 text-sm font-medium text-gray-900">
                {item.name}
              </p>
              <div className="flex items-center justify-center gap-1">
                {item.up ? (
                  <TrendingUp className="h-4 w-4 text-success-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-error-600" />
                )}
                <span
                  className={`text-sm font-semibold ${
                    item.up
                      ? 'text-success-600'
                      : 'text-error-600'
                  }`}
                >
                  {item.change}
                </span>
              </div>
              <div
                className={`mx-auto mt-3 h-1 w-full rounded ${item.barColor}`}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TrendGraph;
