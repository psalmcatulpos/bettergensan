// /services/education — dedicated Education page for General Santos City.
// Goes deeper than the registry-driven category pages with:
//   1. 5-step access path
//   2. 6 core programs (DepEd, City Scholarship, TESDA, DSWD aid,
//      DOST-SEI, UniFAST free tuition)
//   3. Free tuition & scholarship reference table
//   4. Common requirements + helpful hotlines
//   5. Responsible offices
//
// Pure information page. Every link goes to the official DepEd, CHED,
// TESDA, DOST-SEI, UniFAST, DSWD, or LGU portal. BetterGensan never
// collects forms or payments.
//
// Sources cross-checked against:
//   RA 10533 (Enhanced Basic Education Act, 2013)
//   RA 10931 (Universal Access to Quality Tertiary Education Act, 2017)
//   RA 7722  (Higher Education Act, 1994)
//   RA 7796  (TESDA Act, 1994)
//   RA 9155  (Governance of Basic Education Act, 2001)
//   RA 10410 (Early Years Act, 2013)
//   RA 11476 (GMRC and Values Education Act, 2020)

import {
  AlertTriangle,
  Atom,
  Award,
  BadgeCheck,
  BookOpen,
  Building2,
  CheckCircle2,
  ClipboardList,
  ExternalLink,
  GraduationCap,
  HandCoins,
  HandHeart,
  Hash,
  IdCard,
  Lightbulb,
  MapPin,
  Phone,
  School,
  Sparkles,
  Trophy,
  Wrench,
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
    icon: BookOpen,
    title: 'Identify your pathway (K-12, TVET, or college)',
    body: 'K to 12 basic education (DepEd), Technical-Vocational Education and Training / TVET (TESDA), college (CHED), or alternative learning for out-of-school youth (ALS). Each route has its own portal and timeline.',
  },
  {
    number: '02',
    icon: BadgeCheck,
    title: 'Check eligibility',
    body: 'Most programs check age, residency, household income, or previous academic record. Free higher education under RA 10931 covers SUCs, LUCs, and TESDA programs.',
  },
  {
    number: '03',
    icon: ClipboardList,
    title: 'Prepare your documents',
    body: 'PSA birth certificate, latest school records (report card, transcript, or diploma), valid ID, barangay residency, certificate of indigency for needs-based scholarships, and proof of household income.',
  },
  {
    number: '04',
    icon: IdCard,
    title: 'Apply online or in person',
    body: 'DepEd schools accept walk-in enrollment. Scholarships and free tuition use the UniFAST or DOST-SEI portals. CSWDO handles city-funded scholarships.',
  },
  {
    number: '05',
    icon: GraduationCap,
    title: 'Enroll or claim your aid',
    body: 'Once approved, complete enrollment and keep your enrollment cert, ID, and any subsidy claim slips. Renewal requirements vary per program.',
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
    icon: School,
    title: 'DepEd K to 12 Enrollment',
    body: 'Free public school enrollment from kindergarten through senior high school. Senior high school covers four DepEd tracks: Academic, TVL (Technical-Vocational-Livelihood), Sports, and Arts & Design.',
    law: 'RA 10533 (Enhanced Basic Education Act, 2013)',
    benefit: 'Free tuition, learning materials, and feeding programs in public schools',
    who: 'All Filipino children aged 5 to 18',
    href: 'https://www.deped.gov.ph/',
    cta: 'Visit DepEd',
    agency: 'DepEd',
  },
  {
    icon: Award,
    title: 'GenSan City Scholarship Program',
    body: 'LGU-funded scholarships for college and tech-voc students who are bona fide residents of General Santos City. Covers tuition support and stipends.',
    law: 'GenSan City Ordinance',
    benefit: 'Tuition support and stipend for qualified college and TVET students',
    who: 'GenSan resident students with academic and need qualifications',
    href: 'https://gensantos.gov.ph/',
    cta: 'Apply at CSWDO',
    agency: 'CSWDO · GenSan',
  },
  {
    icon: Wrench,
    title: 'TESDA Vocational Training',
    body: 'Free skills training in welding, automotive, electrical, computer servicing, cookery, dressmaking, and many other tech-voc fields. National certification on graduation.',
    law: 'RA 7796 (TESDA Act, 1994)',
    benefit: 'Free training, allowance under TWSP, and National Certificate (NC I to NC IV)',
    who: 'Filipinos seeking tech-voc skills, including out-of-school youth',
    href: 'https://www.tesda.gov.ph/',
    cta: 'Visit TESDA',
    agency: 'TESDA',
  },
  {
    icon: HandCoins,
    title: 'DSWD Educational Assistance',
    body: 'AICS educational aid covering school expenses such as tuition, supplies, books, transportation, and other school-related costs for indigent students. Issued case-by-case under DSWD crisis assistance — exact coverage depends on social-worker assessment.',
    law: 'DSWD AICS Program',
    benefit: 'One-time cash aid for school fees, books, and supplies',
    who: 'Indigent students or families facing financial difficulty',
    href: 'https://www.dswd.gov.ph/aics/',
    cta: 'Visit DSWD',
    agency: 'DSWD',
  },
  {
    icon: Atom,
    title: 'DOST-SEI Scholarship',
    body: 'Merit-based scholarships for STEM degrees from the Department of Science and Technology, Science Education Institute. Includes Junior Level Science Scholarship for 3rd-year college students.',
    law: 'RA 10612 (Fast-Tracked S&T Scholarship Act, 2013)',
    benefit: 'Tuition, monthly stipend, book allowance, transportation, and graduation aid',
    who: 'High-performing students entering STEM degree programs',
    href: 'https://sei.dost.gov.ph/',
    cta: 'Visit DOST SEI',
    agency: 'DOST',
  },
  {
    icon: GraduationCap,
    title: 'UniFAST Free Higher Education',
    body: 'Free tuition in State Universities and Colleges (SUCs), Local Universities and Colleges (LUCs), and select private higher education institutions through the Tertiary Education Subsidy (TES), under RA 10931. TESDA programs are also covered.',
    law: 'RA 10931 (Free Tertiary Education Act, 2017)',
    benefit: 'Zero tuition + miscellaneous fees in SUCs, LUCs, and TESDA programs',
    who: 'Filipino students enrolled in eligible state institutions',
    href: 'https://unifast.gov.ph/',
    cta: 'Visit UniFAST',
    agency: 'UniFAST · CHED',
  },
  {
    icon: BookOpen,
    title: 'ALS — Alternative Learning System',
    body: 'DepEd program offering basic education completion outside the formal school system — for out-of-school youth, school dropouts, and adult learners. Includes literacy, numeracy, and Accreditation & Equivalency tests that grant elementary or secondary diplomas.',
    law: 'RA 11510 (Alternative Learning System Act, 2020)',
    benefit: 'Free basic education completion + recognized A&E certification',
    who: 'Out-of-school youth, dropouts, working learners, and adults without a diploma',
    href: 'https://www.deped.gov.ph/alternative-learning-system/',
    cta: 'Visit DepEd ALS',
    agency: 'DepEd · ALS',
  },
];

// ---------- Free tuition & scholarship reference ----------

interface ScholarshipRow {
  name: string;
  law: string;
  benefit: string;
  who: string;
}

const SCHOLARSHIPS: ScholarshipRow[] = [
  {
    name: 'Free Higher Education (FHE)',
    law: 'RA 10931, 2017',
    benefit: '100% tuition + misc fees in SUCs, LUCs, and TESDA',
    who: 'Filipino students in eligible state institutions',
  },
  {
    name: 'Tertiary Education Subsidy (TES)',
    law: 'RA 10931, 2017',
    benefit: 'Up to ₱60,000 per year (private school component)',
    who: 'Indigent Filipino college students, prioritized via Listahanan',
  },
  {
    name: 'Student Loan Program (StuFAP)',
    law: 'RA 10931, 2017',
    benefit: 'Government-backed student loans, low interest',
    who: 'College students needing additional financial support',
  },
  {
    name: 'DOST-SEI Undergraduate Scholarship',
    law: 'RA 10612, 2013',
    benefit: 'Tuition, stipend, book allowance, graduation aid',
    who: 'STEM students with strong academic records',
  },
  {
    name: 'DepEd Senior High School Voucher',
    law: 'DepEd Order No. 11, s. 2017',
    benefit: 'Up to ₱22,500 per year for private senior high',
    who: 'Senior high students enrolling in private or non-DepEd schools',
  },
  {
    name: 'TESDA TWSP Scholarship',
    law: 'TESDA Training for Work Scholarship',
    benefit: 'Free tech-voc training + training support fund',
    who: 'Filipinos pursuing in-demand tech-voc programs',
  },
  {
    name: 'GenSan City Scholarship Program',
    law: 'GenSan City Ordinance',
    benefit: 'Tuition support and stipend for resident students',
    who: 'Bona fide GenSan residents in college or TVET',
  },
];

// ---------- Common requirements ----------

const REQUIREMENTS = [
  'PSA birth certificate (original or certified copy)',
  'Latest report card or transcript of records',
  'School ID or registration / enrollment form',
  'Enrollment assessment form (if required by the school)',
  'Two valid government-issued IDs (parent or student)',
  'Barangay certificate of residency',
  'Certificate of indigency (for needs-based scholarships)',
  'Recent 1×1 or 2×2 ID photos',
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
    icon: School,
    label: 'DepEd Action Center',
    number: '8632-1361',
    body: 'Department of Education public hotline for K to 12 concerns.',
  },
  {
    icon: GraduationCap,
    label: 'CHED Hotline',
    number: '8441-1170',
    body: 'Commission on Higher Education inquiries and complaints.',
  },
  {
    icon: Wrench,
    label: 'TESDA Hotline',
    number: '8893-8281',
    body: 'TESDA scholarships, training, and certification.',
  },
  {
    icon: Award,
    label: 'UniFAST',
    number: '8328-3535',
    body: 'Free higher education and scholarship program inquiries.',
  },
  {
    icon: Atom,
    label: 'DOST-SEI',
    number: '8837-1359',
    body: 'Science Education Institute scholarships and fellowships.',
  },
  {
    icon: HandCoins,
    label: 'DSWD AICS',
    number: '8951-2802',
    body: 'Crisis assistance, including educational aid.',
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
    icon: School,
    name: 'Department of Education',
    scope: 'K to 12 enrollment, school operations, curriculum, and learner welfare.',
    href: 'https://www.deped.gov.ph/',
    domain: 'deped.gov.ph',
  },
  {
    icon: MapPin,
    name: 'DepEd Region XII (SOCCSKSARGEN)',
    scope: 'Regional DepEd office serving General Santos City and the SOCCSKSARGEN region.',
    href: 'https://region12.deped.gov.ph/',
    domain: 'region12.deped.gov.ph',
  },
  {
    icon: GraduationCap,
    name: 'Commission on Higher Education',
    scope: 'University regulation, scholarships, and tertiary education policy.',
    href: 'https://ched.gov.ph/',
    domain: 'ched.gov.ph',
  },
  {
    icon: Award,
    name: 'UniFAST',
    scope: 'Unified Student Financial Assistance System under RA 10931. Free tuition coordinator.',
    href: 'https://unifast.gov.ph/',
    domain: 'unifast.gov.ph',
  },
  {
    icon: Wrench,
    name: 'Technical Education and Skills Development Authority',
    scope: 'Vocational training, certification, and skills assessment for Filipino workers.',
    href: 'https://www.tesda.gov.ph/',
    domain: 'tesda.gov.ph',
  },
  {
    icon: Atom,
    name: 'DOST Science Education Institute',
    scope: 'STEM scholarships, JLSS, and science fellowships.',
    href: 'https://sei.dost.gov.ph/',
    domain: 'sei.dost.gov.ph',
  },
  {
    icon: HandHeart,
    name: 'CSWDO Scholarship Office (GenSan)',
    scope: 'City-funded scholarships and educational aid for GenSan residents.',
    href: 'https://gensantos.gov.ph/',
    domain: 'gensantos.gov.ph',
  },
  {
    icon: Sparkles,
    name: 'DepEd ALS (Alternative Learning System)',
    scope: 'Free non-formal basic education for out-of-school youth and adults.',
    href: 'https://www.deped.gov.ph/k-to-12/inclusive-education/about-alternative-learning-system/',
    domain: 'deped.gov.ph',
  },
];

const Education: React.FC = () => {
  const heroRef = useReveal();
  const stepsHeadRef = useReveal();
  const stepsGridRef = useReveal<HTMLOListElement>();
  const programsHeadRef = useReveal();
  const programsGridRef = useReveal();
  const scholarshipsHeadRef = useReveal();
  const scholarshipsGridRef = useReveal();
  const reqHeadRef = useReveal();
  const officesHeadRef = useReveal();
  const officesGridRef = useReveal();

  return (
    <>
      <SEO
        path="/services/education"
        title="Education — GenSan"
        description="Complete guide to public and government education programs in General Santos City. K to 12 enrollment, city scholarships, TESDA vocational training, DOST-SEI scholarships, UniFAST free higher education, ALS, and the responsible offices."
        keywords="gensan education, deped enrollment, ched, tesda training gensan, dost sei scholarship, unifast free tuition, ra 10931, gensan city scholarship, als gensan"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div ref={heroRef} className="reveal mx-auto max-w-[1100px] px-4" style={{ animation: 'fade-up var(--dur-slow) var(--ease-out-quart) both' } as React.CSSProperties}>
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Services', href: '/services' },
              { label: 'Education' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <GraduationCap className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Schools & Scholarships
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Education
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Enrollment, scholarships, and free tuition programs
                available to General Santos City students. From K to 12
                public school to free higher education in state
                universities, BetterGensan points you to the right official
                portal for every education path.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://unifast.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <Award className="h-3.5 w-3.5" />
                  Free Higher Education
                </a>
                <a
                  href="https://www.deped.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit DepEd
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
          eyebrow="From application to enrollment"
          title="How to access education programs in 5 steps"
          helper="The standard path most General Santos City students follow."
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
          title="Main education programs"
          helper="Six core education and scholarship programs available to General Santos City students. Most are free or government-subsidized."
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

      {/* ---------- Free tuition & scholarship reference ---------- */}
      <PageSection background="white" tier="secondary">
        <div ref={scholarshipsHeadRef} className="reveal">
        <SectionHeading
          tier="secondary"
          icon={Trophy}
          eyebrow="Free tuition & scholarships"
          title="Government scholarship reference"
          helper="The major government scholarship and free-tuition programs Filipino students can apply for. Most need an active enrollment record and proof of eligibility."
        />
        </div>

        <div ref={scholarshipsGridRef} className="reveal overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-[10px] font-semibold uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3">Program</th>
                <th className="px-4 py-3">Law</th>
                <th className="px-4 py-3">Benefit</th>
                <th className="px-4 py-3">Who qualifies</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {SCHOLARSHIPS.map(s => (
                <tr key={s.name} className="hover:bg-gray-50/60">
                  <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                    {s.name}
                  </td>
                  <td className="px-4 py-3 text-xs font-medium text-primary-700">
                    {s.law}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">
                    {s.benefit}
                  </td>
                  <td className="px-4 py-3 text-xs text-gray-700">{s.who}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="mt-3 text-[11px] text-gray-500">
          Subsidy amounts and eligibility can change with each fiscal year.
          Always confirm current rates with the responsible agency before
          applying.
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
              helper="Documents most enrollment and scholarship applications ask for."
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
              title="Education hotlines"
              helper="National hotlines for DepEd, CHED, TESDA, UniFAST, DOST-SEI, and DSWD."
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
          helper="Government offices and official portals that handle education for General Santos City students."
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
            <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong>Heads up:</strong> Free higher education under RA
              10931 is automatic in eligible state schools. You do not need
              to apply for it separately, just enroll.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div>
              <strong>Watch out for fixers.</strong> All scholarships are
              free to apply for. Never pay anyone offering to guarantee a
              scholarship slot or fast-track an application.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default Education;
