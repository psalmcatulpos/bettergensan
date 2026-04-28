// /services/infrastructure-public-works — dedicated Infrastructure & Public
// Works page for General Santos City. Goes deeper than the registry-driven
// category pages with:
//   1. 5-step access path
//   2. 6 core services (building permit, occupancy, water, electric,
//      report road/drainage, locational clearance)
//   3. Permits & connections reference (fees, timeline, where to file)
//   4. Common requirements + utility hotlines
//   5. Responsible offices
//
// Pure information page. Every link goes to the official LGU, GSCWD,
// SOCOTECO II, or national agency portal. BetterGensan never collects
// forms or payments.
//
// Sources cross-checked against:
//   PD 1096  (National Building Code of the Philippines, 1977)
//   RA 9514  (Fire Code of the Philippines, 2008)
//   PD 198   (Provincial Water Utilities Act, 1973)
//   RA 9136  (EPIRA, electric industry reform, 2001)
//   RA 11201 (DHSUD Act, 2019)
//   RA 7160  (Local Government Code, 1991)

import {
  AlertOctagon,
  AlertTriangle,
  Bolt,
  Building2,
  CheckCircle2,
  ClipboardList,
  Droplets,
  ExternalLink,
  Flame,
  HardHat,
  Hash,
  Home,
  MapPin,
  MapPinned,
  Phone,
  ShieldCheck,
  Stamp,
  Wrench,
  Zap,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';
import useReveal from '../hooks/useReveal';

// ---------- 5-step access path ----------

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Identify what you need',
    body: 'A building permit, an occupancy permit, a utility connection, a damage report, or a zoning clearance. Each goes to a different city office.',
  },
  {
    number: '02',
    icon: MapPinned,
    title: 'Get a locational / zoning clearance (CPDO)',
    body: 'Most projects start at the City Planning & Development Office (CPDO) for a locational clearance. "Locational clearance" and "zoning clearance" refer to the same document — it confirms your project complies with the city zoning ordinance.',
  },
  {
    number: '03',
    icon: Stamp,
    title: 'File your permit application',
    body: 'Building, electrical, sanitary, and plumbing permits are filed at the Office of the Building Official (OBO). Plans must be signed by a licensed engineer or architect.',
  },
  {
    number: '04',
    icon: HardHat,
    title: 'Pass required inspections',
    body: 'Multiple inspections may be required: structural inspection by OBO during construction, fire safety inspection by BFP, and sanitation inspection by CHO when applicable. Each issuing office has its own clearance.',
  },
  {
    number: '05',
    icon: CheckCircle2,
    title: 'Receive permit or occupancy',
    body: 'Once cleared, claim your building permit, occupancy permit, or service connection. Keep all receipts and permits on file for renewals and inspections.',
  },
];

// ---------- 6 main services ----------

interface Service {
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

const SERVICES: Service[] = [
  {
    icon: Building2,
    title: 'Building Permit',
    body: 'Required before any new construction, renovation, addition, or major repair of a structure within General Santos City. Issued by the Office of the Building Official.',
    law: 'PD 1096 (National Building Code)',
    benefit: 'Legal authority to construct or renovate, including utility hookups',
    who: 'Anyone planning to build, renovate, or demolish a structure',
    href: 'https://gensantos.gov.ph/',
    cta: 'Apply at OBO',
    agency: 'OBO · GenSan',
  },
  {
    icon: Home,
    title: 'Occupancy Permit',
    body: 'Issued after final inspection certifying that a finished structure complies with the approved plans and the Building Code. Required before a structure can be legally occupied.',
    law: 'PD 1096 (National Building Code)',
    benefit: 'Legal authority to occupy and connect to utilities',
    who: 'Owners of newly built or renovated structures',
    href: 'https://gensantos.gov.ph/',
    cta: 'Apply at OBO',
    agency: 'OBO · GenSan',
  },
  {
    icon: Droplets,
    title: 'Water Service Connection',
    body: 'Meter installation and service connection by the General Santos City Water District after you complete the application requirements. Customers are responsible for the internal plumbing from the meter inward; GSCWD installs and maintains the meter and the service line up to the property boundary.',
    law: 'PD 198 (Provincial Water Utilities Act)',
    benefit: 'Potable water connection and metered service',
    who: 'Property owners and tenants in GSCWD service areas',
    href: 'https://www.gscwd.gov.ph/',
    cta: 'Visit GSCWD',
    agency: 'GSCWD',
  },
  {
    icon: Zap,
    title: 'Electric Service Connection',
    body: 'Service connection after inspection and meter installation by SOCOTECO II, the South Cotabato 2 Electric Cooperative. Customers must arrange their own house wiring through a licensed electrician; SOCOTECO II installs the meter and connects the service drop after the wiring passes inspection. Billing and outage reports are also handled here.',
    law: 'RA 9136 (EPIRA, 2001)',
    benefit: 'Metered electric service for residential, commercial, or industrial use',
    who: 'Property owners and tenants in the SOCOTECO II franchise area',
    href: 'https://www.socoteco2.com.ph/',
    cta: 'Visit SOCOTECO II',
    agency: 'SOCOTECO II',
  },
  {
    icon: AlertTriangle,
    title: 'Report Road or Drainage Issue',
    body: 'Report potholes, sinkholes, damaged road surfaces, clogged or broken drainage, flooded streets, and canal maintenance to the City Engineer\'s Office.',
    law: 'RA 7160 (Local Government Code)',
    benefit: 'Free repair and maintenance of city infrastructure',
    who: 'Any GenSan resident',
    href: 'https://gensantos.gov.ph/',
    cta: 'Report to City Engineer',
    agency: 'CEO · GenSan',
  },
  {
    icon: MapPinned,
    title: 'Locational / Zoning Clearance',
    body: 'Confirms that a proposed land use complies with the city\'s Comprehensive Land Use Plan (CLUP) and zoning ordinance. Required before applying for a building permit.',
    law: 'RA 7279 + Local Zoning Ordinance',
    benefit: 'Confirmation that your project is allowed at the proposed location',
    who: 'Anyone planning a building project or land conversion',
    href: 'https://gensantos.gov.ph/',
    cta: 'Apply at CPDO',
    agency: 'CPDO · GenSan',
  },
  {
    icon: HardHat,
    title: 'Demolition Permit',
    body: 'Required before removing or demolishing an existing structure. Issued by the Office of the Building Official to ensure safety, proper waste disposal, and compliance with the National Building Code.',
    law: 'PD 1096 (National Building Code)',
    benefit: 'Legal authority to demolish a structure with safety oversight',
    who: 'Property owners planning to remove an existing building or structure',
    href: 'https://gensantos.gov.ph/',
    cta: 'Apply at OBO',
    agency: 'OBO · GenSan',
  },
];

// ---------- Permits & connections reference ----------

interface PermitRow {
  name: string;
  office: string;
  fee: string;
  timeline: string;
}

const PERMITS: PermitRow[] = [
  {
    name: 'Locational Clearance',
    office: 'CPDO',
    fee: 'Based on project area & cost',
    timeline: '3 to 7 working days',
  },
  {
    name: 'Building Permit',
    office: 'OBO',
    fee: 'Based on floor area & use, per PD 1096',
    timeline: '7 to 15 working days',
  },
  {
    name: 'Electrical Permit',
    office: 'OBO',
    fee: 'Based on connected load',
    timeline: 'Filed alongside building permit',
  },
  {
    name: 'Sanitary / Plumbing Permit',
    office: 'OBO + CHO',
    fee: 'Based on fixtures & area',
    timeline: 'Filed alongside building permit',
  },
  {
    name: 'Fire Safety Inspection Certificate',
    office: 'BFP',
    fee: '₱300 to ₱1,000+ depending on use',
    timeline: '3 to 5 working days',
  },
  {
    name: 'Occupancy Permit',
    office: 'OBO',
    fee: 'Based on floor area, per PD 1096',
    timeline: '5 to 10 working days after final inspection',
  },
  {
    name: 'Water Connection (GSCWD)',
    office: 'GSCWD',
    fee: 'Connection fee + meter deposit',
    timeline: '3 to 10 working days',
  },
  {
    name: 'Electric Connection (SOCOTECO II)',
    office: 'SOCOTECO II',
    fee: 'Membership + meter & service drop',
    timeline: '7 to 15 working days',
  },
];

// ---------- Common requirements ----------

const REQUIREMENTS = [
  'Two valid government-issued IDs',
  'Land title or lease contract for the project site',
  'Latest tax declaration and real property tax receipt',
  'Locational / zoning clearance (from CPDO)',
  'Bill of materials and plans signed by a licensed architect or engineer',
  'Fire safety evaluation clearance (from BFP)',
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
    icon: Phone,
    label: 'Emergency (Nationwide)',
    number: '911',
    body: 'Police, fire, and medical emergencies. 24/7 dispatch.',
  },
  {
    icon: Droplets,
    label: 'GSCWD Customer Service',
    number: '083-552-3825',
    body: 'Water leaks, billing, and connection inquiries.',
  },
  {
    icon: Bolt,
    label: 'SOCOTECO II Outage',
    number: '083-552-2125',
    body: 'Power outages, service interruptions, billing.',
  },
  {
    icon: Flame,
    label: 'BFP General Santos',
    number: '160',
    body: 'Bureau of Fire Protection. Fire emergencies and inspections.',
  },
  {
    icon: AlertOctagon,
    label: 'CDRRMO GenSan',
    number: '111',
    body: 'City Disaster Risk Reduction and Management Office.',
  },
  {
    icon: HardHat,
    label: 'DPWH District Office',
    number: '083-553-2120',
    body: 'National roads, bridges, and DPWH-managed infrastructure.',
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
    icon: HardHat,
    name: "City Engineer's Office (CEO)",
    scope: 'Public works, road and drainage maintenance, infrastructure projects, and city facility upkeep.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Stamp,
    name: 'Office of the Building Official (OBO)',
    scope: 'Building, electrical, sanitary, plumbing, demolition, and occupancy permits.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: MapPin,
    name: 'City Planning & Development Office (CPDO)',
    scope: 'Zoning, locational clearances, Comprehensive Land Use Plan, and city development planning.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Droplets,
    name: 'General Santos City Water District',
    scope: 'Water supply, billing, new connections, and service complaints.',
    href: 'https://www.gscwd.gov.ph/',
    domain: 'gscwd.gov.ph',
  },
  {
    icon: Zap,
    name: 'SOCOTECO II Electric Cooperative',
    scope: 'Electric distribution, billing, new connections, and outage management.',
    href: 'https://www.socoteco2.com.ph/',
    domain: 'socoteco2.com.ph',
  },
  {
    icon: HardHat,
    name: 'DPWH Region XII',
    scope: 'National roads, bridges, flood control, and major infrastructure for SOCCSKSARGEN.',
    href: 'https://www.dpwh.gov.ph/',
    domain: 'dpwh.gov.ph',
  },
  {
    icon: Flame,
    name: 'Bureau of Fire Protection',
    scope: 'Fire suppression, fire safety inspection, and Fire Safety Inspection Certificate issuance.',
    href: 'https://bfp.gov.ph/',
    domain: 'bfp.gov.ph',
  },
  {
    icon: Building2,
    name: 'DHSUD',
    scope: 'Department of Human Settlements and Urban Development. Housing, land use, and subdivision regulation.',
    href: 'https://dhsud.gov.ph/',
    domain: 'dhsud.gov.ph',
  },
];

const Infrastructure: React.FC = () => {
  const heroRef = useReveal();
  const stepsHeadRef = useReveal();
  const stepsGridRef = useReveal<HTMLOListElement>();
  const servicesHeadRef = useReveal();
  const servicesGridRef = useReveal();
  const permitsHeadRef = useReveal();
  const permitsGridRef = useReveal();
  const reqHeadRef = useReveal();
  const officesHeadRef = useReveal();
  const officesGridRef = useReveal();

  return (
    <>
      <SEO
        path="/services/infrastructure-public-works"
        title="Infrastructure & Public Works — GenSan"
        description="Complete guide to infrastructure services in General Santos City. Building permits, occupancy permits, water and electric connections, road and drainage reports, locational clearances, and the responsible city offices."
        keywords="gensan building permit, occupancy permit gensan, gscwd water connection, socoteco ii electric, city engineer gensan, cpdo zoning, dpwh region 12, obo gensan"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div ref={heroRef} className="reveal mx-auto max-w-[1100px] px-4" style={{ animation: 'fade-up var(--dur-slow) var(--ease-out-quart) both' } as React.CSSProperties}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Infrastructure & Public Works' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <HardHat className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Roads, Drainage, Utilities
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Infrastructure & Public Works
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                How to apply for building and occupancy permits, connect to
                water and electric service, report damaged roads or
                drainage, and reach the right city office for any public
                works concern in General Santos City.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://gensantos.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <Stamp className="h-3.5 w-3.5" />
                  Apply at OBO
                </a>
                <a
                  href="https://www.gscwd.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit GSCWD
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- 5-step path ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={stepsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Hash}
          eyebrow="From plan to occupancy"
          title="How to get a permit or report an issue"
          helper="The standard path most General Santos City projects follow."
        />
        </div>

        <ol ref={stepsGridRef} className="reveal grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-5" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {STEPS.map(step => (
            <li
              key={step.number}
              className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
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

      {/* ---------- 6 main services ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={servicesHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Wrench}
          eyebrow="Most requested"
          title="Main infrastructure services"
          helper="Six core infrastructure services for residents and businesses in General Santos City."
        />
        </div>

        <div ref={servicesGridRef} className="reveal grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {SERVICES.map(s => (
            <article
              key={s.title}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                  <s.icon className="h-5 w-5" />
                </div>
                <span className="rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-primary-700">
                  {s.agency}
                </span>
              </div>

              <h3 className="text-base font-semibold leading-snug text-gray-900">
                {s.title}
              </h3>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-700">
                {s.law}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {s.body}
              </p>

              <dl className="mt-4 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
                <div>
                  <dt className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                    What you get
                  </dt>
                  <dd className="text-[11px] font-medium text-gray-900">
                    {s.benefit}
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                    Who qualifies
                  </dt>
                  <dd className="text-[11px] font-medium text-gray-900">
                    {s.who}
                  </dd>
                </div>
              </dl>

              <a
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
              >
                {s.cta}
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </article>
          ))}
        </div>
      </PageSection>

      {/* ---------- Permits & connections reference ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={permitsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={ClipboardList}
          eyebrow="At a glance"
          title="Permits & connections reference"
          helper="The eight permits and connections most General Santos City projects need. Fees and timelines vary by project size and use."
        />
        </div>

        <div ref={permitsGridRef} className="reveal overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Permit / Connection</th>
                <th className="px-4 py-3">Office</th>
                <th className="px-4 py-3">Fee basis</th>
                <th className="px-4 py-3">Timeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PERMITS.map(p => (
                <tr key={p.name} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-primary-700">
                    {p.office}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{p.fee}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {p.timeline}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-gray-500">
          Final fees are calculated by the responsible office based on
          project specifics. Always confirm at the OBO or utility office
          before paying or contracting work.
        </p>
      </PageSection>

      {/* ---------- Common requirements + Hotlines ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={reqHeadRef} className="reveal grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              tier="secondary"
              icon={ClipboardList}
              eyebrow="Bring these"
              title="Common requirements"
              helper="Documents most building and connection applications ask for."
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
              title="Utility & emergency hotlines"
              helper="Direct lines for water, power, fire, disaster response, and DPWH."
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
        <div ref={officesHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Building2}
          eyebrow="Where to go"
          title="Responsible Offices"
          helper="Government offices, utilities, and national agencies that handle infrastructure for General Santos City."
        />
        </div>

        <div ref={officesGridRef} className="reveal grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {OFFICES.map(office => (
            <a
              key={office.name}
              href={office.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <office.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                    {office.name}
                  </h4>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-700" />
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
              <strong>Heads up:</strong> Permit fees follow PD 1096 and the
              local revenue ordinance. Always confirm the current schedule
              at the OBO before paying.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Watch out for fixers.</strong> All city offices accept
              direct applications. Never pay anyone who offers to fast-track
              your permit outside official channels.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default Infrastructure;
