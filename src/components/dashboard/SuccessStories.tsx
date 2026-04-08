import { MessageCircle, Trophy, User } from 'lucide-react';

const stories = [
  {
    color: 'bg-primary-500',
    story:
      'I started with just a small fishball cart near the school. Within 3 months, I was able to buy a second cart.',
    name: 'Juan D.',
    business: 'Fishball Stall, Lagao',
    capital: '₱4,000',
    earning: '₱800/day',
  },
  {
    color: 'bg-success-500',
    story:
      'My sari-sari store started in our garage. Now I supply 3 barangays with basic goods and e-load.',
    name: 'Maria S.',
    business: 'Sari-Sari Store, Calumpang',
    capital: '₱15,000',
    earning: '₱1,200/day',
  },
  {
    color: 'bg-accent-500',
    story:
      'I learned baking from YouTube. Started selling on Facebook, now I have a small shop near City Heights.',
    name: 'Ana R.',
    business: 'Pastry Shop, City Heights',
    capital: '₱8,000',
    earning: '₱1,500/day',
  },
];

const SuccessStories = () => {
  return (
    <section className="bg-white py-10">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="flex items-center gap-2">
          <Trophy className="h-6 w-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            How People Made Money
          </h2>
        </div>
        <p className="mt-1 text-sm text-gray-500">
          Real stories from General Santos City entrepreneurs
        </p>

        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
          {stories.map(item => (
            <div
              key={item.name}
              className="overflow-hidden rounded-xl border transition hover:shadow-md"
            >
              <div className={`h-2 ${item.color}`} />
              <div className="p-6">
                <MessageCircle className="mb-2 h-8 w-8 text-gray-200" />
                <p className="mb-4 text-sm italic text-gray-600">
                  &ldquo;{item.story}&rdquo;
                </p>
                <hr className="mb-4 border-gray-100" />
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
                    <User className="h-5 w-5 text-gray-500" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-500">
                      {item.business}
                    </p>
                  </div>
                </div>
                <div className="mt-4 flex gap-4">
                  <p className="text-sm text-gray-600">
                    Capital:{' '}
                    <span className="font-medium">
                      {item.capital}
                    </span>
                  </p>
                  <p className="text-sm">
                    Now earning:{' '}
                    <span className="font-bold text-success-600">
                      {item.earning}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SuccessStories;
