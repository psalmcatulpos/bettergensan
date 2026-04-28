// /eboss — Online Government Services hub for General Santos City.
//
// SEO-focused landing page that captures "eBOSS GenSan" and related search
// queries. Lists all 14 verified Filipizen transactions available for GenSan.
// The page title uses "Online Government Services" (not "eBOSS") since the
// relationship between eBOSS and Filipizen is unconfirmed — eBOSS appears
// only in meta tags and as brief contextual mention in body copy.
//
// Pure information page. Every link goes to the official Filipizen portal —
// BetterGensan never collects payments, forms, or documents.

import {
  ArrowRight,
  Briefcase,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileCheck,
  Globe,
  HardHat,
  Home,
  IdCard,
  Landmark,
  Phone,
  Receipt,
  RefreshCw,
  Search,
  UserCog,
  UserPlus,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

// ---------- Transaction data ----------

type TransactionCategory =
  | 'Business'
  | 'Tax & Payments'
  | 'Building & Occupancy'
  | 'Professional';

interface Transaction {
  icon: LucideIcon;
  title: string;
  description: string;
  href: string;
  cta: string;
  category: TransactionCategory;
}

const TRANSACTIONS: Transaction[] = [
  // ----- Business -----
  {
    icon: Briefcase,
    title: 'New Business Application',
    description:
      "Apply for your first Mayor's Permit in General Santos City online.",
    href: 'https://www.filipizen.com/partners/gensan_gensan/bpls/newbusiness',
    cta: 'Apply now',
    category: 'Business',
  },
  {
    icon: RefreshCw,
    title: 'Renew Business Permit',
    description:
      "Renew your annual Mayor's Permit and pay Local Business Tax online.",
    href: 'https://www.filipizen.com/partners/gensan_gensan/bpls/renewbusiness',
    cta: 'Renew now',
    category: 'Business',
  },
  {
    icon: Receipt,
    title: 'Business Billing & Payment',
    description:
      'Look up and pay outstanding BPLO billing statements for General Santos City online.',
    href: 'https://www.filipizen.com/partners/gensan_gensan/bpls/billing',
    cta: 'Pay bill',
    category: 'Business',
  },

  // ----- Tax & Payments -----
  {
    icon: Landmark,
    title: 'Realty Tax (RPT) Billing & Payment',
    description:
      'Pay annual Real Property Tax for land and improvements in General Santos City online.',
    href: 'https://www.filipizen.com/partners/gensan_gensan/rptis/billing',
    cta: 'Pay RPT',
    category: 'Tax & Payments',
  },
  {
    icon: CreditCard,
    title: 'Online Payment Order',
    description:
      'Process a general payment order for General Santos City government services online.',
    href: 'https://www.filipizen.com/partners/gensan_gensan/po/billing',
    cta: 'Pay now',
    category: 'Tax & Payments',
  },

  // ----- Building & Occupancy -----
  {
    icon: ClipboardList,
    title: 'Building Permit Requirements',
    description:
      'View the documentary requirements for a building permit application in General Santos City.',
    href: 'https://www.filipizen.com/partners/gensan_gensan/obo/requirement/building',
    cta: 'View requirements',
    category: 'Building & Occupancy',
  },
  {
    icon: HardHat,
    title: 'Building Permit Application',
    description:
      'File a building permit application for General Santos City online.',
    href: 'https://www.filipizen.com/partner/gensan_gensan/obo/bldgpermit',
    cta: 'Apply now',
    category: 'Building & Occupancy',
  },
  {
    icon: FileCheck,
    title: 'Certificate of Occupancy Requirements',
    description:
      'View the requirements for a certificate of occupancy in General Santos City.',
    href: 'https://www.filipizen.com/partners/gensan_gensan/obo/requirement/occupancy',
    cta: 'View requirements',
    category: 'Building & Occupancy',
  },
  {
    icon: Home,
    title: 'Certificate of Occupancy Application',
    description:
      'Apply for a certificate of occupancy for your building in General Santos City online.',
    href: 'https://www.filipizen.com/partner/gensan_gensan/obo/occupancypermit',
    cta: 'Apply now',
    category: 'Building & Occupancy',
  },
  {
    icon: Receipt,
    title: 'OSCP Billing & Payment',
    description:
      'Pay outstanding OBO/OSCP billing statements for General Santos City online.',
    href: 'https://www.filipizen.com/partners/gensan_gensan/obo/obobilling',
    cta: 'Pay bill',
    category: 'Building & Occupancy',
  },
  {
    icon: Search,
    title: 'Application Tracking',
    description:
      'Track the status of your building permit or occupancy application in General Santos City.',
    href: 'https://www.filipizen.com/partner/gensan_gensan/obo/apptracking',
    cta: 'Track application',
    category: 'Building & Occupancy',
  },

  // ----- Professional -----
  {
    icon: IdCard,
    title: 'Pay PTR (Professional Tax Receipt)',
    description:
      'Pay your Professional Tax Receipt for practicing in General Santos City online.',
    href: 'https://www.filipizen.com/partner/gensan_gensan/obo/ptrbilling',
    cta: 'Pay PTR',
    category: 'Professional',
  },
  {
    icon: UserPlus,
    title: 'Register Professional',
    description:
      'Register as a licensed professional practicing in General Santos City.',
    href: 'https://www.filipizen.com/partner/gensan_gensan/obo/registerprofessionals',
    cta: 'Register',
    category: 'Professional',
  },
  {
    icon: UserCog,
    title: 'Update Professional Record',
    description:
      'Update your professional registration details for General Santos City.',
    href: 'https://www.filipizen.com/partner/gensan_gensan/obo/updateprofessional',
    cta: 'Update record',
    category: 'Professional',
  },
];

const CATEGORIES: TransactionCategory[] = [
  'Business',
  'Tax & Payments',
  'Building & Occupancy',
  'Professional',
];

const CATEGORY_TONE: Record<TransactionCategory, string> = {
  Business: 'border-primary-200 bg-primary-50 text-primary-700',
  'Tax & Payments': 'border-amber-200 bg-amber-50 text-amber-800',
  'Building & Occupancy':
    'border-emerald-200 bg-emerald-50 text-emerald-800',
  Professional: 'border-violet-200 bg-violet-50 text-violet-800',
};

// ---------- Pre-flight checklist ----------

const PREFLIGHT_ITEMS = [
  'Working email address for account creation',
  'Active mobile number for OTP verification',
  'Valid government-issued ID',
  'Scanned copies of required documents (clear, legible PDFs)',
  'Digital payment method (GCash, Maya, or online banking)',
  'Previous permits and official receipts (for renewals)',
  'BIR Certificate of Registration — Form 2303 (for business permits)',
  'Gross sales / receipts figure for the preceding year (for business renewals)',
  'Barangay clearance (for business permits)',
  'Approved building plans and structural design (for building permits)',
];

// ---------- Component ----------

const Eboss: React.FC = () => {
  return (
    <>
      <SEO
        title="Online Government Services GenSan — Business Permits, Tax Payments & More (eBOSS)"
        description="Apply for or renew your Mayor's Permit, pay Real Property Tax, file building permits, and access 14 government services online in General Santos City through the Filipizen portal."
        keywords="eboss gensan, filipizen general santos, online business permit gensan, renew business permit general santos, pay rpt gensan online, building permit gensan online, mayors permit online, bplo gensan, negosyo gensan, paano mag-apply ng business permit, online government services gensan"
        path="/eboss"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'HowTo',
            name: 'How to apply for a business permit online in General Santos City',
            description:
              "Step-by-step guide to applying for a Mayor's Permit online in General Santos City through the Filipizen portal.",
            step: [
              {
                '@type': 'HowToStep',
                name: 'Visit the Filipizen portal',
                text: 'Go to filipizen.com and select General Santos City as your local government unit.',
              },
              {
                '@type': 'HowToStep',
                name: 'Choose your transaction',
                text: 'Select New Business Application, Renewal, Billing, or another available service.',
              },
              {
                '@type': 'HowToStep',
                name: 'Fill in details and upload documents',
                text: 'Complete the online form and upload scanned copies of your requirements.',
              },
              {
                '@type': 'HowToStep',
                name: 'Pay online',
                text: 'Pay the assessed fees via GCash, Maya, or online banking.',
              },
              {
                '@type': 'HowToStep',
                name: 'Receive your permit',
                text: 'Download your permit or pick it up at the issuing office as instructed.',
              },
            ],
          },
          {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: [
              {
                '@type': 'Question',
                name: 'How do I apply for a business permit online in General Santos City?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Visit the Filipizen portal at filipizen.com, select General Santos City, choose 'New Business Application', fill in the required details, upload your documents, and pay the assessed fees online.",
                },
              },
              {
                '@type': 'Question',
                name: 'What online government services are available in GenSan?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: 'General Santos City offers 14 online services through Filipizen including new business applications, business permit renewals, real property tax payments, building permit applications, certificate of occupancy, professional tax receipts, and more.',
                },
              },
              {
                '@type': 'Question',
                name: 'Do I still need to visit the BPLO office in person?',
                acceptedAnswer: {
                  '@type': 'Answer',
                  text: "Many transactions can be completed fully online through the Filipizen portal. However, some services may still require a walk-in visit for document verification or permit release. If the online portal is unavailable, you can always apply in person at the BPLO or the relevant city office.",
                },
              },
            ],
          },
        ]}
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Online Services' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Globe className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Skip the line
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Online Government Services
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                General Santos City residents can now access permits, tax
                payments, building services, and professional registrations
                online through the city's Filipizen portal — sometimes
                referred to as eBOSS (Electronic Business One-Stop Shop).
                Paano mag-apply ng business permit online sa GenSan —
                piliin lang ang transaction sa baba at sundan ang mga
                steps.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://www.filipizen.com/partners/gensan_gensan"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Open Filipizen Portal
                </a>
                <Link
                  to="/services/business"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Full business permit guide
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Available transactions ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={ClipboardList}
          eyebrow="14 services available"
          title="Available online transactions"
          helper="All verified online services for General Santos City on the Filipizen portal. Each card links directly to the transaction page."
        />

        {CATEGORIES.map(cat => {
          const items = TRANSACTIONS.filter(t => t.category === cat);
          return (
            <div key={cat} className="mb-8 last:mb-0">
              <span
                className={`mb-3 inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider ${CATEGORY_TONE[cat]}`}
              >
                {cat}
              </span>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {items.map(t => (
                  <a
                    key={t.title}
                    href={t.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                  >
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                      <t.icon className="h-5 w-5" />
                    </div>
                    <h3 className="text-sm font-semibold leading-snug text-gray-900 group-hover:text-primary-700">
                      {t.title}
                    </h3>
                    <p className="mt-1.5 flex-grow text-xs leading-relaxed text-gray-600">
                      {t.description}
                    </p>
                    <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 group-hover:text-primary-800">
                      {t.cta}
                      <ExternalLink className="h-3 w-3 transition group-hover:translate-x-0.5" />
                    </span>
                  </a>
                ))}
              </div>
            </div>
          );
        })}
      </PageSection>

      {/* ---------- What you need + fallback ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={CheckCircle2}
          eyebrow="Prepare these"
          title="What you need before applying online"
          helper="General requirements for most online transactions. Specific services may ask for additional documents."
        />

        <ul className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]">
          {PREFLIGHT_ITEMS.map(item => (
            <li
              key={item}
              className="flex items-start gap-2 text-sm text-gray-700"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <strong>Portal not working?</strong> You can still apply in
            person at the relevant city office. Visit the BPLO for
            business permits, the City Treasurer for tax payments, or the
            OBO for building permits.
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700">
            <Phone className="h-4 w-4 shrink-0 text-primary-600" />
            <span>
              <strong>BPLO Hotline:</strong>{' '}
              <a
                href="tel:+63835522986"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                (083) 552-2986
              </a>
            </span>
          </div>
        </div>
      </PageSection>

      {/* ---------- Cross-links ---------- */}
      <PageSection background="white" tier="utility">
        <SectionHeading
          tier="utility"
          icon={Building2}
          eyebrow="Related guides"
          title="Learn more"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <Link
            to="/services/business"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Briefcase className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                Business & Permits Guide
              </h3>
              <p className="mt-0.5 text-xs text-gray-600">
                Complete guide to starting a business in General Santos
                City — permits, fees, timelines, and requirements.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary-700" />
          </Link>

          <Link
            to="/services/tax-payments"
            className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <h3 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                Tax Payments Guide
              </h3>
              <p className="mt-0.5 text-xs text-gray-600">
                Real property tax, local business tax, cedula, national
                taxes, and all payment channels.
              </p>
            </div>
            <ArrowRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:translate-x-0.5 group-hover:text-primary-700" />
          </Link>
        </div>
      </PageSection>
    </>
  );
};

export default Eboss;
