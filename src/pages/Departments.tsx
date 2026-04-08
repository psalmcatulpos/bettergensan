// /government/departments — directory of General Santos City local government
// departments and offices. Each card is a clickable link straight to the
// responsible portal (sub-domain on gensantos.gov.ph or the LGU main site).
//
// Pure information page. BetterGensan does not host the department itself —
// every transactional flow stays at the official source.

import {
  Activity,
  AlertOctagon,
  Banknote,
  Briefcase,
  Building2,
  Calculator,
  ClipboardList,
  Crown,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Gavel,
  Heart,
  HeartHandshake,
  Landmark,
  Leaf,
  Map,
  Megaphone,
  Plane,
  ScrollText,
  ShieldAlert,
  Stethoscope,
  Tractor,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

interface Department {
  icon: LucideIcon;
  name: string;
  short?: string;
  scope: string;
  href: string;
  domain: string;
}

interface DepartmentGroup {
  title: string;
  eyebrow: string;
  helper: string;
  background: 'white' | 'gray';
  departments: Department[];
}

const GROUPS: DepartmentGroup[] = [
  // ----- Executive & Legislative -----
  {
    title: 'Executive & Legislative',
    eyebrow: 'City Hall leadership',
    helper:
      "The Mayor's office, the Vice Mayor, and the legislative body of General Santos City.",
    background: 'white',
    departments: [
      {
        icon: Crown,
        name: 'Office of the City Mayor',
        scope: "The Mayor's office, executive directives, and the citywide CSR program.",
        href: 'https://gensantos.gov.ph/city-mayors-office-2/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: Landmark,
        name: 'Office of the Vice Mayor',
        scope: 'Presides over the Sangguniang Panlungsod and supervises legislative committees.',
        href: 'https://sp.gensantos.gov.ph/vice-mayor-profile/',
        domain: 'sp.gensantos.gov.ph',
      },
      {
        icon: Gavel,
        name: 'Sangguniang Panlungsod (City Council)',
        short: 'SP',
        scope: 'Local legislative body that drafts, debates, and passes city ordinances and resolutions.',
        href: 'https://sp.gensantos.gov.ph/',
        domain: 'sp.gensantos.gov.ph',
      },
      {
        icon: ScrollText,
        name: 'SP Legislative Information System',
        short: 'SPLIS',
        scope: 'Searchable archive of city ordinances, resolutions, and legislative records.',
        href: 'https://splis.gensantos.gov.ph/',
        domain: 'splis.gensantos.gov.ph',
      },
      {
        icon: FileText,
        name: 'Executive Orders Portal',
        scope: 'Official archive of mayoral executive orders for General Santos City.',
        href: 'https://eo.gensantos.gov.ph/',
        domain: 'eo.gensantos.gov.ph',
      },
    ],
  },

  // ----- Finance & Administration -----
  {
    title: 'Finance & Administration',
    eyebrow: 'Money, records, people',
    helper:
      'Departments that handle city revenue, accounting, budgeting, procurement, HR, and internal administration.',
    background: 'gray',
    departments: [
      {
        icon: Banknote,
        name: "City Treasurer's Office",
        scope: 'Collects local taxes, fees, and charges. Manages city funds.',
        href: 'https://gensantos.gov.ph/city-treasurers-offfice/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: Calculator,
        name: "City Accountant's Office",
        scope: "Records and audits all city transactions. Maintains the LGU's books of accounts.",
        href: 'https://gensantos.gov.ph/city-accountants-office-2/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: FileSpreadsheet,
        name: 'City Assessor',
        scope: 'Real property valuation, tax declarations, and assessment records.',
        href: 'https://gensantos.gov.ph/city-assessors-office/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: ClipboardList,
        name: 'City Budget Office',
        scope: 'Prepares the annual city budget and tracks fund utilization across departments.',
        href: 'https://gensantos.gov.ph/city-budget-office/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: Briefcase,
        name: 'BAC / Procurement Office',
        short: 'BAC',
        scope: 'Bids and Awards Committee — public procurement, bidding, and contract awards.',
        href: 'https://procurement.gensantos.gov.ph/',
        domain: 'procurement.gensantos.gov.ph',
      },
      {
        icon: Users,
        name: 'Human Resource Management & Development Office',
        short: 'HRMDO',
        scope: 'City government hiring, employee records, payroll, and personnel development.',
        href: 'https://gensanhrmdo.org/home/hrmdo/',
        domain: 'gensanhrmdo.org',
      },
    ],
  },

  // ----- Health, Welfare & Civil Registry -----
  {
    title: 'Health, Welfare & Civil Registry',
    eyebrow: 'People services',
    helper:
      'Health, social welfare, and civil registration offices residents interact with most often.',
    background: 'white',
    departments: [
      {
        icon: Stethoscope,
        name: 'City Health Office',
        short: 'CHO',
        scope: 'City-wide health services, immunization, sanitation, and public health programs.',
        href: 'https://cho.gensantos.gov.ph/',
        domain: 'cho.gensantos.gov.ph',
      },
      {
        icon: Activity,
        name: 'CHO Appointments Portal',
        scope: 'Online appointment scheduling for City Health Office services.',
        href: 'https://choappointment.gensantos.gov.ph/',
        domain: 'choappointment.gensantos.gov.ph',
      },
      {
        icon: HeartHandshake,
        name: 'City Social Welfare & Development Office',
        short: 'CSWDO',
        scope: 'Assistance for seniors, PWDs, solo parents, indigent families, and 4Ps beneficiaries.',
        href: 'https://gensantos.gov.ph/city-social-welfare-develpoment-office/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: Heart,
        name: "City Veterinarian's Office",
        scope: 'Animal health, anti-rabies vaccination, livestock support, and pet registration.',
        href: 'https://gensancityvet.com/',
        domain: 'gensancityvet.com',
      },
      {
        icon: FileText,
        name: 'Local Civil Registrar',
        short: 'LCR',
        scope: 'Birth, marriage, and death registration. Late registration and corrections.',
        href: 'https://gensantos.gov.ph/local-registrar-office/',
        domain: 'gensantos.gov.ph',
      },
    ],
  },

  // ----- Infrastructure, Planning & Environment -----
  {
    title: 'Infrastructure, Planning & Environment',
    eyebrow: 'Land, roads, environment',
    helper:
      'Departments that plan, build, and protect General Santos City — from roads to drainage to natural resources.',
    background: 'gray',
    departments: [
      {
        icon: Wrench,
        name: "City Engineer's Office",
        scope: 'Public works, infrastructure projects, roads, drainage, and city maintenance.',
        href: 'https://gensantos.gov.ph/city-engineerings-office/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: Map,
        name: 'City Planning & Development Office',
        short: 'CPDO',
        scope: 'Zoning, comprehensive land use plan, and long-term development planning.',
        href: 'https://gsqms.infoadvance.com.ph/city-planning-and-development-office',
        domain: 'gsqms.infoadvance.com.ph',
      },
      {
        icon: Leaf,
        name: 'City Environment & Natural Resources',
        short: 'CENRO',
        scope: 'Environmental protection, waste management oversight, and natural resource regulation.',
        href: 'https://gensantos.gov.ph/city-environment-natural-resources-office/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: Tractor,
        name: "City Agriculturist's Office",
        scope: 'Farming, fisheries, livelihood programs, and agricultural training for residents.',
        href: 'https://gensantos.gov.ph/city-agriculturist-office/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: Building2,
        name: 'City General Services Office',
        scope: 'Property management, motor pool, supplies, and building maintenance.',
        href: 'https://gensantos.gov.ph/city-general-services-office/',
        domain: 'gensantos.gov.ph',
      },
    ],
  },

  // ----- Public Safety, Permits & Communications -----
  {
    title: 'Public Safety, Permits & Communications',
    eyebrow: 'Safety & frontline services',
    helper:
      'Public safety, business permits, tourism, and the city public information office.',
    background: 'white',
    departments: [
      {
        icon: ShieldAlert,
        name: 'Public Safety Office',
        short: 'PSO',
        scope: 'Disaster preparedness, emergency response, evacuation planning, and rescue operations.',
        href: 'https://gensantos.gov.ph/public-safety-office/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: AlertOctagon,
        name: 'Office of the Building Official',
        short: 'OBO',
        scope: 'Building, electrical, sanitary, plumbing, demolition, and occupancy permits.',
        href: 'https://docs.google.com/presentation/d/1jx7sQWDlEn0ZhO0uo8B07HZR2qMiuIAb/pub?start=true&loop=true&delayms=3000',
        domain: 'docs.google.com',
      },
      {
        icon: Briefcase,
        name: 'Business Permits & Licenses Division',
        short: 'BPLD',
        scope: 'Business permit applications, renewals, and regulatory compliance.',
        href: 'https://gensantos.gov.ph/city-mayors-office-permits-license-division/',
        domain: 'gensantos.gov.ph',
      },
      {
        icon: Plane,
        name: 'PESO General Santos',
        scope: 'Public Employment Service Office. Job referrals, fairs, and employment data.',
        href: 'http://peso.gensantos.gov.ph/',
        domain: 'peso.gensantos.gov.ph',
      },
      {
        icon: Megaphone,
        name: 'City Public Information Office',
        short: 'CPIO',
        scope: 'Official city communications, press releases, and citizen advisories.',
        href: 'https://gensantos.gov.ph/city-mayors-office-city-public-information-office/',
        domain: 'gensantos.gov.ph',
      },
    ],
  },
];

const DepartmentCard = ({ dept }: { dept: Department }) => (
  <a
    href={dept.href}
    target="_blank"
    rel="noopener noreferrer"
    className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
  >
    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
      <dept.icon className="h-5 w-5" />
    </div>
    <div className="min-w-0 flex-grow">
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-primary-700">
          {dept.name}
          {dept.short && (
            <span className="ml-1.5 text-[10px] font-medium uppercase tracking-wider text-gray-400">
              {dept.short}
            </span>
          )}
        </h4>
        <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-primary-700" />
      </div>
      <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
        {dept.scope}
      </p>
      <p className="mt-2 text-[11px] font-medium text-primary-700">
        {dept.domain}
      </p>
    </div>
  </a>
);

const Departments: React.FC = () => {
  const totalDepartments = GROUPS.reduce(
    (sum, g) => sum + g.departments.length,
    0
  );

  return (
    <>
      <SEO
        title="City Departments — GenSan"
        description="Directory of General Santos City local government departments and offices, with direct links to each official portal."
        keywords="gensan departments, city government general santos, gensantos.gov.ph, cho gensan, sangguniang panlungsod gensan"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Government', href: '/government' },
              { label: 'Departments' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Building2 className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                City Hall
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                City Departments & Offices
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Directory of {totalDepartments}+ departments and offices of
                the General Santos City local government, grouped by function.
                Every card links straight to the responsible portal.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Department groups ---------- */}
      {GROUPS.map(group => (
        <PageSection
          key={group.title}
          background={group.background}
          tier="secondary"
        >
          <SectionHeading
            tier="secondary"
            icon={Landmark}
            eyebrow={group.eyebrow}
            title={group.title}
            helper={group.helper}
          />
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {group.departments.map(dept => (
              <DepartmentCard key={dept.name} dept={dept} />
            ))}
          </div>
        </PageSection>
      ))}

      {/* ---------- Footer note ---------- */}
      <PageSection background="white" tier="utility">
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-xs text-blue-900">
          <strong>Note:</strong> Departments without their own sub-domain
          currently link to the main General Santos City website. As more
          official portals come online, BetterGensan will update these links
          automatically.
        </div>
      </PageSection>
    </>
  );
};

export default Departments;
