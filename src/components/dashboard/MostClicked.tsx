import {
  Eye,
  MousePointerClick,
  TrendingUp,
} from 'lucide-react';

const items = [
  {
    rank: '#1',
    name: 'Fish Buy & Sell',
    tag: 'Trading',
    views: '1,247 views',
  },
  {
    rank: '#2',
    name: 'Rice Retailing',
    tag: 'Retail',
    views: '1,103 views',
  },
  {
    rank: '#3',
    name: 'Laundry Shop',
    tag: 'Service',
    views: '986 views',
  },
  {
    rank: '#4',
    name: 'Milk Tea Stall',
    tag: 'Food & Bev',
    views: '892 views',
  },
  {
    rank: '#5',
    name: 'Online Reselling',
    tag: 'Digital',
    views: '756 views',
  },
];

const MostClicked = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2">
          <MousePointerClick className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            Most Viewed Opportunities
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          What other GenSan residents are exploring right now
        </p>

        <div className="mt-6 space-y-3">
          {items.map(item => (
            <div
              key={item.rank}
              className="flex cursor-pointer items-center justify-between rounded-xl border bg-white p-4 transition hover:shadow-sm"
            >
              <div className="flex items-center">
                <span className="mr-4 w-8 text-2xl font-bold text-gray-200">
                  {item.rank}
                </span>
                <span className="font-medium text-gray-900">
                  {item.name}
                </span>
                <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-500">
                  {item.tag}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="h-4 w-4 text-gray-400" />
                <span className="text-sm text-gray-500">
                  {item.views}
                </span>
                <TrendingUp className="h-4 w-4 text-success-500" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MostClicked;
