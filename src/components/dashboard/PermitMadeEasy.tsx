import { ClipboardCheck, Clock } from 'lucide-react';

const permits = [
  {
    name: 'Start a Sari-Sari Store',
    steps: [
      'Get Barangay Clearance (₱50–₱100)',
      'Apply for Mayor\'s Permit at BPLO (₱500–₱1,000)',
      'Register with BIR (optional for small)',
    ],
    time: '1–2 days',
  },
  {
    name: 'Open a Food Stall',
    steps: [
      'Barangay Clearance',
      'Health/Sanitary Permit from CHO',
      'Mayor\'s Permit at City Hall',
      'Fire Safety Certificate',
    ],
    time: '3–5 days',
  },
  {
    name: 'Start Online Selling',
    steps: [
      'Register business name with DTI (₱200)',
      'Get Barangay Clearance',
      'Register with BIR for receipts',
    ],
    time: '1–2 days',
  },
];

const PermitMadeEasy = () => {
  return (
    <section className="bg-white py-10">
      <div className="container max-w-7xl mx-auto px-4">
        <div className="flex items-center gap-2">
          <ClipboardCheck className="w-6 h-6 text-primary-600" />
          <h2 className="text-2xl font-bold">Permit Made Easy</h2>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          Step-by-step guides to start your business legally
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {permits.map((permit) => (
            <div
              key={permit.name}
              className="border rounded-xl p-6 hover:shadow-md transition"
            >
              <h3 className="font-semibold text-lg text-gray-900 mb-4">
                {permit.name}
              </h3>
              <div className="space-y-3">
                {permit.steps.map((step, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <span className="w-7 h-7 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center shrink-0">
                      {i + 1}
                    </span>
                    <span className="text-sm text-gray-700">{step}</span>
                  </div>
                ))}
              </div>
              <div className="border-t mt-4 pt-4">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-gray-400" />
                  <span className="text-sm text-gray-500">
                    Estimated Time:
                  </span>
                  <span className="font-medium text-gray-900">
                    {permit.time}
                  </span>
                </div>
                <a
                  href="#"
                  className="text-primary-600 text-sm font-medium mt-2 inline-block"
                >
                  View Full Guide
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PermitMadeEasy;
