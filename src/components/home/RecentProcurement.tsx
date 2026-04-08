import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const statusStyles: Record<string, string> = {
  Open: 'bg-success-100 text-success-700',
  Closed: 'bg-gray-100 text-gray-600',
  Awarded: 'bg-primary-100 text-primary-700',
};

const procurements = [
  {
    ref: 'RFQ-2025-0847',
    title: 'Supply of Office Equipment and Furniture',
    department: 'City Admin',
    amount: '₱485,000.00',
    deadline: 'Dec 15, 2025',
    status: 'Open',
  },
  {
    ref: 'ITB-2025-0312',
    title: 'Road Rehabilitation — Brgy. Dadiangas South',
    department: 'Engineering',
    amount: '₱12,500,000.00',
    deadline: 'Dec 10, 2025',
    status: 'Open',
  },
  {
    ref: 'RFQ-2025-0846',
    title: 'Procurement of Medical Supplies for CHO',
    department: 'Health',
    amount: '₱1,200,000.00',
    deadline: 'Nov 30, 2025',
    status: 'Closed',
  },
  {
    ref: 'ITB-2025-0311',
    title: 'Fish Port Complex Drainage Improvement',
    department: 'Engineering',
    amount: '₱8,750,000.00',
    deadline: 'Nov 25, 2025',
    status: 'Awarded',
  },
  {
    ref: 'RFQ-2025-0845',
    title: 'Catering Services for City Events',
    department: 'General Services',
    amount: '₱320,000.00',
    deadline: 'Nov 20, 2025',
    status: 'Awarded',
  },
];

const RecentProcurement = () => {
  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <Heading level={2}>Recent Procurement Notices</Heading>
        <div className="flex items-center gap-4">
          <Link
            to="/procurement"
            className="text-primary-600 text-sm font-medium hover:underline"
          >
            View All
          </Link>
          <a
            href="https://procurement.gensantos.gov.ph"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 text-sm font-medium hover:underline flex items-center gap-1"
          >
            procurement.gensantos.gov.ph
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Ref No
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Title
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Department
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                ABC Amount
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Deadline
              </th>
              <th className="text-left px-4 py-3 font-semibold text-gray-600">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {procurements.map(item => (
              <tr key={item.ref} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-gray-700">
                  {item.ref}
                </td>
                <td className="px-4 py-3 text-gray-900">{item.title}</td>
                <td className="px-4 py-3 text-gray-500">{item.department}</td>
                <td className="px-4 py-3 text-gray-900 font-medium">
                  {item.amount}
                </td>
                <td className="px-4 py-3 text-gray-500">{item.deadline}</td>
                <td className="px-4 py-3">
                  <span
                    className={`${statusStyles[item.status]} rounded-full px-3 py-1 text-xs font-medium`}
                  >
                    {item.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-xs text-gray-400 italic mt-4">
        Source: procurement.gensantos.gov.ph
      </p>
    </Section>
  );
};

export default RecentProcurement;
