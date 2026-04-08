import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const updates = [
  {
    category: 'Announcement',
    badgeClass: 'bg-primary-100 text-primary-700',
    barClass: 'bg-primary-500',
    date: 'Nov 28, 2025',
    title: 'Business Permit Renewal 2026',
    description:
      'Deadline for business permit renewal is set for January 20, 2026. Early renewal is encouraged to avoid penalties.',
  },
  {
    category: 'Project',
    badgeClass: 'bg-accent-100 text-accent-700',
    barClass: 'bg-accent-500',
    date: 'Nov 15, 2025',
    title: 'Fish Port Complex Expansion',
    description:
      'The expansion of the General Santos Fish Port Complex is now open to serve more fishing vessels and traders.',
  },
  {
    category: 'Advisory',
    badgeClass: 'bg-error-100 text-error-700',
    barClass: 'bg-error-500',
    date: 'Nov 10, 2025',
    title: 'Scheduled Power Interruption',
    description:
      'Maintenance is scheduled for Barangay Dadiangas on Dec 5, 8:00 AM - 5:00 PM.',
  },
];

const LatestUpdates = () => {
  return (
    <Section>
      <div className="flex items-center justify-between mb-8">
        <Heading level={2}>Latest Updates</Heading>
        <Link
          to="/updates"
          className="text-primary-600 text-sm font-medium hover:underline inline-flex items-center gap-1"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {updates.map(
          ({ category, badgeClass, barClass, date, title, description }) => (
            <div
              key={title}
              className="border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              <div className={`${barClass} h-1`} />
              <div className="p-5">
                <div className="flex items-center gap-3 mb-3">
                  <span
                    className={`${badgeClass} text-xs font-semibold px-3 py-1 rounded-full`}
                  >
                    {category}
                  </span>
                  <span className="text-xs text-gray-400">{date}</span>
                </div>
                <h3 className="font-semibold text-lg text-gray-900 mb-2">
                  {title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2">
                  {description}
                </p>
              </div>
            </div>
          ),
        )}
      </div>
    </Section>
  );
};

export default LatestUpdates;
