import {
  Heart,
  Shield,
  Coins,
  Bus,
  GraduationCap,
  Users,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const categories = [
  {
    icon: Heart,
    label: 'Health',
    description: 'Clinics, hospitals, programs',
    color: 'bg-error-100 text-error-600',
    href: '/services/health-services',
  },
  {
    icon: Shield,
    label: 'Safety',
    description: 'Emergency, crime, hazards',
    color: 'bg-accent-100 text-accent-600',
    href: '/services/disaster-preparedness',
  },
  {
    icon: Coins,
    label: 'Local Prices',
    description: 'Prices, rent, daily expenses',
    color: 'bg-success-100 text-success-600',
    href: '/services',
  },
  {
    icon: Bus,
    label: 'Transport',
    description: 'Routes, fares, terminals',
    color: 'bg-primary-100 text-primary-600',
    href: '/services/infrastructure-public-works',
  },
  {
    icon: GraduationCap,
    label: 'Education',
    description: 'Schools, scholarships, training',
    color: 'bg-secondary-100 text-secondary-600',
    href: '/services/education',
  },
  {
    icon: Users,
    label: 'Community',
    description: 'Events, barangays, orgs',
    color: 'bg-gray-100 text-gray-600',
    href: '/services/social-welfare',
  },
];

const LifeInGensan = () => {
  return (
    <section className="bg-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        <h2 className="text-2xl font-bold text-gray-900 mb-1">
          Life in GenSan
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          Essential information for living in General Santos City
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map(cat => (
            <Link
              key={cat.label}
              to={cat.href}
              className="border border-gray-200 rounded-xl p-4 text-center hover:shadow-md hover:border-primary-300 transition group"
            >
              <div
                className={`w-12 h-12 mx-auto mb-3 rounded-xl flex items-center justify-center ${cat.color} group-hover:scale-110 transition-transform`}
              >
                <cat.icon className="h-6 w-6" />
              </div>
              <h3 className="font-medium text-sm text-gray-900">
                {cat.label}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {cat.description}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default LifeInGensan;
