import {
  Wrench,
  ClipboardCheck,
  Calculator,
  Map,
  Search,
  Truck,
  Banknote,
} from 'lucide-react';

const tools = [
  {
    icon: ClipboardCheck,
    name: 'Permit Checklist',
    tag: 'Generator',
  },
  {
    icon: Calculator,
    name: 'Capital Calculator',
    tag: 'Business',
  },
  {
    icon: Map,
    name: 'Location Heatmap',
    tag: 'Analysis',
  },
  {
    icon: Search,
    name: 'Competitor Scanner',
    tag: 'Market',
  },
  {
    icon: Truck,
    name: 'Supplier Finder',
    tag: 'Directory',
  },
  {
    icon: Banknote,
    name: 'Tax Estimator',
    tag: 'Calculator',
  },
];

const MSMETools = () => {
  return (
    <section className="bg-white py-10">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2">
          <Wrench className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold text-gray-900">MSME Tools</h2>
        </div>
        <p className="text-gray-500 text-sm mt-1">
          Free tools to help you plan, start, and grow your business
        </p>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-6">
          {tools.map((tool) => (
            <div
              key={tool.name}
              className="bg-white border border-gray-200 rounded-xl p-5 text-center hover:shadow-md hover:border-primary-300 transition cursor-pointer group"
            >
              <div className="w-12 h-12 mx-auto mb-3 bg-primary-50 text-primary-600 rounded-xl flex items-center justify-center group-hover:bg-primary-100">
                <tool.icon className="w-6 h-6" />
              </div>
              <p className="font-medium text-sm text-gray-900">{tool.name}</p>
              <p className="text-xs text-gray-400 mt-1">{tool.tag}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MSMETools;
