import { Landmark, Fish, PartyPopper, Building2 } from 'lucide-react';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const timelineEntries = [
  {
    year: '1939',
    text: 'General Santos was established as a municipality carved from the municipality of Buayan, named after General Paulino Santos.',
  },
  {
    year: '1968',
    text: 'General Santos was converted into a city by virtue of Republic Act No. 5412, signed by President Ferdinand Marcos.',
  },
  {
    year: '1988',
    text: 'The city was classified as a Highly Urbanized City (HUC), becoming independent from the province of South Cotabato.',
  },
  {
    year: '2000s',
    text: 'Rapid growth as the economic center of SOCCSKSARGEN region, with the tuna industry driving development.',
  },
  {
    year: '2020s',
    text: 'With a population of 697,315, General Santos City continues to grow as a major hub in Mindanao.',
  },
];

const highlights = [
  {
    icon: Fish,
    title: 'Tuna Capital',
    description:
      'General Santos City is recognized as the Tuna Capital of the Philippines, home to the country\'s largest tuna processing and canning industry.',
    color: 'bg-accent-100 text-accent-600',
  },
  {
    icon: PartyPopper,
    title: 'Tuna Festival',
    description:
      'The annual Tuna Festival celebrates the city\'s fishing industry with street dancing, trade fairs, and the famous tuna eating contest.',
    color: 'bg-primary-100 text-primary-600',
  },
  {
    icon: Building2,
    title: 'Key LGU Projects',
    description:
      'Major infrastructure developments include the Fish Port Complex, GenSan Drive, and ongoing projects to modernize city services.',
    color: 'bg-accent-100 text-accent-600',
  },
];

const CityHistory = () => {
  return (
    <Section className="bg-gray-50">
      <div className="flex items-center gap-3 mb-8">
        <Landmark className="w-6 h-6 text-primary-600" />
        <Heading level={2}>Brief History of General Santos</Heading>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* Timeline */}
        <div className="relative pl-6">
          <div className="absolute left-0 top-0 bottom-0 border-l-2 border-gray-300" />
          <div className="flex flex-col gap-8">
            {timelineEntries.map(({ year, text }) => (
              <div key={year} className="relative">
                <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-primary-600 border-2 border-white" />
                <span className="inline-block rounded-full bg-primary-600 text-white text-xs px-3 py-1 font-bold mb-2">
                  {year}
                </span>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {text}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Highlight Cards */}
        <div className="flex flex-col gap-4">
          {highlights.map(({ icon: Icon, title, description, color }) => (
            <div
              key={title}
              className="border rounded-lg p-5 flex gap-4 items-start"
            >
              <div className={`${color} p-3 rounded-full shrink-0`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-1">{title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Section>
  );
};

export default CityHistory;
