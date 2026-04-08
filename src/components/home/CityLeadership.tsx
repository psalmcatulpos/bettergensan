import { Link } from 'react-router-dom';
import { Mail, Phone } from 'lucide-react';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const leaders = [
  {
    role: 'City Mayor',
    roleBadgeClass: 'bg-primary-600 text-white',
    name: 'Hon. [TO BE VERIFIED]',
    email: 'mayor@gensantos.gov.ph',
    phone: '(083) 552-2986',
  },
  {
    role: 'City Vice Mayor',
    roleBadgeClass: 'bg-accent-500 text-white',
    name: 'Hon. [TO BE VERIFIED]',
    email: 'vicemayor@gensantos.gov.ph',
    phone: '(083) 552-2986',
  },
];

const CityLeadership = () => {
  return (
    <Section className="bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <Heading level={2}>City Leadership</Heading>
        <Link
          to="/government/executive"
          className="text-primary-600 text-sm font-medium hover:underline"
        >
          View All Officials
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {leaders.map(({ role, roleBadgeClass, name, email, phone }) => (
          <div
            key={role}
            className="bg-white border rounded-xl p-6 text-center shadow-sm"
          >
            <span
              className={`${roleBadgeClass} rounded-full text-xs font-semibold px-4 py-1 inline-block mb-4`}
            >
              {role}
            </span>
            <h3 className="text-lg font-bold text-gray-900 mb-4">{name}</h3>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="w-4 h-4" />
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Phone className="w-4 h-4" />
                <span>{phone}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default CityLeadership;
