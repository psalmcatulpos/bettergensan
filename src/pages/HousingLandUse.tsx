// /services/housing-land-use — dedicated Housing & Land Use page for General
// Santos City. Same structure as the other deep service pages with:
//   1. 5-step path
//   2. 6 main programs
//   3. Loan & program reference table
//   4. Common requirements + hotlines
//   5. Responsible offices
//
// Pure information page. Every link goes to the official Pag-IBIG, DHSUD,
// NHA, SHFC, or LGU portal. BetterGensan never collects forms or payments.
//
// Sources cross-checked against:
//   RA 11201 (Department of Human Settlements and Urban Development Act, 2019)
//   RA 7279  (Urban Development and Housing Act / UDHA, 1992)
//   RA 9904  (Magna Carta for Homeowners and Homeowners Associations, 2010)
//   RA 9679  (Home Development Mutual Fund / Pag-IBIG Law, 2009)
//   PD 957   (Subdivision and Condominium Buyers Protective Decree)
//   PD 1216  (Open Spaces in Subdivisions)
//   BP 220   (Socialized housing standards)

import {
  AlertTriangle,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  HandCoins,
  HandHeart,
  Hash,
  Home,
  HousePlus,
  Key,
  Landmark,
  MapPin,
  Phone,
  PiggyBank,
  Receipt,
  ScrollText,
  ShieldCheck,
  Users,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

// ---------- 5-step path ----------

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: BadgeCheck,
    title: 'Check your eligibility',
    body: 'Most housing loans require active Pag-IBIG membership for at least 24 monthly contributions, plus proof of stable income.',
  },
  {
    number: '02',
    icon: PiggyBank,
    title: 'Ensure Pag-IBIG membership and contributions',
    body: 'Membership is mandatory for all employed Filipinos under RA 9679. Verify your MID number, update missing contributions, and confirm at least 24 monthly contributions before applying.',
  },
  {
    number: '03',
    icon: Home,
    title: 'Choose a property or construction option',
    body: 'Pag-IBIG covers house and lot purchase, condo purchase, construction on owned lot, or refinancing. For purchases, confirm the developer has a DHSUD License to Sell. For self-construction, verify the lot has clean title, tax declaration, and zoning clearance.',
  },
  {
    number: '04',
    icon: ClipboardList,
    title: 'Submit your housing loan application',
    body: 'Apply at the nearest Pag-IBIG branch or online. For socialized or community housing, apply through SHFC, NHA, or the City Housing Office.',
  },
  {
    number: '05',
    icon: Key,
    title: 'Move in and start amortization',
    body: 'Once approved, begin monthly amortization. Keep records of payments, your title, and any HOA dues if you live in a subdivision.',
  },
];

// ---------- 6 main programs ----------

interface Program {
  icon: LucideIcon;
  title: string;
  body: string;
  law: string;
  benefit: string;
  who: string;
  href: string;
  cta: string;
  agency: string;
}

const PROGRAMS: Program[] = [
  {
    icon: Home,
    title: 'Pag-IBIG Regular Housing Loan',
    body: 'Long-term home loan for the purchase of a lot, house and lot, condominium, or for construction and refinancing.',
    law: 'RA 9679 (HDMF Law, 2009)',
    benefit: 'Loan up to ₱6 million with terms of up to 30 years',
    who: 'Active Pag-IBIG members with at least 24 contributions',
    href: 'https://www.pagibigfund.gov.ph/housingloan.html',
    cta: 'Visit Pag-IBIG',
    agency: 'Pag-IBIG · HDMF',
  },
  {
    icon: HousePlus,
    title: 'Pag-IBIG Home Construction Loan',
    body: 'Pag-IBIG housing loan used to build a new house on a lot the borrower already owns. Common option for members who already have land but need financing to construct.',
    law: 'RA 9679 (HDMF Law, 2009)',
    benefit: 'Loan up to ₱6 million for self-construction on owned lot',
    who: 'Active Pag-IBIG members who own a residential lot with clean title',
    href: 'https://www.pagibigfund.gov.ph/housingloan.html',
    cta: 'Visit Pag-IBIG',
    agency: 'Pag-IBIG · HDMF',
  },
  {
    icon: HandCoins,
    title: 'Pag-IBIG Affordable Housing',
    body: 'Lower-interest housing loans for minimum-wage and low-income Pag-IBIG members. The interest rate is subsidized, not the housing itself — borrowers still amortize the principal at a reduced monthly rate.',
    law: 'RA 9679 + Pag-IBIG Affordable Housing Program',
    benefit: 'Subsidized rate as low as 3% per annum (income-based)',
    who: 'Pag-IBIG members earning within the program income cap',
    href: 'https://www.pagibigfund.gov.ph/affordablehousing.html',
    cta: 'Visit Pag-IBIG AHP',
    agency: 'Pag-IBIG · HDMF',
  },
  {
    icon: Users,
    title: 'Community Mortgage Program (CMP)',
    body: 'SHFC program that lets organized informal settler families collectively buy the land they occupy through a community association.',
    law: 'RA 7835 (Comprehensive Shelter Financing Act, 1994)',
    benefit: 'Low-interest mortgage for community-owned land',
    who: 'Organized informal settler families through an accredited CA',
    href: 'https://shfcph.com/community-mortgage-program/',
    cta: 'Visit SHFC',
    agency: 'SHFC',
  },
  {
    icon: HousePlus,
    title: 'NHA Resettlement & Socialized Housing',
    body: 'Government relocation and socialized housing programs run by the National Housing Authority — covering resettlement of families displaced by infrastructure projects, disaster relocation from danger zones, and socialized housing for qualified low-income families.',
    law: 'RA 7279 (UDHA, 1992) and NHA Charter',
    benefit: 'Free or subsidized resettlement housing in NHA sites',
    who: 'Qualified displaced families per UDHA criteria',
    href: 'https://nha.gov.ph/',
    cta: 'Visit NHA',
    agency: 'NHA',
  },
  {
    icon: Landmark,
    title: 'City Housing & Land Management',
    body: 'Local LGU office handling informal settler assistance, relocation cases, land tenure concerns, and coordination with national housing programs (Pag-IBIG, SHFC, NHA, DHSUD) for General Santos City residents.',
    law: 'RA 7160 (Local Government Code) + GenSan ordinances',
    benefit: 'LGU-level intake for housing concerns and relocation cases',
    who: 'General Santos City residents',
    href: 'https://gensantos.gov.ph/city-housing-land-management-office/',
    cta: 'Visit City Housing Office',
    agency: 'GenSan LGU',
  },
  {
    icon: ShieldCheck,
    title: "HOA Registration & Buyer's Rights",
    body: 'DHSUD handles homeowners association registration, License to Sell verification, and complaints against developers under PD 957.',
    law: 'RA 9904 (HOA Magna Carta) and PD 957',
    benefit: 'Legal recognition of HOAs and buyer protection',
    who: 'Subdivision homeowners, condo unit owners, and HOA officers',
    href: 'https://dhsud.gov.ph/',
    cta: 'Visit DHSUD',
    agency: 'DHSUD',
  },
];

// ---------- Programs at a glance ----------

interface ProgramRef {
  name: string;
  agency: string;
  cap: string;
  rate: string;
}

const REFERENCE: ProgramRef[] = [
  {
    name: 'Pag-IBIG Regular Housing Loan',
    agency: 'Pag-IBIG / HDMF',
    cap: 'Up to ₱6,000,000',
    rate: 'Repricing every 1, 3, 5, or 10 years',
  },
  {
    name: 'Pag-IBIG Affordable Housing Program',
    agency: 'Pag-IBIG / HDMF',
    cap: 'Up to ₱750,000 (typical)',
    rate: 'As low as 3% per annum (subsidized)',
  },
  {
    name: 'Community Mortgage Program',
    agency: 'SHFC',
    cap: 'Per community appraisal',
    rate: '6% per annum (25-year term)',
  },
  {
    name: 'NHA Resettlement',
    agency: 'NHA',
    cap: 'Per project unit cost',
    rate: 'Subsidized or free for qualified beneficiaries',
  },
  {
    name: 'Building Permit (for self-build)',
    agency: 'OBO · GenSan',
    cap: 'Based on floor area, per PD 1096',
    rate: 'One-time fee at filing',
  },
  {
    name: 'Locational / Zoning Clearance',
    agency: 'CPDO · GenSan',
    cap: 'Based on project area & cost',
    rate: 'One-time fee, valid for one project',
  },
];

// ---------- Common requirements ----------

const REQUIREMENTS = [
  'Two valid government-issued IDs',
  'Pag-IBIG MID number and proof of contributions',
  'Latest payslips or income tax return (ITR)',
  'Certificate of employment (for employed) or DTI / SEC papers (self-employed)',
  'Property documents: title, tax declaration, vicinity map',
  'For socialized housing: certificate of indigency from CSWDO',
];

// ---------- Hotlines ----------

interface Hotline {
  icon: LucideIcon;
  label: string;
  number: string;
  body: string;
}

const HOTLINES: Hotline[] = [
  {
    icon: PiggyBank,
    label: 'Pag-IBIG Hotline',
    number: '8724-4244',
    body: 'Pag-IBIG Fund / HDMF central inquiries and loan support.',
  },
  {
    icon: Building2,
    label: 'DHSUD',
    number: '8351-7866',
    body: 'Department of Human Settlements and Urban Development.',
  },
  {
    icon: Home,
    label: 'NHA Hotline',
    number: '8929-9100',
    body: 'National Housing Authority resettlement and housing inquiries.',
  },
  {
    icon: Users,
    label: 'SHFC',
    number: '8779-8780',
    body: 'Social Housing Finance Corporation, CMP and HDH programs.',
  },
  {
    icon: ScrollText,
    label: 'City Housing GenSan',
    number: '083-552-3939',
    body: 'City Housing & Land Management Office (via City Hall trunkline).',
  },
  {
    icon: Receipt,
    label: 'BIR Hotline',
    number: '8538-3200',
    body: 'For property transfer and capital gains tax inquiries.',
  },
];

// ---------- Responsible offices ----------

interface Office {
  icon: LucideIcon;
  name: string;
  scope: string;
  href: string;
  domain: string;
}

const OFFICES: Office[] = [
  {
    icon: PiggyBank,
    name: 'Pag-IBIG Fund (HDMF)',
    scope: 'Mandatory savings, housing loans, and short-term loans for all Filipino workers.',
    href: 'https://www.pagibigfund.gov.ph/',
    domain: 'pagibigfund.gov.ph',
  },
  {
    icon: Building2,
    name: 'Department of Human Settlements and Urban Development',
    scope: 'National housing policy, License to Sell, HOA registration, and buyer protection.',
    href: 'https://dhsud.gov.ph/',
    domain: 'dhsud.gov.ph',
  },
  {
    icon: Home,
    name: 'National Housing Authority',
    scope: 'Government resettlement housing, calamity housing, and disaster relocation.',
    href: 'https://nha.gov.ph/',
    domain: 'nha.gov.ph',
  },
  {
    icon: Users,
    name: 'Social Housing Finance Corporation',
    scope: 'Community Mortgage Program and other socialized housing finance.',
    href: 'https://shfcph.com/',
    domain: 'shfcph.com',
  },
  {
    icon: Landmark,
    name: 'City Housing & Land Management Office',
    scope: 'Local housing assistance, relocation, and coordination with national housing programs.',
    href: 'https://gensantos.gov.ph/city-housing-land-management-office/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: MapPin,
    name: 'City Planning & Development Office',
    scope: 'Zoning, locational clearances, and the city Comprehensive Land Use Plan.',
    href: 'https://gsqms.infoadvance.com.ph/city-planning-and-development-office',
    domain: 'gsqms.infoadvance.com.ph',
  },
  {
    icon: Wallet,
    name: 'Home Guaranty Corporation',
    scope: 'Government-backed credit guarantees for housing finance and developer projects.',
    href: 'https://hgc.gov.ph/',
    domain: 'hgc.gov.ph',
  },
];

const HousingLandUse: React.FC = () => {
  return (
    <>
      <SEO
        title="Housing & Land Use — GenSan"
        description="Complete guide to housing and land use programs in General Santos City. Pag-IBIG housing loans, DHSUD, NHA resettlement, SHFC Community Mortgage Program, City Housing Office, and the responsible national agencies."
        keywords="gensan housing, pag-ibig housing loan, dhsud, nha resettlement, shfc cmp, city housing gensan, ra 11201, ra 9679, udha"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Housing & Land Use' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Home className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Homes & Communities
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Housing & Land Use
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Pag-IBIG housing loans, government resettlement, community
                mortgage programs, homeowners association registration, and
                local housing assistance. Every link goes to the official
                Pag-IBIG, DHSUD, NHA, SHFC, or LGU portal.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://www.pagibigfund.gov.ph/housingloan.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <PiggyBank className="h-3.5 w-3.5" />
                  Apply at Pag-IBIG
                </a>
                <a
                  href="https://gensantos.gov.ph/city-housing-land-management-office/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit City Housing Office
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 5-step path ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Hash}
          eyebrow="From application to keys"
          title="How to access housing in 5 steps"
          helper="The standard path most General Santos City families follow when applying for a Pag-IBIG or government housing program."
        />

        <ol className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {STEPS.map(step => (
            <li
              key={step.number}
              className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                  <step.icon className="h-5 w-5" />
                </div>
                <span className="text-2xl font-bold leading-none text-primary-100">
                  {step.number}
                </span>
              </div>
              <h3 className="text-sm font-semibold leading-snug text-gray-900">
                {step.title}
              </h3>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </PageSection>

      {/* ---------- 6 main programs ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={HandHeart}
          eyebrow="Most requested"
          title="Main housing programs"
          helper="Six core housing and land use programs available to General Santos City residents."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PROGRAMS.map(p => (
            <article
              key={p.title}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                  <p.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700">
                  {p.agency}
                </span>
              </div>

              <h3 className="text-base font-semibold leading-snug text-gray-900">
                {p.title}
              </h3>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-700">
                {p.law}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {p.body}
              </p>

              <dl className="mt-4 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                <div>
                  <dt className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                    What you get
                  </dt>
                  <dd className="text-[11px] font-medium text-gray-900">
                    {p.benefit}
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                    Who qualifies
                  </dt>
                  <dd className="text-[11px] font-medium text-gray-900">
                    {p.who}
                  </dd>
                </div>
              </dl>

              <a
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
              >
                {p.cta}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </PageSection>

      {/* ---------- Programs at a glance ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={ClipboardList}
          eyebrow="At a glance"
          title="Loans & programs reference"
          helper="The major housing finance and clearance programs available through Pag-IBIG, SHFC, NHA, and the LGU. Caps and rates can change with each fiscal year."
        />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Agency</th>
                <th className="px-4 py-3">Loan / Fee</th>
                <th className="px-4 py-3">Rate / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {REFERENCE.map(r => (
                <tr key={r.name} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {r.name}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-primary-700">
                    {r.agency}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{r.cap}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">{r.rate}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-gray-500">
          Loan caps, interest rates, and program income ceilings can change
          through new Pag-IBIG circulars or DHSUD orders. Always confirm
          current numbers with the responsible agency before signing
          anything.
        </p>
      </PageSection>

      {/* ---------- Common requirements + Hotlines ---------- */}
      <PageSection background="gray" tier="secondary">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              tier="secondary"
              icon={ClipboardList}
              eyebrow="Bring these"
              title="Common requirements"
              helper="Documents most Pag-IBIG and government housing applications ask for."
            />
            <ul className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]">
              {REQUIREMENTS.map(r => (
                <li
                  key={r}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                  <span>{r}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading
              tier="secondary"
              icon={Phone}
              eyebrow="Quick help"
              title="Housing hotlines"
              helper="Direct lines for Pag-IBIG, DHSUD, NHA, SHFC, and the City Housing Office."
            />
            <div className="grid grid-cols-1 gap-2">
              {HOTLINES.map(h => (
                <div
                  key={h.label}
                  className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm shadow-gray-900/[0.04]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white ring-1 ring-primary-700">
                    <h.icon className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex flex-wrap items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-900">
                        {h.label}
                      </span>
                      <a
                        href={`tel:${h.number.replace(/\D/g, '')}`}
                        className="text-sm font-bold text-primary-700 hover:text-primary-800"
                      >
                        {h.number}
                      </a>
                    </div>
                    <p className="text-[11px] leading-snug text-gray-600">
                      {h.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </PageSection>

      {/* ---------- Responsible offices ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Building2}
          eyebrow="Where to go"
          title="Responsible Offices"
          helper="Government offices and official portals that handle housing and land use for General Santos City."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {OFFICES.map(office => (
            <a
              key={office.name}
              href={office.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <office.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                    {office.name}
                  </h4>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-primary-700" />
                </div>
                <p className="mt-1 text-xs leading-relaxed text-gray-600">
                  {office.scope}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-primary-700">
                  {office.domain}
                </p>
              </div>
            </a>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong>Verify the developer.</strong> Before signing a
              reservation or down payment, confirm the project has a valid
              DHSUD License to Sell. Buyer protection under PD 957 only
              applies to licensed projects.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Watch out for fixers.</strong> Pag-IBIG, DHSUD, and
              NHA applications are free to file. Never pay anyone offering
              to guarantee approval or fast-track a housing slot.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default HousingLandUse;
