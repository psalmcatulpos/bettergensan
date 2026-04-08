import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const badgeStyles: Record<string, string> = {
  Ordinance: 'bg-primary-100 text-primary-700',
  Resolution: 'bg-success-100 text-success-700',
};

const documents = [
  {
    type: 'Ordinance',
    date: 'Oct 15, 2025',
    title: 'Ordinance No. 15, Series of 2025',
    description:
      'An ordinance regulating the operation of public utility vehicles within General Santos City',
  },
  {
    type: 'Resolution',
    date: 'Oct 8, 2025',
    title: 'Resolution No. 287, Series of 2025',
    description:
      'Resolution urging the national government to fast-track the GenSan Airport expansion project',
  },
  {
    type: 'Ordinance',
    date: 'Sep 22, 2025',
    title: 'Ordinance No. 14, Series of 2025',
    description:
      'An ordinance imposing penalties for illegal dumping of solid waste in waterways and public areas',
  },
  {
    type: 'Resolution',
    date: 'Sep 10, 2025',
    title: 'Resolution No. 265, Series of 2025',
    description:
      'Resolution declaring November as Tuna Festival Month in General Santos City',
  },
];

const LegislativeTracker = () => {
  return (
    <Section className="bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <Heading level={2}>Legislative Documents</Heading>
        <Link
          to="/legislative"
          className="text-primary-600 text-sm font-medium hover:underline"
        >
          View All
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {documents.map(doc => (
          <div
            key={doc.title}
            className="bg-white border rounded-lg p-5"
          >
            <div className="flex items-center justify-between mb-3">
              <span
                className={`${badgeStyles[doc.type]} text-xs px-3 py-1 rounded-full font-medium`}
              >
                {doc.type}
              </span>
              <span className="text-sm text-gray-400">{doc.date}</span>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">{doc.title}</h3>
            <p className="text-sm text-gray-500 mb-3">{doc.description}</p>
            <a
              href="#"
              className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1"
            >
              <Download size={14} />
              View PDF
            </a>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 italic mt-4">
        Source: splis.gensantos.gov.ph
      </p>
    </Section>
  );
};

export default LegislativeTracker;
