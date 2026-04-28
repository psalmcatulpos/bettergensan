// /faq — Frequently Asked Questions for BetterGensan.
//
// 5 categories of questions covering: what BetterGensan is, how data flows
// in, what residents can and can't do here, why some links go off-site, and
// how to get involved. Each question is a native <details> element so it's
// keyboard- and screen-reader-friendly out of the box.

import {
  ChevronDown,
  ExternalLink,
  Github,
  HelpCircle,
  Mail,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

interface QA {
  q: string;
  a: string;
}

interface Group {
  icon: LucideIcon;
  title: string;
  helper: string;
  items: QA[];
}

const GROUPS: Group[] = [
  {
    icon: Sparkles,
    title: 'About BetterGensan',
    helper: 'What this portal is, who runs it, and what it costs.',
    items: [
      {
        q: 'Is BetterGensan the official General Santos City website?',
        a: 'No. The official LGU website is gensantos.gov.ph. BetterGensan is an independent, citizen-built civic portal that surfaces public records and links to the official sources. We are not affiliated with the city government.',
      },
      {
        q: 'Who runs BetterGensan?',
        a: 'Volunteer GenSan residents. The codebase is open source and the project is built in the open. There is no government agency, political party, or corporation behind it.',
      },
      {
        q: 'How much does this cost the people of GenSan?',
        a: 'Zero pesos. BetterGensan is built and run by volunteers. No taxpayer funds, no LGU budget, no political endorsements.',
      },
      {
        q: 'Why does this exist if there is already an official website?',
        a: "The official site hosts critical records but it is hard to navigate, frequently goes down, and presents data in formats designed for internal staff. BetterGensan turns the same data into a clean, citizen-friendly view, and maintains a daily-refreshed cached archive that survives outages and never silently deletes records.",
      },
    ],
  },
  {
    icon: ScrollText,
    title: 'Data & sources',
    helper: 'How information gets into BetterGensan and how fresh it is.',
    items: [
      {
        q: 'Where does the data come from?',
        a: 'Executive orders are scraped daily from eo.gensantos.gov.ph. Procurement records come from procurement.gensantos.gov.ph across 7 datasets. Job listings come from Indeed and LinkedIn. City profile and weather data come from PSA and Open-Meteo. Every page lists its data sources at the bottom.',
      },
      {
        q: 'How fresh is the cached data?',
        a: 'Cached datasets refresh once per day in the early hours (UTC). Every section shows a freshness badge that tells you when it was last successfully synced and whether the source is currently delayed or offline.',
      },
      {
        q: 'What if a record disappears from the official site?',
        a: 'BetterGensan never deletes records by sync. If a record vanishes upstream, we mark it as "no longer available" and keep showing the cached copy with a clear archived banner. The public record stays public.',
      },
      {
        q: 'I noticed a typo or wrong information on a record. Can you fix it?',
        a: 'Cached records are presented as scraped, so the fix has to happen at the official source. The DB value remains the audit-safe source of truth. If you spot something genuinely wrong on a BetterGensan-built page (like a phone number we hand-curated), email us and we will correct it.',
      },
    ],
  },
  {
    icon: ShieldCheck,
    title: 'What you can and cannot do here',
    helper: 'The limits of BetterGensan as a civic convenience layer.',
    items: [
      {
        q: 'Can I apply for a permit or pay a fee on BetterGensan?',
        a: 'No. BetterGensan does not collect documents, accept payments, or process applications. Every transactional flow redirects you to the official BIR, DSWD, Pag-IBIG, DENR, or LGU portal where the responsible agency handles your data and your money.',
      },
      {
        q: 'Why do most CTAs link to other websites?',
        a: 'Because that is where the actual transactions happen. BetterGensan is a directory and dashboard, not a service provider. Linking to the official portal also keeps the trust chain clean: your fee goes to the right agency, not to a third party.',
      },
      {
        q: 'Can I use BetterGensan as legal or tax advice?',
        a: 'No. The site is for general informational purposes only. For legal, tax, medical, or financial decisions, consult a licensed professional or the relevant government office. See the Terms of Use for the full disclaimer.',
      },
      {
        q: 'What happens if a hotline or address on BetterGensan is wrong?',
        a: 'We pulled most contact info from the official department directories and verified what we could. If you find a stale number or address, email us and we will update it. For emergencies, always dial 911 first.',
      },
    ],
  },
  {
    icon: Users,
    title: 'Privacy & accounts',
    helper: 'What we know about you when you use the site.',
    items: [
      {
        q: 'Do I need an account to use BetterGensan?',
        a: 'No. There are no sign-ups, logins, or profiles on the public side of the portal. You can browse, search, click links, and read records without creating anything.',
      },
      {
        q: 'Do you track me?',
        a: 'No tracking pixels, no analytics scripts, no ad networks. The hosting provider keeps the same anonymous request logs every web server keeps, and that is all. See the Privacy Policy for the full breakdown.',
      },
      {
        q: 'Why does the AI search bar exist if there is no AI?',
        a: 'The homepage hero has a real working search bar, not an AI prompt. It does plain client-side substring matching against a hand-curated index of every public page on the site. No requests are sent anywhere when you type.',
      },
    ],
  },
  {
    icon: Wrench,
    title: 'Get involved',
    helper: 'How residents and developers can contribute.',
    items: [
      {
        q: 'Can I contribute code?',
        a: 'Yes. The codebase lives at github.com/psalmcatulpos/bettergensan under the CC0 (public domain) license. Pull requests for bug fixes, accessibility improvements, new dataset integrations, and content corrections are welcome.',
      },
      {
        q: 'Can I contribute content or local research?',
        a: 'Absolutely. Spotted an outdated department phone number, a new local program worth surfacing, or a gap in our data coverage? Email psalm.catulpos@brigada.com.ph and tell us. Local residents are the best source of ground truth.',
      },
      {
        q: 'What is on the roadmap?',
        a: 'Verified ex-officio sectoral reps for the 21st Sangguniang Panlungsod, more Leaflet maps for departments and barangay halls, Tagalog and Cebuano translations, and improved screen-reader support for the embedded PDF previews. Open issues on GitHub for the running list.',
      },
    ],
  },
];

const FAQ: React.FC = () => {
  return (
    <>
      <SEO
        path="/faq"
        title="FAQ — BetterGensan"
        description="Frequently asked questions about BetterGensan, the citizen-built portal for General Santos City. Data sources, privacy, what we do and do not do."
        keywords="bettergensan faq, gensan portal questions, civic tech philippines"
      />

      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'FAQ' }]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <HelpCircle className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Plain Answers
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Frequently Asked Questions
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Common questions about BetterGensan, where the data comes
                from, what we do and do not do, and how to get involved.
              </p>
            </div>
          </div>
        </div>
      </div>

      {GROUPS.map((g, idx) => (
        <PageSection
          key={g.title}
          background={idx % 2 === 0 ? 'white' : 'gray'}
          tier="secondary"
        >
          <SectionHeading
            tier="secondary"
            icon={g.icon}
            eyebrow={`Section ${idx + 1}`}
            title={g.title}
            helper={g.helper}
          />

          <div className="space-y-2">
            {g.items.map(qa => (
              <details
                key={qa.q}
                className="group rounded-2xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04] open:border-primary-300"
              >
                <summary className="flex cursor-pointer items-start justify-between gap-3 p-5 list-none [&::-webkit-details-marker]:hidden">
                  <span className="text-sm font-semibold leading-snug text-gray-900 group-open:text-primary-700">
                    {qa.q}
                  </span>
                  <ChevronDown className="mt-0.5 h-4 w-4 shrink-0 text-gray-500 transition group-open:rotate-180 group-open:text-primary-700" />
                </summary>
                <div className="border-t border-gray-100 px-5 py-4 text-sm leading-relaxed text-gray-700">
                  {qa.a}
                </div>
              </details>
            ))}
          </div>
        </PageSection>
      ))}

      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Mail}
          eyebrow="Still curious?"
          title="Get in touch"
          helper="Email us, open a GitHub issue, or read the full About page."
        />

        <div className="grid gap-3 sm:grid-cols-3">
          <a
            href="mailto:psalm.catulpos@brigada.com.ph"
            className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Mail className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                Email us
              </div>
              <div className="text-[11px] text-gray-500">
                psalm.catulpos@brigada.com.ph
              </div>
            </div>
          </a>
          <a
            href="https://github.com/psalmcatulpos/bettergensan"
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Github className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                GitHub
              </div>
              <div className="text-[11px] text-gray-500">
                psalmcatulpos/bettergensan
              </div>
            </div>
          </a>
          <a
            href="/about"
            className="group flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm shadow-gray-900/[0.04] transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <ExternalLink className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-semibold text-gray-900 group-hover:text-primary-700">
                About BetterGensan
              </div>
              <div className="text-[11px] text-gray-500">
                Mission, stack, and the team
              </div>
            </div>
          </a>
        </div>
      </PageSection>
    </>
  );
};

export default FAQ;
