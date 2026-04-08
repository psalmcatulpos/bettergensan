import { Link } from 'react-router-dom';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const stats = [
  { value: '697,315', label: 'Population', sublabel: '2020 Census' },
  { value: '26', label: 'Barangays', sublabel: 'Administrative Units' },
  { value: '1st Class', label: 'City', sublabel: 'Highly Urbanized City' },
  {
    value: '536.33 km²',
    label: 'Land Area',
    sublabel: 'Total Municipal Area',
  },
];

const CityStats = () => {
  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <Heading level={2}>General Santos at a Glance</Heading>
        <Link
          to="/statistics"
          className="text-primary-600 text-sm font-medium hover:underline"
        >
          View Statistics
        </Link>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map(({ value, label, sublabel }) => (
          <div key={label} className="border-l-4 border-primary-500 pl-4">
            <p className="text-2xl md:text-3xl font-bold text-gray-900">
              {value}
            </p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
            <p className="text-xs text-gray-400">{sublabel}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default CityStats;
