import { Search } from 'lucide-react';

const searches = [
  { query: 'Water refilling station', location: 'City-wide', count: '342 searches' },
  { query: 'Laundry shop', location: 'Near schools', count: '287 searches' },
  { query: 'Car wash', location: 'Lagao area', count: '198 searches' },
  { query: 'Milktea near me', location: 'Dadiangas', count: '456 searches' },
  { query: 'Ukay ukay supplier', location: 'Public Market', count: '234 searches' },
];

const PeopleSearching = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Search className="w-5 h-5 text-primary-600" />
              <h2 className="text-2xl font-bold text-gray-900">
                What People Are Looking For
              </h2>
            </div>
            <p className="text-sm text-gray-500">
              Real-time demand signals from General Santos City
            </p>
          </div>
          <span className="bg-primary-100 text-primary-700 text-xs rounded-full px-3 py-1">
            Updated hourly
          </span>
        </div>

        <div className="mt-6 space-y-3">
          {searches.map((item) => (
            <div
              key={item.query}
              className="bg-white rounded-xl border p-4 flex items-center justify-between hover:shadow-sm transition"
            >
              <div className="flex items-center">
                <Search className="w-4 h-4 text-gray-300 mr-3 shrink-0" />
                <span className="font-medium text-gray-900">{item.query}</span>
                <span className="text-xs text-gray-400 ml-2">
                  {item.location}
                </span>
              </div>
              <span className="text-sm text-gray-500 shrink-0 ml-4">
                {item.count}
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PeopleSearching;
