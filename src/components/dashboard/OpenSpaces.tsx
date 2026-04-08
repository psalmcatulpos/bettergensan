import { Map, Footprints, Users, Banknote } from 'lucide-react';

const locations = [
  {
    name: 'Near KCC Mall',
    footfall: 'High Foot Traffic',
    footfallColor: 'text-success-600',
    competition: 'Low Competition',
    competitionColor: 'text-success-600',
    rent: '₱5k–₱10k/mo rent',
  },
  {
    name: 'Near Schools (Lagao)',
    footfall: 'High Foot Traffic',
    footfallColor: 'text-success-600',
    competition: 'Medium Competition',
    competitionColor: 'text-accent-600',
    rent: '₱3k–₱6k/mo rent',
  },
  {
    name: 'Near Bulaong Terminal',
    footfall: 'Very High Foot Traffic',
    footfallColor: 'text-success-600',
    competition: 'Medium Competition',
    competitionColor: 'text-accent-600',
    rent: '₱4k–₱8k/mo rent',
  },
  {
    name: 'Near Public Market',
    footfall: 'Very High Foot Traffic',
    footfallColor: 'text-success-600',
    competition: 'High Competition',
    competitionColor: 'text-error-600',
    rent: '₱8k–₱15k/mo rent',
  },
];

const OpenSpaces = () => {
  return (
    <section className="bg-white py-10">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2">
          <Map className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold">Open Spaces for Business</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Available spots with high potential in General Santos City
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-6">
          {locations.map((loc) => (
            <div
              key={loc.name}
              className="border rounded-xl p-5 hover:shadow-md hover:border-primary-300 transition cursor-pointer"
            >
              <h3 className="font-semibold text-gray-900 mb-3">{loc.name}</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center">
                  <Footprints className="w-4 h-4 text-gray-400 mr-2" />
                  <span className={loc.footfallColor}>{loc.footfall}</span>
                </div>
                <div className="flex items-center">
                  <Users className="w-4 h-4 text-gray-400 mr-2" />
                  <span className={loc.competitionColor}>
                    {loc.competition}
                  </span>
                </div>
                <div className="flex items-center">
                  <Banknote className="w-4 h-4 text-gray-400 mr-2" />
                  <span className="text-gray-600">{loc.rent}</span>
                </div>
              </div>
              <a
                href="#"
                className="text-primary-600 text-sm font-medium mt-3 inline-block"
              >
                View Details
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default OpenSpaces;
