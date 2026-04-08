import { Flame } from 'lucide-react';

const opportunities = [
  {
    name: 'Milk Tea',
    demand: 'Very High',
    demandColor: 'text-success-600 font-medium',
    competition: 'High',
    competitionColor: 'text-error-600',
    capital: '₱15k–₱30k',
  },
  {
    name: 'Fried Chicken',
    demand: 'High',
    demandColor: 'text-success-600',
    competition: 'Medium',
    competitionColor: 'text-accent-600',
    capital: '₱10k–₱25k',
  },
  {
    name: 'Ukay-Ukay',
    demand: 'High',
    demandColor: 'text-success-600',
    competition: 'Medium',
    competitionColor: 'text-accent-600',
    capital: '₱8k–₱20k',
  },
  {
    name: 'Vape Shop',
    demand: 'Medium',
    demandColor: 'text-accent-600',
    competition: 'Low',
    competitionColor: 'text-success-600',
    capital: '₱20k–₱50k',
  },
  {
    name: 'Rice Retail',
    demand: 'Very High',
    demandColor: 'text-success-600 font-medium',
    competition: 'High',
    competitionColor: 'text-error-600',
    capital: '₱15k–₱40k',
  },
  {
    name: 'Street BBQ',
    demand: 'High',
    demandColor: 'text-success-600',
    competition: 'Medium',
    competitionColor: 'text-accent-600',
    capital: '₱5k–₱12k',
  },
];

const HotOpportunities = () => {
  return (
    <section className="bg-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Flame className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Hot Opportunities</h2>
            </div>
            <p className="text-gray-500 text-sm mt-1">
              Trending businesses in General Santos City right now
            </p>
          </div>
          <a
            href="#"
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            View Market Trends
          </a>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {opportunities.map((item) => (
            <div
              key={item.name}
              className="bg-white border rounded-xl p-4 hover:shadow-md hover:border-primary-300 transition cursor-pointer relative"
            >
              <span className="absolute top-3 right-3 text-xs">🔥</span>
              <h3 className="font-semibold text-gray-900 mb-2">{item.name}</h3>
              <div className="text-xs space-y-1.5">
                <p className="text-gray-500">
                  Demand:{' '}
                  <span className={item.demandColor}>{item.demand}</span>
                </p>
                <p className="text-gray-500">
                  Competition:{' '}
                  <span className={item.competitionColor}>
                    {item.competition}
                  </span>
                </p>
                <p className="text-gray-500">Capital: {item.capital}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HotOpportunities;
