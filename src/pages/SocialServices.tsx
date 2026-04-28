// /services/social-welfare — dedicated Social Services page for General Santos
// City. Goes deeper than the registry-driven ServiceCategory pages with:
//   1. 5-step access path
//   2. 6 main social programs (4Ps, AICS, Senior, PWD, Solo Parent, SLP)
//   3. Quick benefits reference (discounts, allowances, parental leave)
//   4. Insurance & social security (PhilHealth, SSS, GSIS, Pag-IBIG)
//   5. Responsible offices
//   6. Crisis & support hotlines
//
// Pure information page. Every link goes to the official DSWD, PhilHealth,
// SSS, GSIS, or LGU portal — BetterGensan never collects forms or payments.
//
// Sources cross-checked against the laws that define each program:
//   RA 11310 (4Ps Act of 2019)
//   RA 9994  (Expanded Senior Citizens Act of 2010)
//   RA 10754 (PWD discount + VAT exemption)
//   RA 11861 (Expanded Solo Parents Welfare Act of 2022)
//   RA 11223 (Universal Health Care Act)

import {
  Activity,
  AlertTriangle,
  Award,
  BadgeCheck,
  Baby,
  Building2,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  Hash,
  HandCoins,
  HandHeart,
  Heart,
  HeartHandshake,
  Hospital,
  IdCard,
  Landmark,
  Phone,
  PiggyBank,
  ScrollText,
  Shield,
  ShieldCheck,
  Sprout,
  Users,
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
    icon: Building2,
    title: 'Visit your CSWDO or DSWD office',
    body: 'Walk in to the City Social Welfare Office (CSWDO) at City Hall, or the DSWD Region XII Field Office for national programs.',
  },
  {
    number: '02',
    icon: BadgeCheck,
    title: 'Determine your eligibility',
    body: 'Each program has its own criteria — age, household income, civil status, disability, or crisis situation. Ask the social worker to assess.',
  },
  {
    number: '03',
    icon: ClipboardList,
    title: 'Prepare the requirements',
    body: 'Two valid IDs, barangay clearance, certificate of residency, and program-specific docs (medical certificate for PWD, birth cert of children for solo parent, etc.).',
  },
  {
    number: '04',
    icon: HandHeart,
    title: 'Submit and undergo assessment',
    body: 'A licensed social worker will review your case and may conduct a home visit for means testing.',
  },
  {
    number: '05',
    icon: IdCard,
    title: 'Receive your ID or aid',
    body: 'Once approved, claim your ID, cash assistance, or program enrollment. Know your renewal schedule and benefits.',
  },
];

// ---------- 6 main social programs ----------

interface Program {
  icon: LucideIcon;
  title: string;
  body: string;
  law: string;
  benefit: string;
  eligibility: string;
  href: string;
  cta: string;
  agency: string;
}

const PROGRAMS: Program[] = [
  {
    icon: HandCoins,
    title: '4Ps — Pantawid Pamilyang Pilipino Program',
    body: 'Conditional cash transfer program for eligible low-income households with children aged 0–18, in exchange for compliance with health and education conditions.',
    law: 'RA 11310 (4Ps Act of 2019)',
    benefit: 'Health grant ₱750/mo + education grant up to ₱700/mo per child',
    eligibility: 'Listmahan-validated indigent households with children 0–18 or pregnant mother',
    href: 'https://www.dswd.gov.ph/4ps/',
    cta: 'Apply at DSWD',
    agency: 'DSWD',
  },
  {
    icon: Heart,
    title: 'AICS — Crisis Assistance',
    body: 'Assistance to Individuals in Crisis Situations. Provides case-based assistance such as medical, burial, transportation, food, or educational aid depending on assessment by the DSWD social worker.',
    law: 'DSWD Crisis Intervention Programs',
    benefit: 'Case-based cash aid (medical, burial, transportation, food, or educational) — assessed per applicant',
    eligibility: 'Filipino citizens facing financial difficulty due to crisis (illness, calamity, death in family)',
    href: 'https://www.dswd.gov.ph/aics/',
    cta: 'Apply at DSWD',
    agency: 'DSWD',
  },
  {
    icon: Award,
    title: 'Senior Citizen ID (OSCA)',
    body: 'ID issued by the Office of Senior Citizens Affairs (OSCA) of the LGU — under the City Social Welfare and Development Office in General Santos City — granting Filipino citizens aged 60 and above the full set of senior benefits and discounts.',
    law: 'RA 9994 (Expanded Senior Citizens Act of 2010)',
    benefit: '20% discount + VAT exemption on essentials, 5% off utilities, free medical care in govt facilities, ₱1,000/mo social pension for indigent seniors',
    eligibility: 'Filipino citizen, age 60+, GenSan resident',
    href: 'https://gensantos.gov.ph/',
    cta: 'Apply at OSCA',
    agency: 'OSCA · GenSan',
  },
  {
    icon: ShieldCheck,
    title: 'PWD ID',
    body: 'Person With Disability ID granting a 20% discount, VAT exemption on essentials, and access to government programs such as PhilHealth and educational assistance — eligibility for each program varies.',
    law: 'RA 7277, RA 9442, RA 10754',
    benefit: '20% discount + VAT exemption, 5% off basic necessities, mandatory PhilHealth coverage, educational assistance',
    eligibility: 'Filipino with permanent or temporary disability — medical certificate required',
    href: 'https://gensantos.gov.ph/',
    cta: 'Apply at CSWDO',
    agency: 'CSWDO · GenSan',
  },
  {
    icon: Users,
    title: 'Solo Parent ID',
    body: 'ID granting parental leave, baby-essentials discount, housing benefits, and educational assistance to qualified solo parents.',
    law: 'RA 11861 (Expanded Solo Parents Welfare Act of 2022)',
    benefit: '10% discount + VAT exemption on baby essentials (kids 0–6, income ≤ ₱250K/yr), 7-day parental leave, housing & educational benefits',
    eligibility: 'Solo parent rearing children alone — DSWD-defined criteria',
    href: 'https://gensantos.gov.ph/',
    cta: 'Apply at CSWDO',
    agency: 'CSWDO · GenSan',
  },
  {
    icon: Sprout,
    title: 'Sustainable Livelihood Program (SLP)',
    body: 'DSWD livelihood capital, skills training, and employment facilitation for low-income families.',
    law: 'DSWD Capacity-Building Program',
    benefit: 'Seed capital up to ₱20,000, employment placement, or skills training',
    eligibility: 'Low-income families, 4Ps beneficiaries prioritized',
    href: 'https://www.dswd.gov.ph/programs/sustainable-livelihood-program/',
    cta: 'Apply at DSWD',
    agency: 'DSWD',
  },
];

// ---------- Quick benefits reference ----------

interface BenefitRow {
  group: string;
  discount: string;
  vat: string;
  extras: string;
}

const BENEFITS: BenefitRow[] = [
  {
    group: 'Senior Citizens (60+)',
    discount: '20%',
    vat: 'Exempt',
    extras: 'Free medical in govt facilities · ₱1,000/mo social pension (indigent) · 5% off utilities',
  },
  {
    group: 'Persons with Disability',
    discount: '20%',
    vat: 'Exempt',
    extras: 'PhilHealth coverage · educational assistance · 5% on basic necessities',
  },
  {
    group: 'Solo Parents (RA 11861)',
    discount: 'Varies',
    vat: 'Varies',
    extras: 'Benefits vary under RA 11861 and LGU programs (parental leave, baby-essentials discount for kids 0–6 with income ≤ ₱250K, housing/education support — eligibility per benefit)',
  },
  {
    group: '4Ps Households',
    discount: '—',
    vat: '—',
    extras: 'Health grant ₱750/mo · education grant ₱300–₱700/mo per child · rice subsidy',
  },
  {
    group: 'Indigent (AICS)',
    discount: '—',
    vat: '—',
    extras: 'One-time cash aid for medical, burial, food, transportation, or educational crisis',
  },
];

// ---------- Insurance & social security ----------

interface Insurance {
  icon: LucideIcon;
  name: string;
  short: string;
  body: string;
  members: string;
  href: string;
  domain: string;
}

const INSURANCE: Insurance[] = [
  {
    icon: Hospital,
    name: 'PhilHealth',
    short: 'National Health Insurance',
    body: 'Universal health coverage under RA 11223. Inpatient, outpatient, and Konsulta primary care for all Filipinos.',
    members: 'Mandatory for all Filipinos',
    href: 'https://www.philhealth.gov.ph/',
    domain: 'philhealth.gov.ph',
  },
  {
    icon: PiggyBank,
    name: 'Social Security System',
    short: 'SSS',
    body: 'Retirement, disability, sickness, maternity, funeral, and unemployment benefits for private-sector workers and the self-employed.',
    members: 'Private workers, self-employed, OFWs',
    href: 'https://www.sss.gov.ph/',
    domain: 'sss.gov.ph',
  },
  {
    icon: Landmark,
    name: 'Government Service Insurance System',
    short: 'GSIS',
    body: 'Insurance, retirement, and loan benefits for permanent government employees.',
    members: 'Government workers',
    href: 'https://www.gsis.gov.ph/',
    domain: 'gsis.gov.ph',
  },
  {
    icon: Building2,
    name: 'Pag-IBIG Fund (HDMF)',
    short: 'Home Development Mutual Fund',
    body: 'Mandatory savings program offering housing loans, multi-purpose loans, and the MP2 voluntary savings scheme.',
    members: 'All employed Filipinos',
    href: 'https://www.pagibigfund.gov.ph/',
    domain: 'pagibigfund.gov.ph',
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
    icon: HeartHandshake,
    label: 'DSWD Crisis Intervention',
    number: '8951-2802',
    body: 'AICS and DSWD social welfare assistance.',
  },
  {
    icon: Baby,
    label: 'Bantay Bata 163',
    number: '163',
    body: 'Child protection hotline operated by ABS-CBN Foundation.',
  },
  {
    icon: Shield,
    label: 'VAWC / Women & Children',
    number: '177',
    body: 'Violence against women and children referral hotline.',
  },
  {
    icon: Activity,
    label: 'Mental Health (NCMH)',
    number: '1553',
    body: '24/7 crisis hotline by the National Center for Mental Health.',
  },
  {
    icon: AlertTriangle,
    label: 'Red Cross',
    number: '143',
    body: 'Philippine Red Cross — disaster response and blood services.',
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
    icon: HeartHandshake,
    name: 'City Social Welfare & Development Office',
    scope: 'Local social services, ID issuance (Solo Parent, PWD), indigent assistance, and case management.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Award,
    name: 'Office of Senior Citizens Affairs (OSCA)',
    scope: 'Senior citizen ID, benefits enrollment, and program coordination.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Users,
    name: 'DSWD Region XII Field Office',
    scope: '4Ps, AICS, SLP, KALAHI-CIDSS, and protective services for SOCCSKSARGEN.',
    href: 'https://fo12.dswd.gov.ph/',
    domain: 'fo12.dswd.gov.ph',
  },
  {
    icon: Hospital,
    name: 'PhilHealth Local Office',
    scope: 'Membership registration, premium payment, and claims for residents of GenSan.',
    href: 'https://www.philhealth.gov.ph/',
    domain: 'philhealth.gov.ph',
  },
  {
    icon: PiggyBank,
    name: 'SSS GenSan Branch',
    scope: 'SSS membership, contributions, loans, and pension claims.',
    href: 'https://www.sss.gov.ph/',
    domain: 'sss.gov.ph',
  },
  {
    icon: Landmark,
    name: 'GSIS GenSan Branch',
    scope: 'GSIS insurance, retirement, and loan services for government employees.',
    href: 'https://www.gsis.gov.ph/',
    domain: 'gsis.gov.ph',
  },
];

// ---------- Common requirements ----------

const REQUIREMENTS = [
  'Two valid government-issued IDs',
  'Barangay certificate of residency',
  'Certificate of indigency (if applicable)',
  'Birth certificate of dependents (for solo parent / 4Ps)',
  'Medical certificate (for PWD applications)',
  '1×1 or 2×2 ID photos (2 copies)',
];

const SocialServices: React.FC = () => {
  const heroRef = useReveal();
  const stepsHeadRef = useReveal();
  const stepsGridRef = useReveal<HTMLOListElement>();
  const programsHeadRef = useReveal();
  const programsGridRef = useReveal();
  const benefitsHeadRef = useReveal();
  const benefitsGridRef = useReveal();
  const insuranceHeadRef = useReveal();
  const insuranceGridRef = useReveal();
  const reqHeadRef = useReveal();
  const officesHeadRef = useReveal();
  const officesGridRef = useReveal();

  return (
    <>
      <SEO
        path="/services/social-welfare"
        title="Social Services — GenSan"
        description="Complete guide to government social services in General Santos City — 4Ps, Senior Citizen ID, PWD ID, Solo Parent benefits, AICS crisis assistance, PhilHealth, SSS, GSIS, Pag-IBIG, and crisis hotlines."
        keywords="gensan social services, 4ps gensan, senior citizen id gensan, pwd id gensan, solo parent id, dswd aics, philhealth, sss, gsis, pag-ibig, cswdo gensan"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div ref={heroRef} className="reveal mx-auto max-w-[1100px] px-4" style={{ animation: 'fade-up var(--dur-slow) var(--ease-out-quart) both' } as React.CSSProperties}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Social Services' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <HeartHandshake className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Aid & Assistance
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Social Services
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Government programs supporting seniors, persons with
                disability, solo parents, indigent families, 4Ps
                beneficiaries, and individuals in crisis. Every link goes
                straight to the responsible national or LGU office.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://www.dswd.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <Users className="h-3.5 w-3.5" />
                  Visit DSWD
                </a>
                <a
                  href="https://gensantos.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit CSWDO GenSan
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
          eyebrow="From walk-in to approval"
          title="How to access social services in 5 steps"
          helper="The standard intake path for most CSWDO and DSWD programs."
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

      {/* ---------- 6 main programs ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={programsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={HandHeart}
          eyebrow="Most requested"
          title="Main social programs"
          helper="The six core social welfare programs available to General Santos City residents — three nationwide DSWD programs and three LGU-issued IDs."
        />
        </div>

        <div ref={programsGridRef} className="reveal grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {PROGRAMS.map(p => (
            <article
              key={p.title}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
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
                    Benefits
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
                    {p.eligibility}
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

      {/* ---------- Quick benefits reference ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={benefitsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={ScrollText}
          eyebrow="At a glance"
          title="Discounts & benefits reference"
          helper="The legally-mandated discounts, VAT exemptions, and cash benefits for each protected group in General Santos City."
        />
        </div>

        <div ref={benefitsGridRef} className="reveal overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Group</th>
                <th className="px-4 py-3">Discount</th>
                <th className="px-4 py-3">VAT</th>
                <th className="px-4 py-3">Other benefits</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {BENEFITS.map(b => (
                <tr key={b.group} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {b.group}
                  </td>
                  <td className="px-4 py-3 text-sm font-bold text-primary-700">
                    {b.discount}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{b.vat}</td>
                  <td className="px-4 py-3 text-xs text-gray-600">
                    {b.extras}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-gray-500">
          Discounts and exemptions apply at every accredited establishment
          when the corresponding ID is presented at point of sale.
        </p>
      </PageSection>

      {/* ---------- Insurance & social security ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={insuranceHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={ShieldCheck}
          eyebrow="Long-term protection"
          title="Insurance & social security"
          helper="The four mandatory contribution programs every Filipino worker should be enrolled in."
        />
        </div>

        <div ref={insuranceGridRef} className="reveal grid grid-cols-1 gap-4 sm:grid-cols-2" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {INSURANCE.map(i => (
            <a
              key={i.name}
              href={i.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
            >
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <i.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                      {i.name}
                    </h4>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-primary-700">
                      {i.short}
                    </p>
                  </div>
                  <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 transition-transform duration-[var(--dur-fast)] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-primary-700" />
                </div>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  {i.body}
                </p>
                <p className="mt-2 inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium text-gray-700">
                  <Users className="h-3 w-3" />
                  {i.members}
                </p>
              </div>
            </a>
          ))}
        </div>
      </PageSection>

      {/* ---------- Common requirements + Crisis hotlines ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={reqHeadRef} className="reveal grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              tier="secondary"
              icon={ClipboardList}
              eyebrow="Bring these"
              title="Common requirements"
              helper="Documents most CSWDO and DSWD programs ask for — prepare these first."
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
              eyebrow="In a crisis"
              title="Support hotlines"
              helper="National hotlines for emergencies, child protection, mental health, and women's safety."
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

      {/* ---------- Responsible Offices ---------- */}
      <PageSection background="gray" tier="secondary">
        <div ref={officesHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Building2}
          eyebrow="Where to go"
          title="Responsible Offices"
          helper="Government offices and official portals that handle social welfare in General Santos City."
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
              <strong>Heads up:</strong> Benefit amounts and discount rules
              can change through new legislation. Always confirm current
              rates with the official DSWD or LGU office before relying on a
              specific number.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Watch out for fixers.</strong> Application is free at
              all official CSWDO and DSWD offices. Never pay anyone offering
              to "expedite" your ID or benefit claim.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default SocialServices;
