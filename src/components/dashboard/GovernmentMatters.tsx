import {
  Building2,
  FileText,
  GraduationCap,
  Wrench,
  Banknote,
  MapPin,
} from 'lucide-react';

const items = [
  {
    icon: FileText,
    iconBg: 'bg-error-100',
    iconColor: 'text-error-600',
    title: 'Business Permit Renewal: January 20 Deadline',
    description:
      'All businesses must renew before Jan 20 or face penalties. Apply at City Hall BPLO.',
    badge: 'Deadline',
    badgeBg: 'bg-error-100',
    badgeColor: 'text-error-700',
    date: 'Dec 2025',
  },
  {
    icon: GraduationCap,
    iconBg: 'bg-success-100',
    iconColor: 'text-success-600',
    title: 'City Scholarship Program: Applications Open',
    description:
      'College and vocational scholarships for GenSan residents. Submit requirements at CSWDO.',
    badge: 'Open Now',
    badgeBg: 'bg-success-100',
    badgeColor: 'text-success-700',
    date: 'Nov 2025',
  },
  {
    icon: Wrench,
    iconBg: 'bg-accent-100',
    iconColor: 'text-accent-600',
    title: 'TESDA Training: Welding NC II Available',
    description:
      'Free welding training at TESDA GenSan. Includes tools and assessment fee. Walk-in accepted.',
    badge: 'Training',
    badgeBg: 'bg-accent-100',
    badgeColor: 'text-accent-700',
    date: 'Nov 2025',
  },
  {
    icon: Banknote,
    iconBg: 'bg-primary-100',
    iconColor: 'text-primary-600',
    title: 'Senior Citizen Cash Assistance Payout',
    description:
      '₱3,000 cash assistance for registered senior citizens. Claim at your barangay hall.',
    badge: 'Assistance',
    badgeBg: 'bg-primary-100',
    badgeColor: 'text-primary-700',
    date: 'Dec 2025',
  },
  {
    icon: MapPin,
    iconBg: 'bg-gray-100',
    iconColor: 'text-gray-600',
    title: 'Public Market Relocation Update',
    description:
      'Temporary stalls at Dadiangas East while main market undergoes renovation. Target completion: March 2026.',
    badge: 'Update',
    badgeBg: 'bg-gray-100',
    badgeColor: 'text-gray-700',
    date: 'Nov 2025',
  },
];

const GovernmentMatters = () => {
  return (
    <section className="bg-gray-50 py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2">
          <Building2 className="w-6 h-6" />
          <h2 className="text-2xl font-bold">Government That Matters</h2>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Government updates translated into what you actually need to know
        </p>

        <div className="mt-6 space-y-3">
          {items.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="bg-white rounded-xl border p-4 flex items-start gap-4 hover:shadow-sm transition"
              >
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${item.iconBg}`}
                >
                  <Icon className={`w-5 h-5 ${item.iconColor}`} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium text-gray-900">{item.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    {item.description}
                  </p>
                  <div className="flex items-center gap-3 mt-2">
                    <span
                      className={`text-xs rounded-full px-3 py-0.5 ${item.badgeBg} ${item.badgeColor}`}
                    >
                      {item.badge}
                    </span>
                    <span className="text-xs text-gray-400">{item.date}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default GovernmentMatters;
