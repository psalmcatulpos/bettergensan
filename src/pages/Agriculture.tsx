// /services/agriculture-fisheries — dedicated Agriculture & Fisheries page
// for General Santos City. Goes deeper than the registry-driven category
// pages with:
//   1. 5-step access path (RSBSA-first)
//   2. 6 core programs (RSBSA, free inputs, veterinary, BFAR boat reg,
//      PCIC insurance, ATI training)
//   3. Funds & subsidies reference (RCEF, Sagip Saka, ACPC, Coconut Trust)
//   4. Common requirements + crisis hotlines
//   5. Responsible offices
//
// Pure information page. Every link goes to the official DA, BFAR, PCIC,
// ATI, or LGU portal — BetterGensan never collects forms or payments.
//
// Sources cross-checked against:
//   RA 11203 (Rice Tariffication Law / RCEF, 2019)
//   RA 11321 (Sagip Saka Act, 2019)
//   RA 11524 (Coconut Farmers and Industry Trust Fund Act, 2021)
//   RA 8435  (Agriculture & Fisheries Modernization Act / AFMA, 1997)
//   RA 10068 (Organic Agriculture Act of 2010)
//   RA 8550 + RA 10654 (Philippine Fisheries Code as amended)
//   RA 7607  (Magna Carta of Small Farmers, 1992)

import {
  AlertTriangle,
  Anchor,
  BadgeCheck,
  Building2,
  ClipboardList,
  CheckCircle2,
  Container,
  ExternalLink,
  Factory,
  Fish,
  GraduationCap,
  HandHeart,
  HandCoins,
  Hash,
  PawPrint,
  Phone,
  Sailboat,
  ShieldCheck,
  ShoppingBasket,
  Sprout,
  Tractor,
  TrendingUp,
  Wheat,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

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
    title: 'Register on RSBSA',
    body: 'Register on the Registry System for Basic Sectors in Agriculture. RSBSA registration is required to qualify for government support programs (seeds, insurance, loans, and training).',
  },
  {
    number: '02',
    icon: BadgeCheck,
    title: 'Determine your sector',
    body: 'Farmer, fisherfolk, or farm worker. Sector tags determine which programs (BFAR, BPI, BAI, PCA, NFA) you qualify for.',
  },
  {
    number: '03',
    icon: Building2,
    title: 'Visit the City Agriculture Office',
    body: 'Walk into the GenSan City Agriculture Office (or DA Region XII for fisheries-specific concerns) to enroll in active programs.',
  },
  {
    number: '04',
    icon: HandHeart,
    title: 'Receive inputs, training, or insurance',
    body: 'Seeds and seedlings, planting materials, livestock, or PCIC insurance — distributed through government support programs via the LGU or DA field office. Availability varies by program and crop cycle.',
  },
  {
    number: '05',
    icon: TrendingUp,
    title: 'Access markets and sell',
    body: 'Access market linkage programs such as KADIWA ng Pangulo or Sagip Saka, or sell through local channels (city wet market, agri-trading centers, fish port). Inclusion in linkage programs is not automatic.',
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
    icon: ClipboardList,
    title: 'RSBSA Registration',
    body: 'The Registry System for Basic Sectors in Agriculture — the master registry of farmers, farmworkers, and fisherfolk. Most DA programs require an active RSBSA record.',
    law: 'AFMA · RA 8435',
    benefit: 'Eligibility for free seeds, inputs, training, insurance, loans, cash aid',
    who: 'Filipino farmers, farmworkers, and fisherfolk',
    href: 'https://rsbsa.da.gov.ph/',
    cta: 'Register on RSBSA',
    agency: 'DA',
  },
  {
    icon: Sprout,
    title: 'Seeds & Fertilizer Support (RCEF + LGU)',
    body: 'Under the Rice Competitiveness Enhancement Fund, certified inbred rice seeds, machinery, and training are distributed through government support programs to RSBSA-registered rice farmers (availability varies — some are direct distribution, others are subsidized or cost-shared). LGU also distributes corn, vegetable, and organic inputs through similar programs.',
    law: 'RA 11203 (Rice Tariffication Law, 2019)',
    benefit: 'Certified rice seeds + access to RCEF machinery, credit, and training',
    who: 'Rice farmers in RSBSA · all sizes covered',
    href: 'https://rcef.da.gov.ph/',
    cta: 'Visit RCEF',
    agency: 'DA · PhilRice',
  },
  {
    icon: PawPrint,
    title: 'Veterinary Services',
    body: 'Free anti-rabies vaccination, livestock check-ups, artificial insemination, and animal disease control through the City Veterinary Office and the Bureau of Animal Industry.',
    law: 'RA 9482 (Anti-Rabies Act) · RA 9296 (Meat Inspection Code)',
    benefit: 'Free anti-rabies, livestock vaccines, AI services, disease control',
    who: 'Pet owners, livestock raisers, poultry farmers',
    href: 'https://gensantos.gov.ph/',
    cta: 'Visit City Vet Office',
    agency: 'CVO · BAI',
  },
  {
    icon: Sailboat,
    title: 'Fisherfolk & Boat Registration',
    body: 'BFAR municipal fisherfolk registration and boat licensing for vessels 3 GT and below. Required to fish in municipal waters legally.',
    law: 'RA 8550 + RA 10654 (Philippine Fisheries Code)',
    benefit: 'Legal fishing rights in municipal waters + access to BFAR programs',
    who: 'Municipal fisherfolk and boat owners (≤3 GT)',
    href: 'https://www.bfar.da.gov.ph/',
    cta: 'Visit BFAR',
    agency: 'BFAR',
  },
  {
    icon: ShieldCheck,
    title: 'PCIC Crop & Fisheries Insurance',
    body: 'Insurance for crops, livestock, fisheries, and agri machinery. Premiums are partially subsidized by government — full premium subsidy is available for indigent and RSBSA-registered farmers under DA budget allocations. Covers losses from typhoon, flood, drought, pests, and disease.',
    law: 'PD 1467 (PCIC Charter) · subsidies under DA budget',
    benefit: 'Partially-subsidized insurance — full premium subsidy for indigent / RSBSA farmers',
    who: 'RSBSA-registered farmers, fisherfolk, and ag businesses',
    href: 'https://pcic.gov.ph/',
    cta: 'Visit PCIC',
    agency: 'PCIC',
  },
  {
    icon: GraduationCap,
    title: 'ATI Training & Farm Schools',
    body: 'Free farmer training, extension services, and farm school programs from the Agricultural Training Institute. Includes climate-smart farming, organic methods, and aquaculture.',
    law: 'RA 8435 (AFMA, 1997)',
    benefit: 'Free training, certification, and access to demo farms',
    who: 'All Filipino farmers and fisherfolk',
    href: 'https://www.ati.da.gov.ph/',
    cta: 'Visit ATI',
    agency: 'ATI',
  },
];

// ---------- Funds & subsidies reference ----------

interface Fund {
  name: string;
  law: string;
  amount: string;
  who: string;
}

const FUNDS: Fund[] = [
  {
    name: 'Rice Competitiveness Enhancement Fund (RCEF)',
    law: 'RA 11203, 2019',
    amount: '₱10B/yr earmarked from rice import tariffs',
    who: 'Rice farmers — seeds, machinery, credit, training',
  },
  {
    name: 'Sagip Saka — LGU Direct Procurement',
    law: 'RA 11321, 2019',
    amount: 'Tax-exempt direct procurement, bypassing public bidding',
    who: 'Accredited farmer cooperatives selling to LGUs',
  },
  {
    name: 'Coconut Farmers & Industry Trust Fund',
    law: 'RA 11524, 2021',
    amount: '₱75B trust fund disbursed over 50 years',
    who: 'Registered coconut farmers nationwide',
  },
  {
    name: 'ACPC Agri-Negosyo Loans',
    law: 'ACPC Charter under DA',
    amount: 'Up to ₱1M per borrower at 0%–6% interest',
    who: 'Marginalized farmers, fisherfolk, and agri-MSMEs',
  },
  {
    name: 'PCIC Crop Insurance Premium',
    law: 'PD 1467',
    amount: '100% premium subsidy for indigent / RSBSA',
    who: 'RSBSA-registered farmers and fisherfolk',
  },
  {
    name: 'KADIWA ng Pangulo',
    law: 'DA Marketing Program',
    amount: 'Direct farm-to-consumer market access',
    who: 'Farmer cooperatives and direct producers',
  },
];

// ---------- Common requirements ----------

const REQUIREMENTS = [
  'Two valid government-issued IDs',
  'Barangay certificate of residency',
  'RSBSA Reference Number (or proof of pending registration)',
  'Proof of land tenure: title, lease, or tenancy agreement',
  'For fisherfolk: Certificate of Registration of fishing boat (BFAR)',
  'For livestock: animal vaccination record (where applicable)',
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
    icon: Wheat,
    label: 'DA Hotline',
    number: '8920-3994',
    body: 'Department of Agriculture central inquiries.',
  },
  {
    icon: Fish,
    label: 'BFAR Region XII',
    number: '083-553-1117',
    body: 'Bureau of Fisheries and Aquatic Resources, SOCCSKSARGEN.',
  },
  {
    icon: ShieldCheck,
    label: 'PCIC Hotline',
    number: '8551-9091',
    body: 'Philippine Crop Insurance Corporation — claims and inquiries.',
  },
  {
    icon: GraduationCap,
    label: 'ATI Region XII',
    number: '083-553-9382',
    body: 'Agricultural Training Institute, regional center.',
  },
  {
    icon: Tractor,
    label: 'PhilRice (RCEF)',
    number: '0917-119-7423',
    body: 'PhilRice texting hotline for rice farming questions.',
  },
  {
    icon: AlertTriangle,
    label: 'Plant Hotline (BPI)',
    number: '8929-7398',
    body: 'Bureau of Plant Industry — pest and disease reports.',
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
    icon: Tractor,
    name: 'City Agriculture Office — GenSan',
    scope: 'Local farming support, free inputs, livelihood programs, and Sagip Saka coordination.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: PawPrint,
    name: 'City Veterinary Office — GenSan',
    scope: 'Animal health, anti-rabies vaccination, livestock support, and pet registration.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Wheat,
    name: 'Department of Agriculture — Region XII',
    scope: 'Regional DA office for SOCCSKSARGEN. Crop, livestock, and policy support.',
    href: 'https://rfo12.da.gov.ph/',
    domain: 'rfo12.da.gov.ph',
  },
  {
    icon: Fish,
    name: 'Bureau of Fisheries & Aquatic Resources',
    scope: 'Fisheries regulation, boat licensing, coastal management, aquaculture support.',
    href: 'https://www.bfar.da.gov.ph/',
    domain: 'bfar.da.gov.ph',
  },
  {
    icon: ShieldCheck,
    name: 'Philippine Crop Insurance Corporation',
    scope: 'Insurance for crops, livestock, fisheries, and agri-fishery machinery.',
    href: 'https://pcic.gov.ph/',
    domain: 'pcic.gov.ph',
  },
  {
    icon: GraduationCap,
    name: 'Agricultural Training Institute',
    scope: 'Farmer training, extension services, and Farm Schools nationwide.',
    href: 'https://www.ati.da.gov.ph/',
    domain: 'ati.da.gov.ph',
  },
  {
    icon: ClipboardList,
    name: 'DA RSBSA Registry',
    scope: 'Online registration system for Filipino farmers and fisherfolk.',
    href: 'https://rsbsa.da.gov.ph/',
    domain: 'rsbsa.da.gov.ph',
  },
  {
    icon: Container,
    name: 'Philippine Coconut Authority',
    scope: 'Coconut farmers registration, replanting program, and Trust Fund coordination.',
    href: 'https://pca.gov.ph/',
    domain: 'pca.gov.ph',
  },
];

const Agriculture: React.FC = () => {
  return (
    <>
      <SEO
        title="Agriculture & Fisheries — GenSan"
        description="Complete guide to government agriculture and fisheries programs in General Santos City — RSBSA registration, free seeds, RCEF, PCIC insurance, ATI training, BFAR boat licensing, veterinary services, and the Coconut Trust Fund."
        keywords="gensan agriculture, gensan fisheries, rsbsa, rcef rice farmers, pcic insurance, ati training, bfar gensan, coconut trust fund, sagip saka, tuna capital"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Agriculture & Fisheries' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Wheat className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Farms & Seas
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Agriculture & Fisheries
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Government programs for farmers and fisherfolk in General
                Santos City — registration, free inputs, training, crop and
                fisheries insurance, livelihood loans, and the Coconut Trust
                Fund. GenSan is the Tuna Capital of the Philippines and a
                key SOCCSKSARGEN agri hub.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://rsbsa.da.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <ClipboardList className="h-3.5 w-3.5" />
                  Register on RSBSA
                </a>
                <a
                  href="https://rfo12.da.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit DA Region XII
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
          eyebrow="From RSBSA to first harvest"
          title="How to access agri programs in 5 steps"
          helper="The standard path from registration to receiving inputs, insurance, and market access."
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
          title="Main agriculture programs"
          helper="Six core government programs available to General Santos City farmers and fisherfolk."
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

      {/* ---------- Funds & subsidies reference ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={HandCoins}
          eyebrow="Where the money is"
          title="Funds & subsidies reference"
          helper="Major government funds and credit facilities available to Philippine farmers and fisherfolk. Most require RSBSA registration as the eligibility floor."
        />

        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Fund / Program</th>
                <th className="px-4 py-3">Law</th>
                <th className="px-4 py-3">Amount / Form</th>
                <th className="px-4 py-3">Who qualifies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {FUNDS.map(f => (
                <tr key={f.name} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {f.name}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-primary-700">
                    {f.law}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {f.amount}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{f.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-gray-500">
          Fund volumes and disbursement schedules can change with each
          national budget. Always confirm current allocations with the
          relevant DA bureau or LGU office.
        </p>
      </PageSection>

      {/* ---------- GenSan Tuna spotlight ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Anchor}
          eyebrow="Industry context · not government programs"
          title="GenSan fisheries spotlight"
          helper="General Santos City sits at the center of the Philippine tuna industry — anchored by the General Santos Fish Port Complex (GSFPC) and several major canneries. This section is industry context for orientation; the actual government support programs are listed above."
        />

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              icon: Anchor,
              label: 'Fish Port',
              value: 'GSFPC',
              detail: 'General Santos Fish Port Complex — major Philippine tuna landing center.',
            },
            {
              icon: Fish,
              label: 'Specialty',
              value: 'Yellowfin Tuna',
              detail: 'Primary catch — exported globally for sashimi-grade sushi.',
            },
            {
              icon: Factory,
              label: 'Industry',
              value: '7 Canneries',
              detail: 'Major tuna canneries operate in or near General Santos City.',
            },
            {
              icon: ShoppingBasket,
              label: 'Local Markets',
              value: 'KADIWA + wet markets',
              detail: 'Direct farm- and sea-to-consumer outlets across the city.',
            },
          ].map(s => (
            <div
              key={s.label}
              className="flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <s.icon className="h-5 w-5" />
              </div>
              <div className="text-[11px] font-semibold uppercase tracking-wider text-primary-700">
                {s.label}
              </div>
              <div className="text-base font-bold tracking-tight text-gray-900">
                {s.value}
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-gray-600">
                {s.detail}
              </p>
            </div>
          ))}
        </div>
      </PageSection>

      {/* ---------- Common requirements + Hotlines ---------- */}
      <PageSection background="white" tier="secondary">
        <div className="grid gap-6 lg:grid-cols-2">
          <div>
            <SectionHeading
              tier="secondary"
              icon={ClipboardList}
              eyebrow="Bring these"
              title="Common requirements"
              helper="Documents most DA, BFAR, and LGU agri programs ask for — prepare these first."
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
              title="Agri hotlines"
              helper="National and regional hotlines for DA, BFAR, PCIC, ATI, and plant disease reports."
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
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Building2}
          eyebrow="Where to go"
          title="Responsible Offices"
          helper="Government offices and official portals that handle agriculture and fisheries for General Santos City."
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
              <strong>Heads up:</strong> Program rules, fund volumes, and
              eligibility can change with each fiscal year. Always confirm
              current details with the official DA, BFAR, or LGU office.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Watch out for fixers.</strong> RSBSA registration and
              all DA programs are <strong>free</strong>. Never pay anyone
              offering to "guarantee" benefits or speed up your approval.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default Agriculture;
