// /services/environment — dedicated Environment page for General Santos
// City. Last specific service category page (closes the registry-driven
// catchall). Goes deeper than the registry version with:
//   1. 5-step everyday compliance path
//   2. 6 core environmental services
//   3. Solid waste segregation guide (RA 9003 categories)
//   4. Common requirements + environment hotlines
//   5. Responsible offices
//
// Pure information page. Every link goes to the official DENR, EMB,
// Climate Change Commission, BFAR, or LGU portal. BetterGensan never
// collects forms or payments.
//
// Sources cross-checked against:
//   RA 9003 (Ecological Solid Waste Management Act, 2000)
//   RA 9275 (Philippine Clean Water Act, 2004)
//   RA 8749 (Philippine Clean Air Act, 1999)
//   RA 9729 (Climate Change Act, 2009)
//   RA 6969 (Toxic Substances & Hazardous Waste Act, 1990)
//   PD 705  (Revised Forestry Code, 1975)
//   PD 1586 (Philippine EIS System / ECC, 1978)

import {
  AlertTriangle,
  Apple,
  Building2,
  CheckCircle2,
  ClipboardList,
  CloudRain,
  ExternalLink,
  Fish,
  Flame,
  Hash,
  Leaf,
  MapPin,
  Mountain,
  Phone,
  Recycle,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Trash2,
  TreePine,
  Truck,
  Waves,
  Wind,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';
import useReveal from '../hooks/useReveal';

// ---------- 5-step compliance path ----------

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Recycle,
    title: 'Segregate at source',
    body: 'Separate biodegradable, recyclable, residual, and special waste at home. Required by RA 9003 and enforced citywide.',
  },
  {
    number: '02',
    icon: Truck,
    title: 'Follow your barangay waste collection schedule',
    body: 'Each barangay has its own waste pickup day and time. Set out only the categories scheduled for that day.',
  },
  {
    number: '03',
    icon: Apple,
    title: 'Compost biodegradable waste where possible',
    body: 'Biodegradable waste — kitchen scraps, leaves, and yard waste — can be composted at home or brought to the nearest Materials Recovery Facility (MRF), in line with RA 9003.',
  },
  {
    number: '04',
    icon: AlertTriangle,
    title: 'Drop hazardous waste at designated points',
    body: 'Used batteries, bulbs, paints, and electronics must never go in the regular bin. Bring them to a CENRO drop-off or LGU collection event.',
  },
  {
    number: '05',
    icon: ShieldCheck,
    title: 'Report environmental violations',
    body: 'Open burning, illegal dumping, and tree cutting without a permit can be reported to CENRO or DENR Region XII.',
  },
];

// ---------- 6 main environmental services ----------

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
    icon: Trash2,
    title: 'Solid Waste & Garbage Collection',
    body: 'Citywide collection of segregated household waste, operation of Materials Recovery Facilities (MRFs), and enforcement of segregation rules.',
    law: 'RA 9003 (Ecological Solid Waste Management Act, 2000)',
    benefit: 'Regular pickup of segregated waste, MRF access',
    who: 'All General Santos City households and businesses',
    href: 'https://gensantos.gov.ph/city-environment-natural-resources-office/',
    cta: 'Visit CENRO',
    agency: 'CENRO · GenSan',
  },
  {
    icon: TreePine,
    title: 'Tree Planting & Cutting Permits',
    body: 'A permit may be required before cutting trees, depending on the location, tree type (planted vs. naturally growing), and whether the land is public, private titled, or under DENR jurisdiction. Tree planting drives and seedling distribution are run under the National Greening Program.',
    law: 'PD 705 (Revised Forestry Code, 1975)',
    benefit: 'Legal tree cutting authority and free seedlings for planting',
    who: 'Property owners, community organizations, and volunteers',
    href: 'https://denr.gov.ph/',
    cta: 'Visit DENR',
    agency: 'CENRO · DENR',
  },
  {
    icon: ClipboardList,
    title: 'Environmental Compliance Certificate (ECC)',
    body: 'Required for projects covered by the Philippine Environmental Impact Statement (EIS) System. Issued by the Environmental Management Bureau (EMB) after review of the project\'s environmental impact assessment.',
    law: 'PD 1586 (Philippine EIS System, 1978)',
    benefit: 'Legal authority to begin a covered project',
    who: 'Developers, builders, and businesses planning EIS-covered projects',
    href: 'https://emb.gov.ph/',
    cta: 'Visit EMB',
    agency: 'EMB · DENR',
  },
  {
    icon: Wind,
    title: 'Air Quality Monitoring',
    body: 'EMB tracks air pollutants from industries and vehicles. Citizens can request data and report air pollution complaints under the Clean Air Act.',
    law: 'RA 8749 (Philippine Clean Air Act, 1999)',
    benefit: 'Public access to air quality data and complaint mechanism',
    who: 'All Filipinos',
    href: 'https://emb.gov.ph/',
    cta: 'Visit EMB',
    agency: 'EMB',
  },
  {
    icon: AlertTriangle,
    title: 'Hazardous Waste Disposal',
    body: 'Toxic and hazardous waste — including batteries, fluorescent lamps, paints, motor oil, electronics, expired medicines, and medical waste — must be disposed of through accredited handlers, not regular collection.',
    law: 'RA 6969 (Toxic & Hazardous Waste Act, 1990)',
    benefit: 'Legal channels for safe disposal of hazardous materials',
    who: 'Households, repair shops, clinics, and industrial users',
    href: 'https://pepp.emb.gov.ph/wp-content/uploads/2016/06/RA-6969-Toxic-Substances-and-Hazardous-and-Nuclear-Wastes-Act-of-1990.pdf',
    cta: 'Read RA 6969',
    agency: 'EMB · DENR',
  },
  {
    icon: Flame,
    title: 'Open Burning & Smoke Complaints',
    body: 'Open burning of garbage, leaves, and other waste is prohibited under RA 8749 (Clean Air Act) and RA 9003 (Solid Waste Act). Smoke and open-burning complaints can be reported to your barangay or directly to CENRO for enforcement.',
    law: 'RA 8749 (Clean Air Act, 1999) · RA 9003 (Solid Waste Act, 2000)',
    benefit: 'Reporting channel for smoke pollution and illegal burning',
    who: 'Any GenSan resident affected by open burning or smoke',
    href: 'https://gensantos.gov.ph/city-environment-natural-resources-office/',
    cta: 'Report to CENRO',
    agency: 'CENRO · Barangay',
  },
  {
    icon: Waves,
    title: 'Coastal & River Cleanup',
    body: 'Volunteer-led coastal and river cleanup drives organized by CENRO and BFAR, especially during International Coastal Cleanup Day.',
    law: 'RA 9275 + RA 8550 (Clean Water + Fisheries Code)',
    benefit: 'Cleaner coastlines and rivers, community engagement',
    who: 'Volunteers, students, and civic organizations',
    href: 'https://www.bfar.da.gov.ph/',
    cta: 'Visit BFAR',
    agency: 'CENRO · BFAR',
  },
];

// ---------- Solid waste segregation guide ----------

interface WasteCategory {
  category: string;
  examples: string;
  whatHappens: string;
}

const WASTE_GUIDE: WasteCategory[] = [
  {
    category: 'Biodegradable (Nabubulok)',
    examples: 'Food scraps, vegetable trimmings, leaves, yard waste',
    whatHappens: 'Composted at home or in MRF. Becomes soil conditioner.',
  },
  {
    category: 'Recyclable (Mapakikinabangan)',
    examples: 'Paper, cardboard, plastic bottles, metal cans, glass',
    whatHappens: 'Sold to junk shops or processed in MRF for recycling.',
  },
  {
    category: 'Residual (Hindi Nabubulok)',
    examples: 'Diapers, sanitary pads, foil, styrofoam, mixed plastics',
    whatHappens: 'Sent to a sanitary landfill. Reduce by buying less single-use.',
  },
  {
    category: 'Special waste (household hazardous)',
    examples: 'Batteries, fluorescent bulbs, paint, motor oil, electronics, expired meds, medical waste',
    whatHappens: 'Drop at CENRO collection points or accredited handlers.',
  },
];

// ---------- Common requirements ----------

const REQUIREMENTS = [
  'Two valid government-issued IDs',
  'Barangay clearance and certificate of residency',
  'Land title or tenancy document (for tree cutting permits)',
  'Sketch plan or photos of the area or project',
  'Project description and impact summary (for ECC applications)',
  'Receipts or proof of accredited disposal (for hazardous waste)',
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
    icon: Leaf,
    label: 'DENR Hotline',
    number: '8927-1080',
    body: 'Department of Environment and Natural Resources central inquiries.',
  },
  {
    icon: Wind,
    label: 'EMB',
    number: '8927-1517',
    body: 'Environmental Management Bureau, ECC and pollution complaints.',
  },
  {
    icon: TreePine,
    label: 'DENR Region XII',
    number: '083-553-9351',
    body: 'Regional DENR office for SOCCSKSARGEN.',
  },
  {
    icon: Trash2,
    label: 'CENRO GenSan',
    number: '552-3939',
    body: 'Local environment office for waste, permits, and complaints.',
  },
  {
    icon: Fish,
    label: 'BFAR Region XII',
    number: '083-553-1117',
    body: 'Bureau of Fisheries, coastal and marine concerns.',
  },
  {
    icon: CloudRain,
    label: 'PAGASA',
    number: '8284-0800',
    body: 'Climate, weather, and storm advisories.',
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
    icon: Leaf,
    name: 'City Environment & Natural Resources Office',
    scope: 'Local environmental enforcement, waste management, and conservation programs.',
    href: 'https://gensantos.gov.ph/city-environment-natural-resources-office/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: TreePine,
    name: 'Department of Environment and Natural Resources',
    scope: 'National policy on natural resources, mining, forestry, and environment.',
    href: 'https://denr.gov.ph/',
    domain: 'denr.gov.ph',
  },
  {
    icon: MapPin,
    name: 'DENR Region XII (SOCCSKSARGEN)',
    scope: 'Regional DENR office serving General Santos City and the SOCCSKSARGEN region.',
    href: 'https://r12.denr.gov.ph/',
    domain: 'r12.denr.gov.ph',
  },
  {
    icon: Wind,
    name: 'Environmental Management Bureau',
    scope: 'Air, water, hazardous waste, and EIS / ECC regulation under DENR.',
    href: 'https://emb.gov.ph/',
    domain: 'emb.gov.ph',
  },
  {
    icon: Recycle,
    name: 'Solid Waste Management Office',
    scope: 'Citywide waste segregation, collection routes, and disposal.',
    href: 'https://gensantos.gov.ph/city-environment-natural-resources-office/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Fish,
    name: 'Bureau of Fisheries & Aquatic Resources',
    scope: 'Coastal resource management and marine conservation.',
    href: 'https://www.bfar.da.gov.ph/',
    domain: 'bfar.da.gov.ph',
  },
  {
    icon: Mountain,
    name: 'Climate Change Commission',
    scope: 'National climate policy, adaptation, and mitigation programs.',
    href: 'https://climate.gov.ph/',
    domain: 'climate.gov.ph',
  },
  {
    icon: Sparkles,
    name: 'Biodiversity Management Bureau',
    scope: 'Protected areas, wildlife, and biodiversity conservation under DENR.',
    href: 'https://bmb.gov.ph/',
    domain: 'bmb.gov.ph',
  },
];

const Environment: React.FC = () => {
  const heroRef = useReveal();
  const stepsHeadRef = useReveal();
  const stepsGridRef = useReveal<HTMLOListElement>();
  const servicesHeadRef = useReveal();
  const servicesGridRef = useReveal();
  const wasteHeadRef = useReveal();
  const wasteGridRef = useReveal();
  const reqHeadRef = useReveal();
  const officesHeadRef = useReveal();
  const officesGridRef = useReveal();

  return (
    <>
      <SEO
        path="/services/environment"
        title="Environment — GenSan"
        description="Complete guide to environmental services in General Santos City. Solid waste segregation, garbage collection, tree planting and cutting permits, ECC applications, air quality, hazardous waste disposal, and the responsible DENR and CENRO offices."
        keywords="gensan environment, cenro gensan, denr region 12, ra 9003 waste segregation, ecc philippines, emb, climate change commission, hazardous waste disposal, coastal cleanup gensan"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div ref={heroRef} className="reveal mx-auto max-w-[1100px] px-4" style={{ animation: 'fade-up var(--dur-slow) var(--ease-out-quart) both' } as React.CSSProperties}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Environment' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <TreePine className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Land, Air, Water
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Environment
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Waste management, conservation, environmental compliance,
                and climate programs in General Santos City. Every link
                goes straight to the responsible CENRO, DENR, or EMB
                portal.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://gensantos.gov.ph/city-environment-natural-resources-office/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <Leaf className="h-3.5 w-3.5" />
                  Visit CENRO GenSan
                </a>
                <a
                  href="https://denr.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit DENR
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
          eyebrow="Everyday compliance"
          title="How to do your part in 5 steps"
          helper="The standard daily path most General Santos City households follow under RA 9003."
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
          icon={Leaf}
          eyebrow="Most requested"
          title="Main environmental services"
          helper="Six core environmental services available to General Santos City residents and businesses."
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
                    Who it's for
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

      {/* ---------- Solid waste segregation guide ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={wasteHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Recycle}
          eyebrow="At a glance"
          title="Solid waste segregation guide"
          helper="The four waste categories defined by RA 9003. Segregation at source is mandatory for every household and business in General Santos City."
        />
        </div>

        <div ref={wasteGridRef} className="reveal overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Examples</th>
                <th className="px-4 py-3">Where it goes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {WASTE_GUIDE.map(w => (
                <tr key={w.category} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {w.category}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {w.examples}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {w.whatHappens}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-gray-500">
          Mixed waste is rejected at the curb under RA 9003. Open burning
          and illegal dumping are punishable offenses.
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
              helper="Documents most environmental permits and applications ask for."
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
              title="Environment hotlines"
              helper="Direct lines to DENR, EMB, CENRO, BFAR, and PAGASA for complaints, permits, and weather data."
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
          helper="Government offices and official portals that handle environmental services for General Santos City."
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
            <ScrollText className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong>Heads up:</strong> Environmental rules and permit
              fees can change through new DENR Administrative Orders.
              Always confirm current requirements with CENRO or EMB before
              starting a project.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Watch out for fixers.</strong> ECC and tree-cutting
              permits go through DENR or CENRO directly. Never pay anyone
              offering to fast-track environmental approvals.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default Environment;
