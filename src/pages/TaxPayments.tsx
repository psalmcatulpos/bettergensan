// /services/tax-payments — dedicated Tax Payments page for General Santos
// City. Goes deeper than the registry-driven ServiceCategory pages with a
// 5-step path, the 6 most-relevant local + national taxes (with rates, base,
// deadlines, and forms), a 12-month tax calendar, the official filing &
// payment channels, and the responsible offices.
//
// Pure information page. Every link points to an official BIR or LGU portal —
// BetterGensan never collects payments, accepts forms, or processes returns.
//
// Sources cross-checked against BIR (bir.gov.ph), TRAIN/CREATE/CREATE MORE
// rate tables, the Local Government Code, and the GenSan City Treasurer's
// public schedule. Where rates depend on classification, the page describes
// the principle and links straight to the official rate table — it does not
// invent numbers.

import {
  AlertTriangle,
  BadgeCheck,
  Banknote,
  Briefcase,
  Building2,
  Calculator,
  Calendar,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FileSpreadsheet,
  FileText,
  Globe,
  Hash,
  IdCard,
  Landmark,
  Phone,
  PiggyBank,
  Receipt,
  Scale,
  ShieldCheck,
  Smartphone,
  TrendingUp,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';
import useReveal from '../hooks/useReveal';

// ---------- 5-step quick start ----------

interface Step {
  number: string;
  icon: LucideIcon;
  title: string;
  body: string;
}

const STEPS: Step[] = [
  {
    number: '01',
    icon: IdCard,
    title: 'Get a TIN (Tax Identification Number)',
    body: 'Register with BIR via the Online Registration and Update System (ORUS). Required for any taxpayer — individual, self-employed, or business.',
  },
  {
    number: '02',
    icon: BadgeCheck,
    title: 'Register your business or property',
    body: 'Sole props register with DTI, corps with SEC, then BIR for Form 2303. Property owners declare with the City Assessor.',
  },
  {
    number: '03',
    icon: ClipboardList,
    title: 'Know which forms apply to you',
    body: 'Compensation earners file 1700; self-employed/mixed file 1701/1701A; corps file 1702; VAT-registered file 2550Q; landowners pay RPT.',
  },
  {
    number: '04',
    icon: FileText,
    title: 'File on time (online or in-branch)',
    body: 'Use eBIRForms (free) or eFPS (mandatory for large taxpayers). Local taxes are filed at the City Treasurer\'s Office.',
  },
  {
    number: '05',
    icon: CreditCard,
    title: 'Pay through accredited channels',
    body: 'Pay BIR via LandBank LinkBiz, DBP Pay Tax Online, GCash, Maya, BancNet, or any Authorized Agent Bank. Pay LGU taxes at the City Treasurer or via city e-payment portals.',
  },
];

// ---------- The 6 main taxes ----------

interface Tax {
  icon: LucideIcon;
  scope: 'Local · LGU' | 'National · BIR';
  title: string;
  body: string;
  rate: string;
  deadline: string;
  href: string;
  cta: string;
}

// Local taxes — collected by the City of General Santos via the City
// Treasurer's Office. Authority: Local Government Code (RA 7160).
const LOCAL_TAXES: Tax[] = [
  {
    icon: Building2,
    scope: 'Local · LGU',
    title: 'Real Property Tax (RPT)',
    body: 'Annual tax on land, buildings, and machinery within General Santos City. Cities collect both the basic tax and the Special Education Fund (SEF). Discounts apply for early or full-year payment. You can also pay RPT online via the Filipizen portal.',
    rate: 'Up to 2% of assessed value (1% basic + 1% SEF, per LGC)',
    deadline: 'Mar 31 for full-year discount · or quarterly (Mar 31 / Jun 30 / Sep 30 / Dec 31)',
    href: 'https://www.filipizen.com/partners/gensan_gensan/rptis/billing',
    cta: 'Pay RPT online',
  },
  {
    icon: Briefcase,
    scope: 'Local · LGU',
    title: 'Local Business Tax',
    body: 'Annual local business tax based on gross receipts of the previous year. Rates and brackets follow the city\'s Revenue Code and the Local Government Code schedule for the business classification (manufacturer, wholesaler, retailer, contractor, etc.).',
    rate: 'Graduated rates per LGC § 143 — varies by classification & gross receipts',
    deadline: 'Jan 20 (annual) or quarterly with the Mayor\'s Permit',
    href: 'https://gensantos.gov.ph/',
    cta: 'Pay at City Treasurer',
  },
  {
    icon: IdCard,
    scope: 'Local · LGU',
    title: 'Community Tax Certificate (Cedula)',
    body: 'Required for many government transactions and contracts. Issued by the city or barangay treasurer based on income, business gross receipts, or real property holdings.',
    rate: '₱5 basic + ₱1 per ₱1,000 of income or property (max ₱5,000 per LGC)',
    deadline: 'On or before Feb 28 each year',
    href: 'https://gensantos.gov.ph/',
    cta: 'Get cedula',
  },
];

// National taxes — collected by the Bureau of Internal Revenue (BIR).
// Authority: National Internal Revenue Code (RA 8424, as amended by TRAIN
// Law and CREATE Act). These are NOT city taxes — the LGU does not collect
// them, and they apply uniformly across the Philippines.
const NATIONAL_TAXES: Tax[] = [
  {
    icon: TrendingUp,
    scope: 'National · BIR',
    title: 'Income Tax',
    body: 'National tax on individual and corporate income. Individuals use the TRAIN Law graduated table (₱250K exempt). Corporations are 25% regular, or 20% for small corporations with net taxable income ≤ ₱5M and total assets ≤ ₱100M (CREATE Act).',
    rate: 'Individuals: 0%–35% graduated · Corp: 25% regular / 20% small',
    deadline: 'Annual return: Apr 15 · Quarterly: May 15, Aug 15, Nov 15',
    href: 'https://www.bir.gov.ph/index.php/eservices.html',
    cta: 'File on eBIRForms',
  },
  {
    icon: Receipt,
    scope: 'National · BIR',
    title: 'Value Added Tax (VAT)',
    body: 'Indirect tax on the sale of goods and services. Mandatory for businesses whose gross annual sales exceed the VAT threshold (currently ₱3M). VAT-registered taxpayers file quarterly (Form 2550Q).',
    rate: '12% of gross selling price or gross receipts',
    deadline: 'Quarterly: 25th day after the quarter (BIR Form 2550Q)',
    href: 'https://www.bir.gov.ph/index.php/tax-information/value-added-tax.html',
    cta: 'Read VAT rules',
  },
  {
    icon: Hash,
    scope: 'National · BIR',
    title: 'Withholding Tax',
    body: 'Tax withheld at source on compensation, professional fees, rentals, and other payments. Employers file monthly (1601-C for compensation, 1601-EQ for expanded) and an annual return (1604-C / 1604-E).',
    rate: 'Compensation: per BIR table · Expanded: 1%–15% by payment type',
    deadline: 'Monthly: 10th of next month (manual) · Annual 1604-C: Jan 31',
    href: 'https://www.bir.gov.ph/index.php/tax-information/withholding-tax.html',
    cta: 'Read withholding rules',
  },
];

// ---------- Tax calendar ----------

interface CalendarEntry {
  month: string;
  day: string;
  title: string;
  detail: string;
  scope: 'Local' | 'National';
}

const CALENDAR: CalendarEntry[] = [
  {
    month: 'Jan',
    day: '20',
    title: "Mayor's Permit & Business Tax",
    detail: 'Annual renewal at BPLO and the City Treasurer.',
    scope: 'Local',
  },
  {
    month: 'Jan',
    day: '31',
    title: 'BIR Form 1604-C',
    detail: 'Annual withholding return on compensation (employers).',
    scope: 'National',
  },
  {
    month: 'Feb',
    day: '28',
    title: 'Cedula deadline',
    detail: 'Community Tax Certificate due for the year.',
    scope: 'Local',
  },
  {
    month: 'Mar',
    day: '01',
    title: 'BIR Form 1604-E',
    detail: 'Annual information return on expanded withholding tax.',
    scope: 'National',
  },
  {
    month: 'Mar',
    day: '31',
    title: 'Real Property Tax (full year)',
    detail: 'Pay full year by Mar 31 for max discount, or pay Q1.',
    scope: 'Local',
  },
  {
    month: 'Apr',
    day: '15',
    title: 'Annual Income Tax Return',
    detail: 'BIR Forms 1700 / 1701 / 1701A / 1702 — individuals and corporations.',
    scope: 'National',
  },
  {
    month: 'May',
    day: '15',
    title: 'Quarterly Income Tax Q1',
    detail: 'BIR Form 1701Q / 1702Q for self-employed and corporations.',
    scope: 'National',
  },
  {
    month: 'Jun',
    day: '30',
    title: 'Real Property Tax Q2',
    detail: 'Second quarter installment due.',
    scope: 'Local',
  },
  {
    month: 'Aug',
    day: '15',
    title: 'Quarterly Income Tax Q2',
    detail: 'BIR Form 1701Q / 1702Q.',
    scope: 'National',
  },
  {
    month: 'Sep',
    day: '30',
    title: 'Real Property Tax Q3',
    detail: 'Third quarter installment due.',
    scope: 'Local',
  },
  {
    month: 'Nov',
    day: '15',
    title: 'Quarterly Income Tax Q3',
    detail: 'BIR Form 1701Q / 1702Q.',
    scope: 'National',
  },
  {
    month: 'Dec',
    day: '31',
    title: 'Real Property Tax Q4',
    detail: 'Final quarter installment due.',
    scope: 'Local',
  },
];

// ---------- Filing & payment channels ----------

interface Channel {
  icon: LucideIcon;
  label: string;
  body: string;
  href: string;
  domain: string;
}

const FILING_CHANNELS: Channel[] = [
  {
    icon: Globe,
    label: 'BIR ORUS',
    body: 'Online Registration and Update System — TIN, Form 2303, address & RDO updates.',
    href: 'https://orus.bir.gov.ph/',
    domain: 'orus.bir.gov.ph',
  },
  {
    icon: FileText,
    label: 'eBIRForms',
    body: 'Free downloadable software for filing most BIR returns. Submit via the Online eBIRForms System.',
    href: 'https://www.bir.gov.ph/index.php/eservices/ebirforms.html',
    domain: 'bir.gov.ph',
  },
  {
    icon: FileSpreadsheet,
    label: 'eFPS',
    body: 'Electronic Filing and Payment System — mandatory for large taxpayers and select industries.',
    href: 'https://efps.bir.gov.ph/',
    domain: 'efps.bir.gov.ph',
  },
  {
    icon: ClipboardList,
    label: 'eAFS',
    body: 'Electronic Audited Financial Statements submission portal.',
    href: 'https://eafs.bir.gov.ph/',
    domain: 'eafs.bir.gov.ph',
  },
];

const PAYMENT_CHANNELS: Channel[] = [
  {
    icon: Landmark,
    label: 'LandBank LinkBiz Portal',
    body: 'Official BIR payment channel. Pay BIR returns from any bank account or via debit/credit.',
    href: 'https://www.lbp-eservices.com/egps/portal/index.jsp',
    domain: 'lbp-eservices.com',
  },
  {
    icon: PiggyBank,
    label: 'DBP Pay Tax Online',
    body: 'Development Bank of the Philippines online tax payment service.',
    href: 'https://www.dbp.ph/',
    domain: 'dbp.ph',
  },
  {
    icon: Smartphone,
    label: 'GCash Bills Payment',
    body: 'Pay BIR taxes through the GCash app under Bills → Government → BIR.',
    href: 'https://www.gcash.com/',
    domain: 'gcash.com',
  },
  {
    icon: Wallet,
    label: 'Maya Bills',
    body: 'Pay BIR taxes through the Maya app under Pay Bills → Government → BIR.',
    href: 'https://www.maya.ph/',
    domain: 'maya.ph',
  },
  {
    icon: CreditCard,
    label: 'BancNet ePayment',
    body: 'Pay BIR taxes through any BancNet member bank\'s online banking facility.',
    href: 'https://www.bancnetonline.com/',
    domain: 'bancnetonline.com',
  },
  {
    icon: Banknote,
    label: 'Authorized Agent Banks (AABs)',
    body: 'Over-the-counter BIR payment at any Authorized Agent Bank in the RDO\'s jurisdiction.',
    href: 'https://www.bir.gov.ph/index.php/contact-us/directory/authorized-agent-banks.html',
    domain: 'bir.gov.ph',
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
    icon: Banknote,
    name: "City Treasurer's Office — GenSan",
    scope: 'Real property tax, local business tax, cedula, and other LGU taxes.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: ClipboardList,
    name: "City Assessor's Office — GenSan",
    scope: 'Real property valuation, tax declarations, and assessment records.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Briefcase,
    name: 'Business Permits & Licensing Office (BPLO)',
    scope: 'Business permit applications and renewals (linked to local business tax).',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Calculator,
    name: 'Bureau of Internal Revenue',
    scope: 'National taxes — income, VAT, withholding, estate, donor\'s, and DST.',
    href: 'https://www.bir.gov.ph/',
    domain: 'bir.gov.ph',
  },
  {
    icon: Globe,
    name: 'BIR RDO 110 — General Santos City',
    scope: 'Revenue District Office serving General Santos City taxpayers.',
    href: 'https://www.bir.gov.ph/index.php/contact-us/directory/regional-and-district-offices.html',
    domain: 'bir.gov.ph',
  },
  {
    icon: Scale,
    name: 'Bureau of the Treasury',
    scope: 'National treasury, government securities, and deposit administration.',
    href: 'https://www.treasury.gov.ph/',
    domain: 'treasury.gov.ph',
  },
];

// ---------- Useful BIR forms ----------

const BIR_FORMS = [
  { code: '1700', title: 'Annual ITR — pure compensation earner' },
  { code: '1701', title: 'Annual ITR — self-employed / mixed income' },
  { code: '1701A', title: 'Annual ITR — purely 8% / OSD self-employed' },
  { code: '1701Q', title: 'Quarterly ITR — self-employed / mixed' },
  { code: '1702-RT', title: 'Annual ITR — corporation, regular rate' },
  { code: '1702Q', title: 'Quarterly ITR — corporation' },
  { code: '2550Q', title: 'Quarterly VAT return' },
  { code: '2551Q', title: 'Quarterly Percentage Tax return' },
  { code: '1601-C', title: 'Monthly withholding on compensation' },
  { code: '1601-EQ', title: 'Quarterly expanded withholding' },
  { code: '1604-C', title: 'Annual return — withholding on compensation' },
  { code: '0605', title: 'Payment Form (registration fees, penalties)' },
];

// Shared card renderer used by both the LOCAL and NATIONAL tax sections.
// `kind` drives the colored badge so users can tell at a glance whether a
// tax is collected by the city or by BIR.
const TaxCard: React.FC<{ t: Tax; kind: 'LOCAL' | 'NATIONAL' }> = ({
  t,
  kind,
}) => {
  const isLocal = kind === 'LOCAL';
  return (
    <article className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
          <t.icon className="h-5 w-5" />
        </div>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
            isLocal
              ? 'border-primary-200 bg-primary-50 text-primary-700'
              : 'border-amber-200 bg-amber-50 text-amber-800'
          }`}
        >
          {isLocal ? 'LOCAL · CITY' : 'NATIONAL · BIR'}
        </span>
      </div>

      <h3 className="text-base font-semibold leading-snug text-gray-900">
        {t.title}
      </h3>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">{t.body}</p>

      <dl className="mt-4 space-y-2 rounded-lg border border-gray-100 bg-gray-50 p-2.5">
        <div>
          <dt className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
            Rate / Base
          </dt>
          <dd className="text-[11px] font-medium text-gray-900">{t.rate}</dd>
        </div>
        <div>
          <dt className="text-[9px] font-semibold uppercase tracking-wider text-gray-400">
            Deadline
          </dt>
          <dd className="text-[11px] font-medium text-gray-900">{t.deadline}</dd>
        </div>
      </dl>

      <a
        href={t.href}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-4 inline-flex items-center gap-1.5 self-start rounded-full bg-primary-600 px-3.5 py-1.5 text-xs font-semibold text-white transition hover:bg-primary-700"
      >
        {t.cta}
        <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </article>
  );
};

const TaxPayments: React.FC = () => {
  const heroRef = useReveal();
  const stepsHeadRef = useReveal();
  const stepsGridRef = useReveal<HTMLOListElement>();
  const localHeadRef = useReveal();
  const localGridRef = useReveal();
  const nationalHeadRef = useReveal();
  const nationalGridRef = useReveal();
  const calendarHeadRef = useReveal();
  const calendarGridRef = useReveal<HTMLUListElement>();
  const channelsHeadRef = useReveal();
  const birFormsHeadRef = useReveal();
  const birFormsGridRef = useReveal();
  const officesHeadRef = useReveal();
  const officesGridRef = useReveal();

  return (
    <>
      <SEO
        path="/services/tax-payments"
        title="Tax Payments — GenSan"
        description="Complete guide to local and national taxes for General Santos City residents and businesses — Real Property Tax, Local Business Tax, Cedula, BIR Income Tax, VAT, withholding, the full tax calendar, and the official filing & payment channels."
        keywords="gensan tax payments, real property tax gensan, business tax gensan, bir income tax, vat philippines, ebirforms, efps, landbank linkbiz, gcash bir, cedula gensan, bir rdo 110"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div ref={heroRef} className="reveal mx-auto max-w-[1100px] px-4" style={{ animation: 'fade-up var(--dur-slow) var(--ease-out-quart) both' } as React.CSSProperties}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Tax Payments' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Banknote className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Pay Your Dues
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Tax Payments
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Local and national taxes residents and businesses owe in
                General Santos City — what each one is, how it's computed,
                when it's due, and the official portal that collects it.
                BetterGensan never collects payments — every link goes
                straight to the responsible BIR or LGU office.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://www.bir.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <Globe className="h-3.5 w-3.5" />
                  Visit BIR
                </a>
                <a
                  href="https://gensantos.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit City Treasurer
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
          eyebrow="From TIN to payment"
          title="How to pay your taxes in 5 steps"
          helper="The standard path most General Santos City taxpayers follow — applies to both individuals and businesses."
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

      {/* ---------- Local taxes (collected by the City) ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={localHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={ClipboardList}
          eyebrow="Local taxes · GenSan"
          title="Taxes collected by the City of General Santos"
          helper="Real Property Tax, Local Business Tax, and the Community Tax Certificate (Cedula). Authority: Local Government Code (RA 7160). Paid at the City Treasurer's Office."
        />
        </div>

        <div ref={localGridRef} className="reveal grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {LOCAL_TAXES.map(t => (
            <TaxCard key={t.title} t={t} kind="LOCAL" />
          ))}
        </div>
      </PageSection>

      {/* ---------- National taxes (collected by BIR) ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={nationalHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Landmark}
          eyebrow="National taxes · BIR"
          title="Taxes collected by the Bureau of Internal Revenue"
          helper="Income Tax, VAT, and Withholding Tax are NOT city taxes — they are national taxes administered by BIR and apply uniformly across the Philippines. Authority: NIRC (RA 8424), TRAIN Law, CREATE Act."
        />
        </div>

        <div ref={nationalGridRef} className="reveal grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {NATIONAL_TAXES.map(t => (
            <TaxCard key={t.title} t={t} kind="NATIONAL" />
          ))}
        </div>
      </PageSection>

      {/* ---------- Tax calendar ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={calendarHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Calendar}
          eyebrow="Mark your calendar"
          title="2026 tax calendar — key deadlines"
          helper="Critical filing and payment deadlines for the year. Late payments incur 25% surcharge plus 12% annual interest under the NIRC."
        />
        </div>

        <ul ref={calendarGridRef} className="reveal divide-y divide-gray-100 rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {CALENDAR.map(c => (
            <li
              key={`${c.month}-${c.day}-${c.title}`}
              className="flex items-start gap-4 p-4 transition hover:bg-gray-50/60"
            >
              <div className="flex h-12 w-12 shrink-0 flex-col items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <span className="text-[9px] font-semibold uppercase leading-none tracking-wider text-white/80">
                  {c.month}
                </span>
                <span className="text-base font-bold leading-none">
                  {c.day}
                </span>
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex flex-wrap items-center gap-2">
                  <h4 className="text-sm font-semibold text-gray-900">
                    {c.title}
                  </h4>
                  <span
                    className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                      c.scope === 'Local'
                        ? 'border-primary-200 bg-primary-50 text-primary-700'
                        : 'border-gray-300 bg-white text-gray-700'
                    }`}
                  >
                    {c.scope}
                  </span>
                </div>
                <p className="mt-0.5 text-xs leading-relaxed text-gray-600">
                  {c.detail}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </PageSection>

      {/* ---------- Filing & payment channels ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={channelsHeadRef} className="reveal grid gap-6 lg:grid-cols-2">
          {/* Filing */}
          <div>
            <SectionHeading
              tier="secondary"
              icon={FileText}
              eyebrow="File online"
              title="Official filing portals"
              helper="The four official BIR digital channels for tax registration, filing, and submission."
            />
            <div className="grid gap-3">
              {FILING_CHANNELS.map(c => (
                <a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                        {c.label}
                      </h4>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-700" />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">
                      {c.body}
                    </p>
                    <p className="mt-1.5 text-[11px] font-medium text-primary-700">
                      {c.domain}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* Payment */}
          <div>
            <SectionHeading
              tier="secondary"
              icon={CreditCard}
              eyebrow="Pay online"
              title="Accredited payment channels"
              helper="Six official BIR ePayment channels — covering bank, e-wallet, and over-the-counter options."
            />
            <div className="mb-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
              <span>
                <strong className="font-semibold">Availability varies.</strong>{' '}
                These channels are accredited for{' '}
                <strong>national (BIR) taxes</strong>. Local taxes (RPT,
                Business Tax, Cedula) are paid at the City Treasurer's Office —
                some LGU channels accept GCash/Maya separately. Confirm with
                the City Treasurer before paying online.
              </span>
            </div>
            <div className="grid gap-3">
              {PAYMENT_CHANNELS.map(c => (
                <a
                  key={c.label}
                  href={c.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700">
                    <c.icon className="h-5 w-5" />
                  </div>
                  <div className="min-w-0 flex-grow">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                        {c.label}
                      </h4>
                      <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-700" />
                    </div>
                    <p className="mt-1 text-xs leading-relaxed text-gray-600">
                      {c.body}
                    </p>
                    <p className="mt-1.5 text-[11px] font-medium text-primary-700">
                      {c.domain}
                    </p>
                  </div>
                </a>
              ))}
            </div>
          </div>
        </div>

        <Link
          to="/eboss"
          className="group mt-4 flex items-center gap-3 rounded-xl border border-primary-200 bg-primary-50 p-3 text-xs transition hover:border-primary-400"
        >
          <span className="flex-1 text-primary-900">
            <strong>Pay local taxes online</strong> — Real Property Tax
            and Local Business Tax can be paid through the city's
            Filipizen portal.
          </span>
          <span className="font-semibold text-primary-700 group-hover:text-primary-800">
            View online services &rarr;
          </span>
        </Link>
      </PageSection>

      {/* ---------- BIR forms quick reference ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={birFormsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={ClipboardList}
          eyebrow="Forms quick reference"
          title="Common BIR forms"
          helper="The most-used BIR forms for individuals and businesses. Download from the BIR website or generate via eBIRForms."
        />
        </div>

        <div ref={birFormsGridRef} className="reveal grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {BIR_FORMS.map(f => (
            <a
              key={f.code}
              href={`https://www.bir.gov.ph/index.php/bir-forms.html`}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 shadow-sm shadow-gray-900/[0.04] transition-[border-color,background-color] duration-[var(--dur-fast)] hover:border-primary-200 hover:bg-primary-50"
            >
              <div className="flex h-10 min-w-[3.25rem] shrink-0 items-center justify-center rounded-lg bg-primary-600 px-2 text-[11px] font-bold uppercase tracking-wider text-white ring-1 ring-primary-700">
                {f.code}
              </div>
              <span className="flex-1 text-xs font-medium text-gray-900 group-hover:text-primary-700">
                {f.title}
              </span>
              <ExternalLink className="h-3 w-3 shrink-0 text-gray-400 group-hover:text-primary-700" />
            </a>
          ))}
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
          helper="Government offices and official portals that handle tax collection and compliance for General Santos City."
        />
        </div>

        <div ref={officesGridRef} className="reveal grid grid-cols-1 gap-3 sm:grid-cols-2" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
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
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Late payment penalties:</strong> 25% surcharge + 12%
              annual interest under the NIRC. Local taxes also incur 2% per
              month surcharge per LGC § 168.
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700">
            <Phone className="h-4 w-4 shrink-0 text-primary-600" />
            <span>
              <strong>BIR Hotline:</strong>{' '}
              <a
                href="tel:+6328538-3200"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                (02) 8538-3200
              </a>
            </span>
          </div>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div>
            <strong>Disclaimer.</strong> This page summarizes common tax
            processes for General Santos City residents and businesses. Rates,
            deadlines, and procedures change through Revenue Regulations and
            new legislation (TRAIN, CREATE, CREATE MORE). Always verify
            requirements with the <strong>BIR</strong> or the{' '}
            <strong>City Treasurer's Office</strong> before filing or paying.
            BetterGensan does not provide legal or tax advice.
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default TaxPayments;
