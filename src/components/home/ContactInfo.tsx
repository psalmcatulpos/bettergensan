import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, FileSearch } from 'lucide-react';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const contacts = [
  {
    icon: Phone,
    label: 'HOTLINE',
    value: '(083) 552-2986',
    detail: 'Mon-Fri 8:00 AM - 5:00 PM',
  },
  {
    icon: Mail,
    label: 'EMAIL',
    value: 'info@gensantos.gov.ph',
    detail: "We'll respond within 24 hours",
  },
  {
    icon: MapPin,
    label: 'ADDRESS',
    value: 'City Hall',
    detail: 'General Santos City, South Cotabato 9500',
  },
  {
    icon: FileSearch,
    label: 'FOI REQUEST',
    value: 'Freedom of Information',
    detail: 'Submit requests via foi.gov.ph',
    href: 'https://www.foi.gov.ph',
  },
];

const ContactInfo = () => {
  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <Heading level={2}>Contact Information</Heading>
        <Link
          to="/contact"
          className="text-primary-600 text-sm font-medium hover:underline"
        >
          View All
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {contacts.map(({ icon: Icon, label, value, detail }) => (
          <div
            key={label}
            className="flex items-start gap-4 border rounded-lg p-5"
          >
            <div className="bg-primary-100 text-primary-600 p-3 rounded-full shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-gray-400 uppercase font-semibold tracking-wide">
                {label}
              </span>
              <p className="font-semibold text-gray-900">{value}</p>
              <p className="text-sm text-gray-500">{detail}</p>
            </div>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default ContactInfo;
