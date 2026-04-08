import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const orders = [
  {
    eo: 'EO 45',
    title:
      'Reorganization of the City Disaster Risk Reduction and Management Council',
    date: 'Nov 1, 2025',
  },
  {
    eo: 'EO 44',
    title:
      'Designation of Additional Signatories for City Government Financial Transactions',
    date: 'Oct 20, 2025',
  },
  {
    eo: 'EO 43',
    title:
      'Creation of the Task Force on Illegal Fishing and Maritime Security',
    date: 'Oct 5, 2025',
  },
  {
    eo: 'EO 42',
    title:
      'Implementation of the Expanded City Scholarship Program for Academic Year 2025-2026',
    date: 'Sep 15, 2025',
  },
];

const ExecutiveOrders = () => {
  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <Heading level={2}>Executive Orders</Heading>
        <Link
          to="/executive-orders"
          className="text-primary-600 text-sm font-medium hover:underline"
        >
          View All
        </Link>
      </div>
      <div>
        {orders.map(order => (
          <div
            key={order.eo}
            className="flex items-center justify-between border-b py-4"
          >
            <div className="flex items-start">
              <span className="bg-accent-100 text-accent-700 text-xs font-bold px-3 py-1 rounded-full whitespace-nowrap">
                {order.eo}
              </span>
              <div className="ml-4">
                <p className="font-medium text-gray-900">{order.title}</p>
                <p className="text-sm text-gray-400 mt-1">{order.date}</p>
              </div>
            </div>
            <button className="text-gray-400 hover:text-primary-600 ml-4 shrink-0">
              <Download size={18} />
            </button>
          </div>
        ))}
      </div>
      <p className="text-xs text-gray-400 italic mt-4">
        Source: eo.gensantos.gov.ph
      </p>
    </Section>
  );
};

export default ExecutiveOrders;
