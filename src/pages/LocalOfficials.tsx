// /government/officials — General Santos City Local Officials Directory.
//
// Data is from the May 12, 2025 Philippine local elections, with the 21st
// Sangguniang Panlungsod inaugurated on August 5, 2025 and serving the
// 2025-2028 term. Sources: GMA Network proclaimed winners list, Mindanews,
// and the official Sangguniang Panlungsod portal at sp.gensantos.gov.ph.
//
// All names are taken from the proclaimed winners. Detailed contact info
// (email, phone, office hours) and the three ex-officio sectoral
// representatives (ABC President, SK Federation President, IPMR) are not
// yet wired up here. The page links to sp.gensantos.gov.ph for the
// canonical, always-current roster.

import {
  Award,
  Building2,
  Crown,
  ExternalLink,
  Gavel,
  Info,
  Landmark,
  Mail,
  ScrollText,
  ShieldCheck,
  Sparkles,
  User,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

// ---------- City Hall Leadership ----------

interface Leader {
  icon: LucideIcon;
  name: string;
  position: string;
  fullPosition: string;
  body: string;
}

const LEADERSHIP: Leader[] = [
  {
    icon: Crown,
    name: 'Hon. Lorelie G. Pacquiao',
    position: 'City Mayor',
    fullPosition: 'City Mayor of General Santos · Term 2025–2028',
    body: 'Re-elected in May 2025 for her second term. Heads the executive branch of the LGU and supervises all city departments and offices.',
  },
  {
    icon: Landmark,
    name: 'Hon. Jose Edmar J. Yumang',
    position: 'City Vice Mayor',
    fullPosition: 'City Vice Mayor & Presiding Officer of the SP · Term 2025–2028',
    body: 'Vice Mayor and presiding officer of the 21st Sangguniang Panlungsod. Oversees the legislative agenda and committees of the City Council.',
  },
];

// ---------- Congressional Representative ----------

interface Congress {
  icon: LucideIcon;
  name: string;
  position: string;
  body: string;
}

const CONGRESS: Congress[] = [
  {
    icon: Gavel,
    name: 'Hon. Shirlyn Bañas-Nograles',
    position: 'Lone District Representative',
    body: 'Represents General Santos City in the House of Representatives of the Philippines. Won the May 2025 election against incumbent Loreto Acharon.',
  },
];

// ---------- 21st Sangguniang Panlungsod (12 elected councilors) ----------

interface Councilor {
  name: string;
  notes?: string;
}

const COUNCILORS: Councilor[] = [
  { name: 'Hon. Jonathan T. Blando' },
  { name: 'Hon. Cesar Bañas Jr.' },
  { name: 'Hon. Bing Dinopol' },
  { name: 'Hon. Elizabeth B. Bagonoc' },
  { name: 'Hon. Ralph Ronald Yumang' },
  { name: 'Hon. Franklin Gacal' },
  { name: 'Hon. Michael Pacquiao' },
  { name: 'Hon. Richard L. Atendido' },
  { name: 'Hon. Virginia T. Llido' },
  { name: 'Hon. Ramon Melliza' },
  { name: 'Hon. Dominador S. Lagare' },
  { name: 'Hon. Joey Dinopol' },
];

// ---------- Ex-officio members (3 sectoral seats) ----------

interface ExOfficio {
  icon: LucideIcon;
  title: string;
  body: string;
}

const EX_OFFICIO: ExOfficio[] = [
  {
    icon: Users,
    title: 'ABC President',
    body: 'President of the Liga ng mga Barangay (Association of Barangay Captains). Represents the 26 barangays of General Santos City in the SP.',
  },
  {
    icon: Sparkles,
    title: 'SK Federation President',
    body: 'President of the Sangguniang Kabataan Federation. Represents Filipino youth aged 15–30.',
  },
  {
    icon: Award,
    title: 'IPMR',
    body: 'Indigenous Peoples Mandatory Representative. Voice of the city\'s indigenous communities in the SP.',
  },
];

const LocalOfficials: React.FC = () => {
  return (
    <>
      <SEO
        title="Local Officials Directory — GenSan"
        description="Directory of the elected local officials of General Santos City for the 2025-2028 term. Mayor, Vice Mayor, Lone District Representative, and the 12 elected members of the 21st Sangguniang Panlungsod."
        keywords="gensan officials, mayor lorelie pacquiao, vice mayor yumang, sangguniang panlungsod gensan, 21st sp gensan, shirlyn banas-nograles, gensan councilors 2025"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Government', href: '/government/departments' },
              { label: 'Local Officials' },
            ]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Users className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                21st Sangguniang Panlungsod · 2025–2028
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Local Officials Directory
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                The elected local officials of General Santos City for the
                2025-2028 term. Sourced from the May 2025 Philippine local
                elections and the 21st Sangguniang Panlungsod inaugurated
                on August 5, 2025.
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <a
                  href="https://sp.gensantos.gov.ph/the-21st-sangguniang-panlungsod-members/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
                >
                  <ScrollText className="h-3.5 w-3.5" />
                  Official SP roster
                </a>
                <a
                  href="https://gensantos.gov.ph/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 transition hover:border-primary-400 hover:bg-primary-50 hover:text-primary-700"
                >
                  Visit City Hall
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- City Hall Leadership ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Crown}
          eyebrow="City Hall"
          title="Executive leadership"
          helper="The Mayor heads the executive branch. The Vice Mayor presides over the Sangguniang Panlungsod."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {LEADERSHIP.map(l => (
            <article
              key={l.name}
              className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <l.icon className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700">
                  {l.position}
                </div>
                <h3 className="mt-0.5 text-base font-bold leading-snug text-gray-900">
                  {l.name}
                </h3>
                <p className="mt-1 text-[11px] text-gray-500">
                  {l.fullPosition}
                </p>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  {l.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      {/* ---------- Congressional Representative ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Gavel}
          eyebrow="House of Representatives"
          title="Congressional representative"
          helper="General Santos City is a lone congressional district. One representative serves the entire city in the House of Representatives."
        />

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {CONGRESS.map(c => (
            <article
              key={c.name}
              className="flex items-start gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <c.icon className="h-7 w-7" />
              </div>
              <div className="min-w-0 flex-grow">
                <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-700">
                  {c.position}
                </div>
                <h3 className="mt-0.5 text-base font-bold leading-snug text-gray-900">
                  {c.name}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-600">
                  {c.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      {/* ---------- 21st Sangguniang Panlungsod ---------- */}
      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={ScrollText}
          eyebrow="The 21st Sangguniang Panlungsod"
          title="City Council members"
          helper="Twelve elected councilors sit in the 21st Sangguniang Panlungsod for the 2025-2028 term. They draft, debate, and pass city ordinances and resolutions."
        />

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {COUNCILORS.map(c => (
            <article
              key={c.name}
              className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <h4 className="text-sm font-semibold leading-snug text-gray-900">
                  {c.name}
                </h4>
                <p className="mt-0.5 text-[11px] font-medium text-primary-700">
                  City Councilor
                </p>
                {c.notes && (
                  <p className="mt-1 text-[10px] text-gray-500">{c.notes}</p>
                )}
              </div>
            </article>
          ))}
        </div>

        {/* Ex officio sectoral seats */}
        <div className="mt-8">
          <h3 className="mb-3 text-[11px] font-bold uppercase tracking-[0.12em] text-gray-500">
            Ex-officio sectoral seats
          </h3>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {EX_OFFICIO.map(e => (
              <article
                key={e.title}
                className="flex items-start gap-3 rounded-xl border border-dashed border-gray-300 bg-white p-4 shadow-sm shadow-gray-900/[0.04]"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                  <e.icon className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-grow">
                  <h4 className="text-sm font-semibold leading-snug text-gray-900">
                    {e.title}
                  </h4>
                  <p className="mt-0.5 text-[10px] uppercase tracking-wider text-gray-500">
                    Ex-officio · 21st SP
                  </p>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-gray-600">
                    {e.body}
                  </p>
                </div>
              </article>
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-500">
            Specific names for the three ex-officio seats are not yet
            wired into BetterGensan. Check the official SP roster for the
            current designees.
          </p>
        </div>
      </PageSection>

      {/* ---------- Sources & verification ---------- */}
      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Info}
          eyebrow="Verification"
          title="Where this data comes from"
          helper="BetterGensan is not the official source. For legally binding rosters, always verify against the Sangguniang Panlungsod's own portal."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          <a
            href="https://sp.gensantos.gov.ph/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Landmark className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                  Sangguniang Panlungsod of GenSan
                </h4>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-primary-700" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                Official SP portal. Authoritative roster, news, and
                committee assignments.
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-primary-700">
                sp.gensantos.gov.ph
              </p>
            </div>
          </a>

          <a
            href="https://gensantos.gov.ph/"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-grow">
              <div className="flex items-start justify-between gap-2">
                <h4 className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                  Official LGU GenSan Portal
                </h4>
                <ExternalLink className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400 group-hover:text-primary-700" />
              </div>
              <p className="mt-1 text-xs leading-relaxed text-gray-600">
                City government website with executive directives,
                department info, and official contacts.
              </p>
              <p className="mt-1.5 text-[11px] font-medium text-primary-700">
                gensantos.gov.ph
              </p>
            </div>
          </a>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong>Heads up:</strong> Official titles and committee
              assignments can change between sessions. The 21st SP was
              inaugurated on August 5, 2025 and serves until 2028.
            </div>
          </div>
          <div className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <div>
              Spotted an error in this directory? Email{' '}
              <a
                href="mailto:psalm.catulpos@brigada.com.ph"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                psalm.catulpos@brigada.com.ph
              </a>{' '}
              and we'll correct it.
            </div>
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default LocalOfficials;
