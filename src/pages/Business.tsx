// /services/business — dedicated Business & Permits page for General Santos
// City. Goes deeper than the registry-driven ServiceCategory pages: a 5-step
// quick-start path, the 6 core permits/registrations, the responsible
// offices, and a fees & timelines reference card.
//
// Pure information page. Every transactional link goes straight to the
// official portal — BetterGensan never collects forms, fees, or documents.

import {
  Activity,
  ArrowRight,
  BadgeCheck,
  Briefcase,
  Building2,
  Calculator,
  CalendarClock,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Flame,
  Globe,
  HandCoins,
  HardHat,
  Hash,
  IdCard,
  Landmark,
  Lightbulb,
  Phone,
  Receipt,
  RefreshCw,
  ShieldCheck,
  Stamp,
  Stethoscope,
  TrendingUp,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';
import useReveal from '../hooks/useReveal';

// ---------- Quick start steps ----------

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
  linkLabel?: string;
  linkHref?: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: Lightbulb,
    title: 'Choose a business structure',
    body: 'Sole proprietorship, partnership, corporation, or cooperative. Each has different registration paths.',
  },
  {
    number: '02',
    icon: BadgeCheck,
    title: 'Register the business name',
    body: 'Sole props register with DTI. Partnerships and corporations register with SEC.',
  },
  {
    number: '03',
    icon: Calculator,
    title: 'Register with BIR (TIN & Certificate of Registration)',
    body: 'Apply for a Tax Identification Number and Certificate of Registration (BIR Form 2303) at the RDO covering General Santos City.',
  },
  {
    number: '04',
    icon: Stamp,
    title: "Secure Barangay Clearance and apply for a Mayor's Permit",
    body: "Get the Barangay Clearance from the barangay where your business is located, then file at the Business Permits & Licensing Office (BPLO) with all supporting clearances.",
    linkLabel: 'or apply online',
    linkHref: '#apply-online',
  },
  {
    number: '05',
    icon: ShieldCheck,
    title: 'Secure other clearances',
    body: 'Sanitary permit, fire safety inspection, and zoning clearance as needed for your business type.',
  },
];

// Order may vary slightly depending on business type (corp vs sole prop,
// regulated industries, etc.). The 5-step path covers the typical case.

// ---------- Permits / registrations (6 cards) ----------

type PermitKind = 'NATIONAL' | 'CITY' | 'BARANGAY';

interface Permit {
  icon: LucideIcon;
  title: string;
  body: string;
  issuer: string;
  href: string;
  cta: string;
  secondaryHref?: string;
  secondaryCta?: string;
  mode?: string;
  cost: string;
  timeline: string;
  kind: PermitKind;
}

const PERMITS: Permit[] = [
  {
    icon: ShieldCheck,
    title: 'Barangay Clearance',
    body: 'Issued by the barangay where the business is located. Required before applying for a Mayor\'s Permit. Must be obtained from your barangay hall in General Santos City.',
    issuer: 'Barangay Hall · GenSan',
    href: 'https://gensantos.gov.ph/',
    cta: 'Visit your barangay',
    cost: '₱100 – ₱500',
    timeline: 'Same day',
    kind: 'BARANGAY',
  },
  {
    icon: Stamp,
    title: "Mayor's Permit (Business Permit)",
    body: 'Annual permit required to operate any business in General Santos City. Apply online through Filipizen or walk in at the BPLO. Renewed every January.',
    issuer: 'BPLO · GenSan',
    href: 'https://www.filipizen.com/partners/gensan_gensan/bpls/newbusiness',
    cta: 'Apply Online',
    secondaryHref: 'https://gensantos.gov.ph/',
    secondaryCta: 'Apply at BPLO',
    mode: 'Online or in-person',
    cost: 'Varies by business type',
    timeline: '3–7 working days',
    kind: 'CITY',
  },
  {
    icon: BadgeCheck,
    title: 'DTI Business Name Registration',
    body: 'Register a sole proprietorship business name with the Department of Trade and Industry.',
    issuer: 'DTI · BNRS',
    href: 'https://bnrs.dti.gov.ph/',
    cta: 'Register on BNRS',
    cost: '₱200 – ₱2,000',
    timeline: 'Same day (online)',
    kind: 'NATIONAL',
  },
  {
    icon: Calculator,
    title: 'BIR Registration (TIN & Certificate of Registration)',
    body: 'Tax Identification Number and BIR Form 2303 — required for issuing receipts and paying taxes.',
    issuer: 'Bureau of Internal Revenue',
    href: 'https://orus.bir.gov.ph/',
    cta: 'Register on ORUS',
    cost: '₱500 (registration fee)',
    timeline: '1–3 working days',
    kind: 'NATIONAL',
  },
  {
    icon: Landmark,
    title: 'SEC Registration (Corporations)',
    body: 'Register partnerships and corporations with the Securities and Exchange Commission.',
    issuer: 'SEC · eSPARC',
    href: 'https://esparc.sec.gov.ph/',
    cta: 'Register on eSPARC',
    cost: 'Based on capital',
    timeline: '2–5 working days',
    kind: 'NATIONAL',
  },
  {
    icon: Stethoscope,
    title: 'Sanitary Permit',
    body: 'Required for food, health, and sanitation-related businesses. Issued by the City Health Office.',
    issuer: 'CHO · GenSan',
    href: 'https://cho.gensantos.gov.ph/',
    cta: 'Apply at CHO',
    cost: '₱200 – ₱500',
    timeline: '1–3 working days',
    kind: 'CITY',
  },
  {
    icon: Flame,
    title: 'Fire Safety Inspection Certificate',
    body: 'BFP-issued certificate confirming the business location meets fire safety standards.',
    issuer: 'Bureau of Fire Protection',
    href: 'https://bfp.gov.ph/',
    cta: 'Visit BFP',
    cost: '₱300 – ₱1,000',
    timeline: '3–5 working days',
    kind: 'NATIONAL',
  },
];

const PERMIT_BADGE_TONE: Record<PermitKind, string> = {
  NATIONAL: 'border-amber-200 bg-amber-50 text-amber-800',
  CITY: 'border-primary-200 bg-primary-50 text-primary-700',
  BARANGAY: 'border-emerald-200 bg-emerald-50 text-emerald-800',
};

// ---------- Common requirements ----------

const REQUIREMENTS = [
  'Two valid government-issued IDs',
  'Proof of address (utility bill or lease contract)',
  'Barangay clearance from your barangay hall',
  'Lease contract or land title for the business location',
  'DTI Business Name Certificate (sole prop) or SEC Certificate (corp)',
  'BIR Certificate of Registration (Form 2303)',
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
    icon: Briefcase,
    name: 'Business Permits & Licensing Office (BPLO)',
    scope: "Mayor's Permit applications, renewals, and regulatory compliance.",
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: BadgeCheck,
    name: 'Department of Trade and Industry',
    scope: 'Business name registration, MSME support, and consumer protection.',
    href: 'https://www.dti.gov.ph/',
    domain: 'dti.gov.ph',
  },
  {
    icon: Calculator,
    name: 'Bureau of Internal Revenue',
    scope: 'Tax registration, returns, and compliance for all businesses.',
    href: 'https://www.bir.gov.ph/',
    domain: 'bir.gov.ph',
  },
  {
    icon: Landmark,
    name: 'Securities and Exchange Commission',
    scope: 'Corporation, partnership, and association registration.',
    href: 'https://www.sec.gov.ph/',
    domain: 'sec.gov.ph',
  },
  {
    icon: Flame,
    name: 'Bureau of Fire Protection',
    scope: 'Fire safety inspection certificates and compliance.',
    href: 'https://bfp.gov.ph/',
    domain: 'bfp.gov.ph',
  },
  {
    icon: Stethoscope,
    name: 'City Health Office',
    scope: 'Sanitary permits, health certificates for food handlers.',
    href: 'https://cho.gensantos.gov.ph/',
    domain: 'cho.gensantos.gov.ph',
  },
];

// ---------- Helpful resources ----------

interface Resource {
  icon: LucideIcon;
  label: string;
  href: string;
}

const RESOURCES: Resource[] = [
  {
    icon: HandCoins,
    label: 'DTI Negosyo Center',
    href: 'https://www.dti.gov.ph/negosyo-center/',
  },
  {
    icon: TrendingUp,
    label: 'MSME Online Academy',
    href: 'https://academy.dti.gov.ph/',
  },
  {
    icon: FileText,
    label: 'BIR Forms & Downloads',
    href: 'https://www.bir.gov.ph/index.php/bir-forms.html',
  },
  {
    icon: Receipt,
    label: 'BIR ePayment Channels',
    href: 'https://www.bir.gov.ph/index.php/eservices/epayment.html',
  },
  {
    icon: Activity,
    label: 'PhilHealth Employer Reg',
    href: 'https://www.philhealth.gov.ph/employers/',
  },
  {
    icon: IdCard,
    label: 'SSS Employer Reg',
    href: 'https://www.sss.gov.ph/sss/appmanager/employer/employerHome',
  },
];

// ---------- Online services (Filipizen) — all 14 verified transactions ----------

type OnlineCategory = 'Business' | 'Tax & Payments' | 'Building & Occupancy' | 'Professional';

interface OnlineService {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
  category: OnlineCategory;
}

const ONLINE_CATEGORIES: OnlineCategory[] = [
  'Business',
  'Tax & Payments',
  'Building & Occupancy',
  'Professional',
];

const ONLINE_SERVICES: OnlineService[] = [
  { icon: Briefcase, title: 'New Business Application', description: "Apply for your first Mayor's Permit online.", href: 'https://www.filipizen.com/partners/gensan_gensan/bpls/newbusiness', cta: 'Apply now', category: 'Business' },
  { icon: RefreshCw, title: 'Renew Business Permit', description: "Renew your annual Mayor's Permit and pay Local Business Tax.", href: 'https://www.filipizen.com/partners/gensan_gensan/bpls/renewbusiness', cta: 'Renew now', category: 'Business' },
  { icon: Receipt, title: 'Business Billing & Payment', description: 'Pay outstanding BPLO billing statements.', href: 'https://www.filipizen.com/partners/gensan_gensan/bpls/billing', cta: 'Pay bill', category: 'Business' },
  { icon: Landmark, title: 'Realty Tax (RPT) Payment', description: 'Pay annual Real Property Tax online.', href: 'https://www.filipizen.com/partners/gensan_gensan/rptis/billing', cta: 'Pay RPT', category: 'Tax & Payments' },
  { icon: Receipt, title: 'Online Payment Order', description: 'Process a general payment order for city services.', href: 'https://www.filipizen.com/partners/gensan_gensan/po/billing', cta: 'Pay now', category: 'Tax & Payments' },
  { icon: ClipboardList, title: 'Building Permit Requirements', description: 'View documentary requirements for a building permit.', href: 'https://www.filipizen.com/partners/gensan_gensan/obo/requirement/building', cta: 'View', category: 'Building & Occupancy' },
  { icon: HardHat, title: 'Building Permit Application', description: 'File a building permit application online.', href: 'https://www.filipizen.com/partner/gensan_gensan/obo/bldgpermit', cta: 'Apply', category: 'Building & Occupancy' },
  { icon: FileText, title: 'Occupancy Certificate Requirements', description: 'View requirements for a certificate of occupancy.', href: 'https://www.filipizen.com/partners/gensan_gensan/obo/requirement/occupancy', cta: 'View', category: 'Building & Occupancy' },
  { icon: FileText, title: 'Occupancy Certificate Application', description: 'Apply for a certificate of occupancy online.', href: 'https://www.filipizen.com/partner/gensan_gensan/obo/occupancypermit', cta: 'Apply', category: 'Building & Occupancy' },
  { icon: Receipt, title: 'OSCP Billing & Payment', description: 'Pay outstanding OBO/OSCP billing statements.', href: 'https://www.filipizen.com/partners/gensan_gensan/obo/obobilling', cta: 'Pay', category: 'Building & Occupancy' },
  { icon: ClipboardList, title: 'Application Tracking', description: 'Track building permit or occupancy application status.', href: 'https://www.filipizen.com/partner/gensan_gensan/obo/apptracking', cta: 'Track', category: 'Building & Occupancy' },
  { icon: IdCard, title: 'Pay PTR (Professional Tax)', description: 'Pay your Professional Tax Receipt online.', href: 'https://www.filipizen.com/partner/gensan_gensan/obo/ptrbilling', cta: 'Pay PTR', category: 'Professional' },
  { icon: IdCard, title: 'Register Professional', description: 'Register as a licensed professional in GenSan.', href: 'https://www.filipizen.com/partner/gensan_gensan/obo/registerprofessionals', cta: 'Register', category: 'Professional' },
  { icon: IdCard, title: 'Update Professional Record', description: 'Update your professional registration details.', href: 'https://www.filipizen.com/partner/gensan_gensan/obo/updateprofessional', cta: 'Update', category: 'Professional' },
];

const PREFLIGHT_CHECKLIST = [
  'Working email address for account creation',
  'Active mobile number for OTP verification',
  'Previous year\'s permit and official receipts (for renewals)',
  'BIR Certificate of Registration (Form 2303)',
  'Gross sales / receipts figure for the preceding year',
  'Barangay clearance for business',
  'Scanned copies of all supporting documents (clear, legible PDFs)',
];

// ---------- Renewal timeline ----------

interface RenewalStep {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

const RENEWAL_STEPS: RenewalStep[] = [
  {
    number: '01',
    icon: ClipboardList,
    title: 'Gather requirements',
    body: 'Prepare your previous permit, gross sales declaration, barangay clearance, and BIR 2303. Start by December so you\'re ready in January.',
  },
  {
    number: '02',
    icon: Globe,
    title: 'File online or walk in',
    body: 'Submit your renewal through the Filipizen portal or visit the BPLO office during the January 1–20 renewal window.',
  },
  {
    number: '03',
    icon: BadgeCheck,
    title: 'Pay and claim your permit',
    body: 'Pay taxes and fees online or at the City Treasurer\'s office, then claim and post your renewed permit.',
  },
];

const Business: React.FC = () => {
  const [onlineCat, setOnlineCat] = useState<OnlineCategory>('Business');
  const heroRef = useReveal();
  const stepsHeadRef = useReveal();
  const stepsGridRef = useReveal<HTMLOListElement>();
  const permitsHeadRef = useReveal();
  const permitsGridRef = useReveal();
  const onlineHeadRef = useReveal();
  const onlineGridRef = useReveal();
  const reqHeadRef = useReveal();
  const officesHeadRef = useReveal();
  const officesGridRef = useReveal();

  return (
    <>
      <SEO
        title="Business Permits & Registration — General Santos City (Online via Filipizen) 2026"
        description="How to start, register, or renew a business in General Santos City. Apply for your Mayor's Permit online via Filipizen or walk in at the BPLO. Complete guide to permits, fees, timelines, and requirements."
        keywords="gensan business permit, mayor's permit gensan, eboss gensan, online business permit general santos, bplo gensan, dti registration, bir tin, renew business permit gensan, filipizen gensan, negosyo gensan, paano mag-renew ng business permit sa gensan"
        path="/services/business"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'GovernmentService',
          name: "Mayor's Permit / Business Permit — General Santos City",
          serviceType: 'Business Permit Application and Renewal',
          provider: {
            '@type': 'GovernmentOrganization',
            name: 'Business Permits & Licensing Office (BPLO)',
            address: {
              '@type': 'PostalAddress',
              addressLocality: 'General Santos City',
              addressRegion: 'Region XII',
              addressCountry: 'PH',
            },
            telephone: '0951 828 1852',
          },
          areaServed: {
            '@type': 'City',
            name: 'General Santos City',
          },
          availableChannel: [
            {
              '@type': 'ServiceChannel',
              serviceUrl:
                'https://www.filipizen.com/partners/gensan_gensan/bpls/newbusiness',
              name: 'Filipizen Online Portal',
            },
            {
              '@type': 'ServiceChannel',
              serviceUrl: 'https://gensantos.gov.ph/',
              name: 'BPLO Walk-in Office',
            },
          ],
        }}
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div ref={heroRef} className="reveal mx-auto max-w-[1100px] px-4" style={{ animation: 'fade-up var(--dur-slow) var(--ease-out-quart) both' } as React.CSSProperties}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Business' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Briefcase className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                For Entrepreneurs
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Business & Permits
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Permits, registrations, and clearances every General Santos
                City business needs — from sole proprietorship to
                corporation. You can now apply for or renew your Mayor's
                Permit online through the city's Filipizen portal, or walk
                in at the BPLO.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="#apply-online"
                  onClick={e => {
                    e.preventDefault();
                    document.getElementById('apply-online')?.scrollIntoView({ behavior: 'smooth' });
                  }}
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Apply Online
                </a>
                <a
                  href="https://bnrs.dti.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Register on DTI BNRS
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Quick start steps ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={stepsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Hash}
          eyebrow="From idea to first sale"
          title="Start a business in 5 steps"
          helper="The standard registration path for most General Santos City businesses."
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
                {step.linkHref && (
                  <>
                    {' '}
                    <a
                      href={step.linkHref}
                      className="font-semibold text-primary-700 hover:text-primary-800"
                    >
                      {step.linkLabel}
                    </a>
                  </>
                )}
              </p>
            </li>
          ))}
        </ol>

        <p className="mt-4 text-xs italic text-gray-500">
          Order may vary slightly depending on business type (corporations,
          regulated industries, and franchises may have additional steps).
        </p>
      </PageSection>

      {/* ---------- Permits & Registrations grid ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={permitsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Stamp}
          eyebrow="Most requested"
          title="Permits & Registrations"
          helper="Seven core documents most General Santos City businesses need, color-coded by issuing level (Barangay, City, or National). Each card shows official fees and processing times."
        />
        </div>

        <div ref={permitsGridRef} className="reveal grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {PERMITS.map(p => (
            <article
              key={p.title}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
            >
              <div className="mb-4 flex items-center justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                  <p.icon className="h-5 w-5" />
                </div>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${PERMIT_BADGE_TONE[p.kind]}`}
                >
                  {p.kind}
                </span>
              </div>
              <h3 className="text-base font-semibold leading-snug text-gray-900">
                {p.title}
              </h3>
              <p className="mt-1.5 text-[11px] font-semibold uppercase tracking-[0.1em] text-primary-700">
                {p.issuer}
              </p>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">
                {p.body}
              </p>

              {/* Fees, timeline & mode strip */}
              <dl
                className={`mt-4 grid gap-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5 ${p.mode ? 'grid-cols-3' : 'grid-cols-2'}`}
              >
                <div>
                  <dt className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                    Fee
                  </dt>
                  <dd className="text-[11px] font-medium text-gray-900">
                    {p.cost}
                  </dd>
                </div>
                <div>
                  <dt className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                    Timeline
                  </dt>
                  <dd className="text-[11px] font-medium text-gray-900">
                    {p.timeline}
                  </dd>
                </div>
                {p.mode && (
                  <div>
                    <dt className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
                      Mode
                    </dt>
                    <dd className="text-[11px] font-medium text-gray-900">
                      {p.mode}
                    </dd>
                  </div>
                )}
              </dl>

              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white transition-[background-color] duration-[var(--dur-fast)] hover:bg-primary-700"
                >
                  {p.cta}
                  <ExternalLink className="h-3.5 w-3.5 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </a>
                {p.secondaryHref && (
                  <a
                    href={p.secondaryHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-semibold text-gray-700 transition-[border-color,background-color,color] duration-[var(--dur-fast)] hover:border-primary-200 hover:bg-primary-50 hover:text-primary-700"
                  >
                    {p.secondaryCta}
                    <ExternalLink className="h-3.5 w-3.5 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                  </a>
                )}
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      {/* ---------- Online Services via Filipizen (14 transactions) ---------- */}
      <PageSection background="tinted" tier="secondary" id="apply-online">
        <div ref={onlineHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Globe}
          eyebrow="Skip the line · 14 services"
          title="Online Services via Filipizen"
          helper="Apply, renew, and pay online — business permits, real property tax, building permits, and professional registrations. All transactions route to the official Filipizen portal."
        />
        </div>

        <div ref={onlineGridRef} className="reveal" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {/* Category tabs */}
          <div className="mb-4 flex flex-wrap gap-1.5">
            {ONLINE_CATEGORIES.map(cat => {
              const count = ONLINE_SERVICES.filter(s => s.category === cat).length;
              return (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setOnlineCat(cat)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-semibold transition-[background-color,color,border-color] duration-[var(--dur-fast)] ${
                    onlineCat === cat
                      ? 'bg-primary-600 text-white'
                      : 'border border-gray-200 bg-white text-gray-600 hover:border-primary-200 hover:bg-primary-50'
                  }`}
                >
                  {cat}
                  <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                    onlineCat === cat
                      ? 'bg-white/20 text-white'
                      : 'bg-gray-100 text-gray-500'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Service rows for active category */}
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-200 bg-white">
            {ONLINE_SERVICES.filter(s => s.category === onlineCat).map(s => (
              <a
                key={s.title}
                href={s.href}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-center gap-3 px-4 py-3 transition-colors duration-[var(--dur-fast)] hover:bg-primary-50/30"
              >
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white ring-1 ring-primary-700">
                  <s.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                    {s.title}
                  </h4>
                  <p className="mt-0.5 text-[11px] text-gray-500">{s.description}</p>
                </div>
                <span className="hidden shrink-0 items-center gap-1 text-[11px] font-semibold text-primary-700 sm:inline-flex">
                  {s.cta}
                  <ExternalLink className="h-3 w-3 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5" />
                </span>
                <ExternalLink className="h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-[var(--dur-fast)] group-hover:text-primary-600 sm:hidden" />
              </a>
            ))}
          </div>

          {/* Compact checklist + fallback */}
          <details className="mt-4 rounded-xl border border-gray-200 bg-white">
            <summary className="cursor-pointer px-4 py-3 text-sm font-semibold text-gray-900 hover:text-primary-700">
              What you need before applying online
            </summary>
            <ul className="space-y-1.5 border-t border-gray-100 px-4 py-3">
              {PREFLIGHT_CHECKLIST.map(item => (
                <li key={item} className="flex items-start gap-2 text-[13px] text-gray-700">
                  <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary-600" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </details>

          <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <strong>Prefer walk-in?</strong> You can still apply or renew in
            person at the relevant city office. Visit the BPLO for business
            permits, the City Treasurer for tax payments, or the OBO for
            building permits.
          </div>
        </div>

        {/* ---------- Renewal mini-section ---------- */}
        <div className="mt-10">
          <SectionHeading
            tier="secondary"
            icon={CalendarClock}
            eyebrow="Annual deadline"
            title="Renewing your business permit?"
            helper="All General Santos City businesses must renew their Mayor's Permit every January. Here's the renewal path in 3 steps."
          />

          <ol className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {RENEWAL_STEPS.map(step => (
              <li
                key={step.number}
                className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
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

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <strong>Deadline:</strong> January 20 every year. Late
              filings incur a 25% surcharge plus 2% monthly interest on
              unpaid taxes (Local Government Code, Sec. 168).
            </div>
            <Link
              to="/services/business/renew-permits-and-pay-local-business-taxes"
              className="group flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs font-medium text-gray-700 transition hover:border-primary-400 hover:text-primary-700"
            >
              <FileText className="h-4 w-4 shrink-0 text-primary-600" />
              <span className="flex-1">
                Full renewal guide with checklist
              </span>
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary-700" />
            </Link>
          </div>
        </div>
      </PageSection>

      {/* ---------- Common requirements + helpful resources ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={reqHeadRef} className="reveal grid gap-6 lg:grid-cols-2">
          {/* Requirements list */}
          <div>
            <SectionHeading
              tier="secondary"
              icon={ClipboardList}
              eyebrow="Bring these"
              title="Common requirements"
              helper="Documents most permits will ask for — prepare these first."
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

          {/* Helpful resources */}
          <div>
            <SectionHeading
              tier="secondary"
              icon={FileSpreadsheet}
              eyebrow="More tools"
              title="Helpful resources"
              helper="Free MSME training, BIR forms, and employer registration portals."
            />
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {RESOURCES.map(r => (
                <a
                  key={r.label}
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-center gap-2.5 rounded-xl border border-gray-200 bg-white p-3 shadow-sm shadow-gray-900/[0.04] transition-[border-color,background-color] duration-[var(--dur-fast)] hover:border-primary-200 hover:bg-primary-50"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white ring-1 ring-primary-700">
                    <r.icon className="h-4 w-4" />
                  </div>
                  <span className="flex-1 text-xs font-medium text-gray-900 group-hover:text-primary-700">
                    {r.label}
                  </span>
                  <ExternalLink className="h-3 w-3 shrink-0 text-gray-400 group-hover:text-primary-700" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </PageSection>

      {/* ---------- Responsible Offices ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={officesHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Building2}
          eyebrow="Where to go"
          title="Responsible Offices"
          helper="Government offices and official portals that handle business registration in General Santos City."
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
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <strong>Heads up:</strong> Always confirm fees and requirements
            with the official portal before paying. BetterGensan does not
            collect payments, accept documents, or process applications.
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700">
            <Phone className="h-4 w-4 shrink-0 text-primary-600" />
            <span>
              <strong>BPLO Hotline:</strong>{' '}
              <a
                href="tel:+639518281852"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                0951 828 1852
              </a>
            </span>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default Business;
