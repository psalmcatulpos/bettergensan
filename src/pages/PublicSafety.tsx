// /services/disaster-preparedness — Public Safety page for General Santos
// City. Goes deeper than the registry-driven category page with:
//   1. 5-step access path
//   2. 6 core public-safety services
//   3. Interactive Leaflet OSM map of all 10 police stations
//   4. Full PNP station directory with phone numbers
//   5. Crisis & disaster hotlines
//   6. Responsible offices
//
// Pure information page. Every link goes to an official PNP, BFP, NDRRMC,
// PHIVOLCS, PAGASA, or LGU portal. BetterGensan never collects forms or
// payments.
//
// Sources cross-checked against:
//   RA 11463 (Malasakit Centers Act, 2019)
//   RA 10121 (PH Disaster Risk Reduction & Management Act, 2010)
//   RA 9514  (Fire Code of the Philippines, 2008)
//   RA 6975  (Department of Interior and Local Government Act / PNP)
//   RA 11131 (Philippine Identification System Act, partial PNP linkage)

import {
  AlertOctagon,
  AlertTriangle,
  Building2,
  CheckCircle2,
  CloudRain,
  ExternalLink,
  Flame,
  Hash,
  HeartHandshake,
  Map as MapIcon,
  MapPin,
  Mountain,
  Phone,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Siren,
  Truck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';
import useReveal from '../hooks/useReveal';
import PoliceStationsMap from '../components/safety/PoliceStationsMap';
import { POLICE_STATIONS } from '../components/safety/policeStations';

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
    icon: Phone,
    title: 'Identify the emergency',
    body: 'Police, fire, medical, or disaster. The right hotline routes you faster than going through 911 alone.',
  },
  {
    number: '02',
    icon: Siren,
    title: 'Call 911 (fastest) or the nearest station',
    body: '911 is the nationwide emergency dispatch system and now routes faster than calling agency lines directly. For non-life-threatening incidents you can also call the nearest PNP, BFP, or CDRRMO station directly.',
  },
  {
    number: '03',
    icon: MapPin,
    title: 'Share your exact location',
    body: 'Give the responder your barangay, street, and any landmark. If you can, share a Google Maps pin or your phone GPS coordinates.',
  },
  {
    number: '04',
    icon: ShieldCheck,
    title: 'Stay on the line unless told to hang up',
    body: 'Follow the dispatcher\'s instructions. Do not hang up unless they explicitly tell you to. Keep your phone unlocked for callbacks.',
  },
  {
    number: '05',
    icon: HeartHandshake,
    title: 'Cooperate with first responders',
    body: 'When responders arrive, follow their directions and provide ID or witness statements as needed.',
  },
];

// ---------- 6 main public-safety services ----------

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
    icon: Phone,
    title: 'Emergency Hotline (911)',
    body: 'Nationwide 911 emergency dispatch system for police, fire, and medical emergencies. Free to call from any landline or mobile network.',
    law: 'EO 56, s. 2018 (911 nationwide rollout)',
    benefit: 'Single number for all emergencies, 24/7 dispatch',
    who: 'Anyone in the Philippines',
    href: 'tel:911',
    cta: 'Call 911',
    agency: 'NEHRC',
  },
  {
    icon: Siren,
    title: 'CDRRMO Disaster Response',
    body: 'Local disaster preparedness, evacuation planning, and rescue operations. Coordinates evacuation centers and conducts drills citywide together with the LGU and barangays.',
    law: 'RA 10121 (DRRM Act, 2010)',
    benefit: 'Local response, evacuation, and disaster information',
    who: 'All General Santos City residents',
    href: 'https://gensantos.gov.ph/',
    cta: 'Visit CDRRMO',
    agency: 'CDRRMO',
  },
  {
    icon: CloudRain,
    title: 'Weather & Disaster Bulletins',
    body: 'Live typhoon, flood, and storm advisories from PAGASA. Updated multiple times daily during severe weather.',
    law: 'PAGASA Modernization Act',
    benefit: 'Free real-time weather and storm tracking',
    who: 'Everyone, no registration needed',
    href: 'https://www.pagasa.dost.gov.ph/',
    cta: 'Visit PAGASA',
    agency: 'PAGASA',
  },
  {
    icon: Shield,
    title: 'Police Assistance & Clearance',
    body: 'Police clearance, blotter reports, and incident response by the Philippine National Police. National PNP clearance is available online via PNP Clearance.',
    law: 'RA 6975 (DILG / PNP Act)',
    benefit: 'Police clearance, blotter, and rapid response',
    who: 'Filipino citizens and residents',
    href: 'https://pnpclearance.ph/',
    cta: 'Apply on PNP Clearance',
    agency: 'PNP',
  },
  {
    icon: Flame,
    title: 'Fire Safety & Prevention',
    body: 'BFP fire suppression, fire safety inspection certificates, and community fire prevention programs.',
    law: 'RA 9514 (Fire Code of the Philippines, 2008)',
    benefit: 'Fire response, FSIC issuance, prevention education',
    who: 'Residents and business owners',
    href: 'https://bfp.gov.ph/',
    cta: 'Visit BFP',
    agency: 'BFP',
  },
  {
    icon: Mountain,
    title: 'Earthquake & Tsunami Bulletins',
    body: 'Real-time seismic activity and tsunami advisories from PHIVOLCS. Critical for the Mindanao region given local faultlines.',
    law: 'PHIVOLCS Charter',
    benefit: 'Live earthquake bulletins and tsunami alerts',
    who: 'Everyone, especially coastal communities',
    href: 'https://www.phivolcs.dost.gov.ph/',
    cta: 'Visit PHIVOLCS',
    agency: 'PHIVOLCS',
  },
];

// ---------- Core emergency units ----------

interface CoreUnit {
  icon: LucideIcon;
  name: string;
  scope: string;
  phones: string[];
  hotline?: string;
}

const CORE_UNITS: CoreUnit[] = [
  {
    icon: Shield,
    name: 'GSC Police Office',
    scope: 'Headquarters of the Philippine National Police in General Santos City.',
    phones: ['552-5573', '0998-598-7207'],
  },
  {
    icon: ShieldAlert,
    name: 'Task Force Gensan',
    scope: 'Joint anti-crime task force operating across General Santos City.',
    phones: ['887-6018', '0905-144-3676'],
  },
  {
    icon: Siren,
    name: 'City Disaster Risk Reduction & Management Office',
    scope: 'Local CDRRMO. Disaster preparedness, emergency response, evacuation, and rescue.',
    phones: ['552-3939', '552-8861', '0943-461-4548'],
  },
  {
    icon: Flame,
    name: 'Bureau of Fire Protection',
    scope: 'Fire suppression, fire safety inspection, and rescue operations. Hotline 160.',
    phones: ['552-1160', '0943-341-5561'],
    hotline: '160',
  },
  {
    icon: ShieldAlert,
    name: 'Philippine Coast Guard (PCG)',
    scope: 'Sea rescue, port emergencies, maritime incidents, and oil spill response. Critical for General Santos City as a coastal port city.',
    phones: ['(02) 8527-3877', '143'],
    hotline: '143',
  },
  {
    icon: Truck,
    name: 'Traffic Enforcement Unit',
    scope: 'City traffic enforcement, road incidents, and vehicular accidents.',
    phones: ['825-3894', '0975-749-0019'],
  },
  {
    icon: AlertOctagon,
    name: 'Mobile Patrol Unit',
    scope: 'Roving police patrol unit for rapid response across the city.',
    phones: ['822-0215'],
  },
];

// ---------- Crisis hotlines ----------

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
    icon: Shield,
    label: 'PNP Hotline',
    number: '117',
    body: 'Direct line to the Philippine National Police.',
  },
  {
    icon: Flame,
    label: 'BFP General Santos',
    number: '160',
    body: 'Bureau of Fire Protection, fire emergencies and inspections.',
  },
  {
    icon: AlertOctagon,
    label: 'CDRRMO GenSan',
    number: '111',
    body: 'City Disaster Risk Reduction and Management Office.',
  },
  {
    icon: HeartHandshake,
    label: 'Red Cross',
    number: '143',
    body: 'Philippine Red Cross, disaster response and blood services.',
  },
  {
    icon: Siren,
    label: 'NDRRMC OpCen',
    number: '8911-1406',
    body: 'National Disaster Risk Reduction and Management Council.',
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
    icon: Siren,
    name: 'CDRRMO General Santos',
    scope: 'Local disaster preparedness, response, recovery, and rescue coordination.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Shield,
    name: 'Philippine National Police',
    scope: 'Crime prevention, police clearance, and public order. Operates 10 police stations citywide.',
    href: 'https://www.pnp.gov.ph/',
    domain: 'pnp.gov.ph',
  },
  {
    icon: Flame,
    name: 'Bureau of Fire Protection',
    scope: 'Fire suppression, fire safety inspection, and certification.',
    href: 'https://bfp.gov.ph/',
    domain: 'bfp.gov.ph',
  },
  {
    icon: AlertOctagon,
    name: 'NDRRMC',
    scope: 'National Disaster Risk Reduction and Management Council.',
    href: 'https://ndrrmc.gov.ph/',
    domain: 'ndrrmc.gov.ph',
  },
  {
    icon: Mountain,
    name: 'PHIVOLCS',
    scope: 'Volcano monitoring, earthquake bulletins, and tsunami warnings.',
    href: 'https://www.phivolcs.dost.gov.ph/',
    domain: 'phivolcs.dost.gov.ph',
  },
  {
    icon: CloudRain,
    name: 'PAGASA',
    scope: 'Weather forecasting, typhoon tracking, and climate services.',
    href: 'https://www.pagasa.dost.gov.ph/',
    domain: 'pagasa.dost.gov.ph',
  },
];

// ---------- Quick safety tips ----------

const TIPS = [
  'Save emergency contacts offline — write 911, BFP, CDRRMO, Coast Guard, and your nearest PNP station on paper. Internet and cell service can drop during disasters.',
  'Keep an emergency go-bag with water, food, IDs, medication, and a flashlight.',
  'Know your barangay\'s designated evacuation center.',
  'Sign up for local CDRRMO text alerts when offered.',
  'In an earthquake: Drop, Cover, and Hold On until shaking stops.',
  'After heavy rain: avoid flooded streets, flowing water can hide hazards.',
];

const PublicSafety: React.FC = () => {
  const heroRef = useReveal();
  const stepsHeadRef = useReveal();
  const stepsGridRef = useReveal<HTMLOListElement>();
  const servicesHeadRef = useReveal();
  const servicesGridRef = useReveal();
  const unitsHeadRef = useReveal();
  const unitsGridRef = useReveal();
  const stationsHeadRef = useReveal();
  const stationsGridRef = useReveal();
  const tipsHeadRef = useReveal();
  const officesHeadRef = useReveal();
  const officesGridRef = useReveal();

  return (
    <>
      <SEO
        path="/services/disaster-preparedness"
        title="Public Safety — GenSan"
        description="Public safety, emergency response, and disaster preparedness for General Santos City. Includes the full PNP police station directory, BFP, CDRRMO, PAGASA, PHIVOLCS, and a Leaflet map of all 10 police stations."
        keywords="gensan public safety, gensan police stations, pnp gensan, cdrrmo gensan, bfp gensan, ndrrmc, pagasa, phivolcs, emergency hotlines"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div ref={heroRef} className="reveal mx-auto max-w-[1100px] px-4" style={{ animation: 'fade-up var(--dur-slow) var(--ease-out-quart) both' } as React.CSSProperties}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Public Safety' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <ShieldAlert className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Emergencies & Disasters
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Public Safety
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Emergency response, disaster preparedness, fire safety, and
                police services for General Santos City. The full PNP
                station directory and a live map of all 10 stations are on
                this page.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="tel:911"
                  className="inline-flex items-center gap-1.5 rounded-full bg-error-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-error-700"
                >
                  <Phone className="h-3.5 w-3.5" />
                  Call 911
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
          eyebrow="In an emergency"
          title="What to do in 5 steps"
          helper="The standard sequence for any emergency call in General Santos City."
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
          icon={Shield}
          eyebrow="Core services"
          title="Public safety services"
          helper="Six core safety services available to General Santos City residents at the local and national levels."
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

      {/* ---------- Core emergency units ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={unitsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Siren}
          eyebrow="Save these first"
          title="Core emergency units"
          helper="The six core public safety units of General Santos City. Tap any number to dial directly."
        />
        </div>

        <div ref={unitsGridRef} className="reveal grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {CORE_UNITS.map(u => (
            <article
              key={u.name}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="mb-3 flex items-start gap-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                  <u.icon className="h-5 w-5" />
                </div>
                <div className="min-w-0 flex-grow">
                  <h3 className="text-sm font-semibold leading-snug text-gray-900">
                    {u.name}
                  </h3>
                  <p className="mt-1 text-xs leading-relaxed text-gray-600">
                    {u.scope}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap gap-x-3 gap-y-1 border-t border-gray-100 pt-3">
                {u.phones.map(p => (
                  <a
                    key={p}
                    href={`tel:${p.replace(/\D/g, '')}`}
                    className="inline-flex items-center gap-1 text-[12px] font-bold text-primary-700 hover:text-primary-800"
                  >
                    <Phone className="h-3 w-3" />
                    {p}
                  </a>
                ))}
                {u.hotline && (
                  <a
                    href={`tel:${u.hotline}`}
                    className="inline-flex items-center gap-1 rounded-full bg-error-600 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-error-700"
                  >
                    Hotline {u.hotline}
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      {/* ---------- Police stations: map + directory ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={stationsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={MapIcon}
          eyebrow="PNP General Santos City"
          title="PNP stations directory"
          helper="The 10 official PNP stations of General Santos City. Stations 1, 2, and 3 are pinned to verified OpenStreetMap locations. Stations 4 to 10 use the centroid of their barangay as an approximation."
        />
        </div>

        <div className="mb-5">
          <PoliceStationsMap />
          <p className="mt-2 text-[11px] text-gray-500">
            Map data &copy; OpenStreetMap contributors. For emergencies,
            dial <strong>911</strong> first. Markers tagged{' '}
            <strong>approx</strong> show the barangay center, not the exact
            station building.
          </p>
        </div>

        <div ref={stationsGridRef} className="reveal grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {POLICE_STATIONS.map(s => (
            <article
              key={s.number}
              className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex items-start justify-between gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {s.name}
                  </h4>
                  {s.approximate && (
                    <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-amber-700">
                      approx
                    </span>
                  )}
                </div>
                <p className="mt-1 text-xs leading-snug text-gray-600">
                  {s.address}
                </p>
                <a
                  href={`tel:${s.phone.replace(/\D/g, '')}`}
                  className="mt-1.5 inline-flex items-center gap-1 text-sm font-bold text-primary-700 hover:text-primary-800"
                >
                  <Phone className="h-3 w-3" />
                  {s.phone}
                </a>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      {/* ---------- Quick safety tips + Hotlines ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={tipsHeadRef} className="reveal grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              tier="secondary"
              icon={CheckCircle2}
              eyebrow="Be prepared"
              title="Quick safety tips"
              helper="Six everyday safety habits every General Santos City resident should adopt."
            />
            <ul className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]">
              {TIPS.map(t => (
                <li
                  key={t}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading
              tier="secondary"
              icon={Phone}
              eyebrow="Save these"
              title="Crisis hotlines"
              helper="National hotlines for emergencies, disaster response, and crisis assistance."
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
          helper="Government offices and official portals that handle public safety for General Santos City."
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
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>In a real emergency, dial 911 first.</strong> Direct
              station numbers are fastest for non-urgent reports and
              follow-ups.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong>Heads up:</strong> Phone numbers and station
              assignments can change. Always confirm with the official PNP
              GenSan office before relying on a specific number.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default PublicSafety;
