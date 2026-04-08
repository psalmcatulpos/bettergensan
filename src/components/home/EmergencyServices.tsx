import {
  AlertTriangle,
  ExternalLink,
  Siren,
  CloudRain,
  Waves,
  Building,
  Fuel,
  Truck,
} from 'lucide-react';

const emergencies = [
  {
    icon: Siren,
    title: 'Emergency SOS',
    description: 'Report & request aid instantly',
  },
  {
    icon: CloudRain,
    title: 'Weather Monitor',
    description: 'Advisories, tracking & alerts',
  },
  {
    icon: Waves,
    title: 'Flood Monitoring',
    description: 'Real-time levels & hazard maps',
  },
  {
    icon: Building,
    title: 'Evacuation Centers',
    description: 'Active centers & capacity status',
  },
  {
    icon: Fuel,
    title: 'Fuel Watch',
    description: 'Local gas prices & station locator',
  },
  {
    icon: Truck,
    title: 'Emergency Vehicles',
    description: 'Police, fire, medics & response',
  },
];

const EmergencyServices = () => {
  return (
    <div className="bg-white py-12">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-6">
          <span className="flex items-center gap-2 text-error-600 font-semibold text-sm uppercase">
            <AlertTriangle className="w-4 h-4" />
            Emergency Services
          </span>
          <a
            href="https://onegensan.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-primary-600 text-sm font-medium hover:underline"
          >
            OneGensan.gov
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {emergencies.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="border border-gray-200 rounded-lg p-4 flex flex-row items-start gap-3"
            >
              <div className="inline-flex items-center justify-center w-9 h-9 rounded-full bg-error-100 text-error-600 shrink-0">
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">{title}</h3>
                <p className="text-sm text-gray-500">{description}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default EmergencyServices;
