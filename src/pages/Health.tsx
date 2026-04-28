// /services/health-services — dedicated Health Services page for General
// Santos City. Goes deeper than the registry-driven ServiceCategory pages
// with:
//   1. 5-step access path
//   2. 6 core public-health services (vaccination, maternal/child, TB-DOTS,
//      HIV, mental health, hospital care)
//   3. PhilHealth membership reference (UHC Act, Konsulta package)
//   4. Hospitals in General Santos City
//   5. Crisis & support hotlines
//   6. Responsible offices
//
// Pure information page. Every link goes to the official DOH, PhilHealth,
// or LGU portal — BetterGensan never collects forms or payments.
//
// Sources cross-checked against:
//   RA 11223 (Universal Health Care Act, 2019)
//   RA 11036 (Mental Health Act, 2018)
//   RA 9994  (Senior Citizens — free medical in govt facilities)
//   RA 10354 (Reproductive Health Law)
//   RA 11215 (National Integrated Cancer Control Act)
//   DOH Expanded Program on Immunization (EPI)
//   PhilHealth Circular series — Konsulta Package, Z Benefits

import {
  Activity,
  AlertTriangle,
  Apple,
  Baby,
  BadgeCheck,
  Brain,
  Building2,
  CalendarClock,
  CheckCircle2,
  Cross,
  ExternalLink,
  Globe,
  HandHeart,
  Hash,
  Heart,
  HeartHandshake,
  Hospital,
  IdCard,
  MapPin,
  Phone,
  Pill,
  ShieldCheck,
  Stethoscope,
  Syringe,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';
import useReveal from '../hooks/useReveal';
import HospitalsMap from '../components/health/HospitalsMap';
import { HOSPITALS, UNMAPPED_HOSPITALS } from '../components/health/hospitals';

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
    icon: BadgeCheck,
    title: 'Confirm your PhilHealth status',
    body: 'Every Filipino is automatically a PhilHealth member under the UHC Act. Verify and update your record via the PhilHealth Member Portal.',
  },
  {
    number: '02',
    icon: MapPin,
    title: 'Find your barangay health center',
    body: 'Most preventive services (vaccines, check-ups, family planning) are free at the nearest Barangay Health Station or City Health Office facility.',
  },
  {
    number: '03',
    icon: CalendarClock,
    title: 'Book or walk in',
    body: 'CHO GenSan accepts walk-ins; selected services can be booked online via the CHO Appointments portal.',
  },
  {
    number: '04',
    icon: IdCard,
    title: 'Bring required documents',
    body: 'Valid ID, PhilHealth MDR, vaccination card (if applicable), and any prior medical records or referral letters.',
  },
  {
    number: '05',
    icon: HandHeart,
    title: 'Receive care or referral',
    body: 'Primary care is delivered on-site. For specialized care, the doctor will issue a referral to a city or regional hospital.',
  },
];

// ---------- 6 main health services ----------

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
    icon: Syringe,
    title: 'Free Vaccination (EPI)',
    body: 'The Expanded Program on Immunization provides free vaccines for infants, children, and pregnant mothers — including BCG, hepatitis B, OPV/IPV, pentavalent, MMR, and HPV.',
    law: 'DOH EPI · RA 10152',
    benefit: 'Free routine vaccines for infants 0–1, school-age children, women, and seniors',
    who: 'All Filipinos — no PhilHealth required',
    href: 'https://doh.gov.ph/national-immunization-program',
    cta: 'Visit DOH EPI',
    agency: 'DOH · CHO',
  },
  {
    icon: Baby,
    title: 'Maternal & Child Health',
    body: 'Prenatal check-ups, safe facility-based delivery, postnatal care, infant nutrition, and breastfeeding support across CHO GenSan and barangay health centers.',
    law: 'DOH MNCHN Strategy · RA 11148 (First 1000 Days)',
    benefit: 'Free prenatal, delivery, postnatal, and infant care',
    who: 'Pregnant women, mothers, and infants',
    href: 'https://choappointment.gensantos.gov.ph/',
    cta: 'Book at CHO',
    agency: 'CHO · GenSan',
  },
  {
    icon: Activity,
    title: 'TB-DOTS Program',
    body: 'Free tuberculosis screening, diagnosis, and Directly Observed Treatment Short-course (DOTS) — the WHO-standard TB cure regimen — at city health centers.',
    law: 'DOH National TB Program · RA 10767',
    benefit: 'Free TB tests, X-ray, and full DOTS treatment',
    who: 'Anyone with TB symptoms or contact exposure',
    href: 'https://doh.gov.ph/national-tuberculosis-control-program',
    cta: 'Visit DOH NTP',
    agency: 'DOH · CHO',
  },
  {
    icon: ShieldCheck,
    title: 'HIV Testing & Treatment',
    body: 'Free, confidential HIV counseling and testing (HCT), antiretroviral therapy (ART), and prevention support including PrEP at city health centers and treatment hubs.',
    law: 'RA 11166 (Philippine HIV and AIDS Policy Act)',
    benefit: 'Free HIV test, ART medication, and counseling',
    who: 'Anyone aged 15+; minors with parental consent',
    href: 'https://doh.gov.ph/national-aids-program',
    cta: 'Visit DOH NASPCP',
    agency: 'DOH · CHO',
  },
  {
    icon: Brain,
    title: 'Mental Health Services',
    body: 'Counseling, psychiatric referral, and crisis intervention. Mental health is recognized as a public health issue and a covered PhilHealth benefit.',
    law: 'RA 11036 (Mental Health Act, 2018)',
    benefit: 'Free counseling at CHO; PhilHealth coverage for inpatient psychiatric care',
    who: 'Any Filipino in need of mental health support',
    href: 'https://doh.gov.ph/mental-health',
    cta: 'Visit DOH MH',
    agency: 'DOH · CHO',
  },
  {
    icon: Hospital,
    title: 'Hospital & Emergency Care',
    body: 'Inpatient services, diagnostic tests, and emergency stabilization at General Santos City Hospital and partner facilities. Emergency stabilization is provided regardless of ability to pay; costs may apply after admission. Malasakit Center provides one-stop medical financial assistance.',
    law: 'RA 11223 (UHC Act) · RA 11463 (Malasakit Centers Act)',
    benefit: 'PhilHealth-covered care + Malasakit Center assistance for indigent patients',
    who: 'All Filipino citizens',
    href: 'https://gensantos.gov.ph/',
    cta: 'Find a hospital',
    agency: 'LGU · DOH',
  },
];

// ---------- PhilHealth membership reference ----------

interface PhilHealthRow {
  category: string;
  who: string;
  premium: string;
  benefit: string;
}

const PHILHEALTH: PhilHealthRow[] = [
  {
    category: 'Direct Contributor — Employed',
    who: 'Private and government workers',
    premium: '5% of monthly basic salary (split with employer)',
    benefit: 'Full benefit package + Konsulta',
  },
  {
    category: 'Direct Contributor — Self-Employed / Voluntary',
    who: 'Self-employed, professionals, OFWs',
    premium: '5% of declared monthly income',
    benefit: 'Full benefit package + Konsulta',
  },
  {
    category: 'Indirect Contributor — Indigent',
    who: 'Listmahan-validated indigent families',
    premium: 'Subsidized by national government',
    benefit: 'Full benefit package + Konsulta',
  },
  {
    category: 'Indirect Contributor — Senior Citizens',
    who: 'Filipino citizens aged 60+',
    premium: 'Free, mandatory under RA 10645',
    benefit: 'Full benefit package',
  },
  {
    category: 'Lifetime Member',
    who: '120+ months of contributions, age 60+',
    premium: 'No further premium',
    benefit: 'Full benefit package for life',
  },
];

// ---------- Crisis & support hotlines ----------

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
    body: 'Police, fire, and medical emergencies — 24/7.',
  },
  {
    icon: Stethoscope,
    label: 'DOH Hotline',
    number: '1555',
    body: 'Department of Health public information and assistance hotline.',
  },
  {
    icon: Brain,
    label: 'NCMH Crisis Line',
    number: '1553',
    body: '24/7 mental health crisis hotline — National Center for Mental Health.',
  },
  {
    icon: Heart,
    label: 'PhilHealth',
    number: '8441-7442',
    body: 'Membership, claims, and benefit inquiries.',
  },
  {
    icon: HeartHandshake,
    label: 'Red Cross',
    number: '143',
    body: 'Philippine Red Cross — disaster response and blood services.',
  },
  {
    icon: Baby,
    label: 'Bantay Bata 163',
    number: '163',
    body: 'Child protection and welfare hotline.',
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
    icon: Stethoscope,
    name: 'City Health Office (CHO) — GenSan',
    scope: 'Citywide health programs, vaccinations, primary care, and barangay health stations.',
    href: 'https://cho.gensantos.gov.ph/',
    domain: 'cho.gensantos.gov.ph',
  },
  {
    icon: CalendarClock,
    name: 'CHO Appointments Portal',
    scope: 'Online booking for City Health Office services.',
    href: 'https://choappointment.gensantos.gov.ph/',
    domain: 'choappointment.gensantos.gov.ph',
  },
  {
    icon: Building2,
    name: 'DOH Center for Health Development XII',
    scope: 'DOH regional office serving SOCCSKSARGEN — health policy, outbreak response, and program coordination.',
    href: 'https://ro12.doh.gov.ph/',
    domain: 'ro12.doh.gov.ph',
  },
  {
    icon: Globe,
    name: 'Department of Health',
    scope: 'National health policy, programs, and advisories.',
    href: 'https://doh.gov.ph/',
    domain: 'doh.gov.ph',
  },
  {
    icon: Wallet,
    name: 'PhilHealth',
    scope: 'National health insurance — membership, premiums, claims, and Konsulta.',
    href: 'https://www.philhealth.gov.ph/',
    domain: 'philhealth.gov.ph',
  },
  {
    icon: Apple,
    name: 'DOST FNRI',
    scope: 'Food and Nutrition Research Institute — official dietary guidance.',
    href: 'https://www.fnri.dost.gov.ph/',
    domain: 'fnri.dost.gov.ph',
  },
];

// ---------- What's free at CHO ----------

const FREE_AT_CHO = [
  'EPI vaccines for infants and children',
  'Prenatal and postnatal check-ups',
  'TB screening, X-ray, and DOTS treatment',
  'HIV testing, counseling, and ART medication',
  'Family planning consultations and methods',
  'Sanitation permit issuance (for businesses)',
  'Animal bite treatment and anti-rabies vaccine',
  'Mental health counseling and crisis intervention',
];

const Health: React.FC = () => {
  const heroRef = useReveal();
  const stepsHeadRef = useReveal();
  const stepsGridRef = useReveal<HTMLOListElement>();
  const servicesHeadRef = useReveal();
  const servicesGridRef = useReveal();
  const philhealthHeadRef = useReveal();
  const philhealthGridRef = useReveal();
  const freeHeadRef = useReveal();
  const hospitalsHeadRef = useReveal();
  const hospitalsGridRef = useReveal();
  const officesHeadRef = useReveal();
  const officesGridRef = useReveal();

  return (
    <>
      <SEO
        path="/services/health-services"
        title="Health Services — GenSan"
        description="Complete guide to public health services in General Santos City — free vaccinations, maternal & child care, TB-DOTS, HIV testing, mental health, PhilHealth coverage, hospitals, and crisis hotlines."
        keywords="gensan health services, cho gensan, doh region 12, philhealth, free vaccination philippines, tb dots, hiv testing gensan, mental health philippines, ncmh, malasakit center"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div ref={heroRef} className="reveal mx-auto max-w-[1100px] px-4" style={{ animation: 'fade-up var(--dur-slow) var(--ease-out-quart) both' } as React.CSSProperties}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Health Services' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Free & Affordable Care
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Health Services
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Free check-ups, vaccinations, maternal care, mental health
                support, and hospital services available to General Santos
                City residents under the Universal Health Care Act and DOH
                programs.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://choappointment.gensantos.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <CalendarClock className="h-3.5 w-3.5" />
                  Book at CHO
                </a>
                <a
                  href="https://cho.gensantos.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit CHO GenSan
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
          eyebrow="From walk-in to care"
          title="How to access public health services in 5 steps"
          helper="The standard intake path for most CHO and DOH primary-care services."
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

      {/* ---------- 6 main health services ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={servicesHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={HandHeart}
          eyebrow="Most requested"
          title="Main health services"
          helper="Six core public-health services available to General Santos City residents — most are free at any CHO health center or barangay health station."
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

      {/* ---------- PhilHealth membership reference ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={philhealthHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Wallet}
          eyebrow="PhilHealth"
          title="Universal coverage at a glance"
          helper="Under RA 11223 (Universal Health Care Act), every Filipino is automatically a PhilHealth member. The category determines who pays the premium."
        />
        </div>

        <div ref={philhealthGridRef} className="reveal overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Membership Category</th>
                <th className="px-4 py-3">Who</th>
                <th className="px-4 py-3">Premium</th>
                <th className="px-4 py-3">Benefits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {PHILHEALTH.map(p => (
                <tr key={p.category} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {p.category}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{p.who}</td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {p.premium}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {p.benefit}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] italic text-gray-500">
          PhilHealth reduces costs for covered cases. Some services may still
          require co-payment depending on the facility, ward, and procedure.
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs text-primary-900">
            <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
            <div>
              <strong>Konsulta Package:</strong> Free outpatient consults,
              labs, and select medicines at PhilHealth-accredited primary
              care providers.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs text-primary-900">
            <Hospital className="mt-0.5 h-4 w-4 shrink-0 text-primary-700" />
            <div>
              <strong>No Balance Billing:</strong> Indigent and sponsored
              members admitted to government hospital wards owe ₱0 for
              PhilHealth-covered cases.
            </div>
          </div>
        </div>
      </PageSection>

      {/* ---------- What's free at CHO + Hotlines ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={freeHeadRef} className="reveal grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              tier="secondary"
              icon={CheckCircle2}
              eyebrow="Free at CHO"
              title="Free at CHO health centers"
              helper="DOH-funded primary-care services offered at CHO GenSan and barangay health stations. Availability varies by health center — call ahead before visiting."
            />
            <ul className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]">
              {FREE_AT_CHO.map(item => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-sm text-gray-700"
                >
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <SectionHeading
              tier="secondary"
              icon={Phone}
              eyebrow="In a crisis"
              title="Health hotlines"
              helper="National hotlines for emergencies, mental health, and PhilHealth assistance."
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

      {/* ---------- Hospitals in GenSan ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={hospitalsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Hospital}
          eyebrow="Where to go"
          title="Hospitals in General Santos City"
          helper="Public and private hospitals serving GenSan and the SOCCSKSARGEN region. Always confirm availability and emergency capacity by phone before traveling."
        />
        </div>

        <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
          <span>
            Hospitals listed include both <strong>public</strong> and{' '}
            <strong>private</strong> facilities. Charges, services, and
            emergency capacity vary — confirm by phone before traveling.
          </span>
        </div>

        {/* Interactive OSM map of all hospitals on this list */}
        <div className="mb-4">
          <HospitalsMap />
          <p className="mt-2 text-[11px] text-gray-500">
            Map data &copy; OpenStreetMap contributors. Marker positions are
            approximate. For emergencies, dial <strong>911</strong> first.
          </p>
        </div>

        <div ref={hospitalsGridRef} className="reveal grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {HOSPITALS.map(h => (
            <article
              key={h.name}
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <Hospital className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {h.name}
                  </h4>
                  <span className="rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                    {h.type}
                  </span>
                </div>
                {h.address && (
                  <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                    {h.address}
                  </p>
                )}
                {h.phones && h.phones.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-x-3 gap-y-0.5">
                    {h.phones.map(p => (
                      <a
                        key={p}
                        href={`tel:${p.replace(/\D/g, '')}`}
                        className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 hover:text-primary-800"
                      >
                        <Phone className="h-3 w-3" />
                        {p}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>

        {UNMAPPED_HOSPITALS.length > 0 && (
          <>
            <h3 className="mt-6 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
              Other hospitals (not yet on the map)
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-2">
              {UNMAPPED_HOSPITALS.map(h => (
                <article
                  key={h.name}
                  className="flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04]"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white ring-1 ring-primary-700">
                    <Cross className="h-4 w-4" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex flex-wrap items-center gap-2">
                      <h4 className="text-sm font-semibold text-gray-900">
                        {h.name}
                      </h4>
                      <span className="rounded-full border border-gray-300 bg-gray-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-gray-700">
                        {h.type}
                      </span>
                    </div>
                    <div className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5">
                      {h.phones.map(p => (
                        <a
                          key={p}
                          href={`tel:${p.replace(/\D/g, '')}`}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-primary-700 hover:text-primary-800"
                        >
                          <Phone className="h-3 w-3" />
                          {p}
                        </a>
                      ))}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <p className="mt-4 text-[11px] text-gray-500">
          Hospital list is informational and may not be exhaustive. For
          emergencies always dial <strong>911</strong> first. Operators will
          dispatch the nearest available facility.
        </p>
      </PageSection>

      {/* ---------- Responsible offices ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={officesHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Building2}
          eyebrow="Where to go"
          title="Responsible Offices"
          helper="Government offices and official portals that handle public health for General Santos City."
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
              <strong>Not medical advice.</strong> BetterGensan does not
              provide diagnosis or treatment recommendations. For symptoms
              or medical decisions, always consult a licensed health
              professional.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <Pill className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong>Beware of medicine fixers.</strong> Free DOH medicines
              are dispensed only at accredited health facilities — never
              through individuals or unofficial channels.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default Health;
