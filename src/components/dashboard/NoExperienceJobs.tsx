import {
  UserPlus,
  HardHat,
  Coffee,
  Monitor,
  Bike,
  ShoppingBag,
  Headphones,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Job {
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  title: string;
  salary: string;
}

const jobs: Job[] = [
  {
    icon: HardHat,
    iconBg: 'bg-accent-100',
    iconColor: 'text-accent-600',
    title: 'Helper',
    salary: '₱400–₱450/day',
  },
  {
    icon: Coffee,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    title: 'Service Crew',
    salary: '₱410/day',
  },
  {
    icon: Monitor,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    title: 'Encoder',
    salary: '₱12,000/mo',
  },
  {
    icon: Bike,
    iconBg: 'bg-secondary-100',
    iconColor: 'text-secondary-600',
    title: 'Delivery Rider',
    salary: '₱500–₱800/day',
  },
  {
    icon: ShoppingBag,
    iconBg: 'bg-error-100',
    iconColor: 'text-error-600',
    title: 'Store Assistant',
    salary: '₱380–₱420/day',
  },
  {
    icon: Headphones,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    title: 'Call Center Trainee',
    salary: '₱18,000/mo',
  },
];

const NoExperienceJobs = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2 mb-1">
          <UserPlus className="w-5 h-5 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">
            No Experience Needed
          </h2>
        </div>
        <p className="text-sm text-gray-500">
          Start working today — no degree or experience required
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {jobs.map((job) => (
            <div
              key={job.title}
              className="bg-white border rounded-xl p-4 text-center hover:shadow-md hover:border-primary-300 transition cursor-pointer"
            >
              <div
                className={`w-10 h-10 mx-auto mb-2 rounded-full flex items-center justify-center ${job.iconBg}`}
              >
                <job.icon className={`w-5 h-5 ${job.iconColor}`} />
              </div>
              <p className="font-medium text-sm text-gray-900">
                {job.title}
              </p>
              <p className="text-xs text-gray-500 mt-1">{job.salary}</p>
              <span className="inline-block mt-2 bg-success-100 text-success-700 text-xs rounded-full px-2 py-0.5">
                Hiring
              </span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default NoExperienceJobs;
