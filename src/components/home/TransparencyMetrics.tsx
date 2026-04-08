import { TrendingUp, FileText, Scale, ShieldCheck } from 'lucide-react';
import Section from '../ui/Section';
import { Heading } from '../ui/Heading';

const metrics = [
  {
    icon: TrendingUp,
    iconColor: 'text-primary-600',
    value: '₱2.1B',
    label: 'Total Procurement (2025)',
  },
  {
    icon: FileText,
    iconColor: 'text-accent-600',
    value: '847',
    label: 'Executive Orders Issued',
  },
  {
    icon: Scale,
    iconColor: 'text-gray-600',
    value: '312',
    label: 'Ordinances & Resolutions',
  },
  {
    icon: ShieldCheck,
    iconColor: 'text-success-600',
    value: '98.2%',
    label: 'Transparency Compliance',
  },
];

const TransparencyMetrics = () => {
  return (
    <Section className="bg-gray-50">
      <div className="flex items-center justify-between mb-8">
        <Heading level={2}>Transparency Dashboard</Heading>
        <span className="text-sm text-gray-400">
          Last updated: November 2025
        </span>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {metrics.map(({ icon: Icon, iconColor, value, label }) => (
          <div
            key={label}
            className="bg-white border rounded-xl p-6 shadow-sm"
          >
            <Icon className={`${iconColor} mb-3`} size={28} />
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            <p className="text-sm text-gray-500 mt-1">{label}</p>
          </div>
        ))}
      </div>
    </Section>
  );
};

export default TransparencyMetrics;
