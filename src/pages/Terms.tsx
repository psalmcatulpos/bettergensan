// /terms — Terms of Use for BetterGensan.
//
// Plain-language civic terms. BetterGensan is a citizen-built, unofficial
// portal that surfaces public records and city information. The terms make
// the limits of that role explicit: no warranty on accuracy, no liability
// for action taken on the data, no transactional services, public-domain
// content where possible, and a clear pointer to the official LGU portal
// for legally binding information.

import {
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Eye,
  FileText,
  Mail,
  Scale,
  Shield,
  ShieldCheck,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

interface Clause {
  icon: LucideIcon;
  title: string;
  body: string;
}

const CLAUSES: Clause[] = [
  {
    icon: Eye,
    title: '1. Acceptance of these terms',
    body: "By accessing or using BetterGensan you agree to these Terms of Use. If you do not agree, please stop using the site. We may update these terms from time to time. Continued use after an update means you accept the revised terms.",
  },
  {
    icon: FileText,
    title: '2. What BetterGensan is',
    body: "BetterGensan is an independent, citizen-built information portal for General Santos City. It caches and surfaces public records, civic data, and city services so residents have one place to find them. It is not the official website of the Local Government Unit of General Santos City.",
  },
  {
    icon: Shield,
    title: '3. No warranty on accuracy',
    body: "Records on BetterGensan are mirrored from official sources via scheduled scrapers. We make a reasonable effort to keep them current, but the content is provided AS-IS without any warranty of accuracy, completeness, fitness for a particular purpose, or non-infringement. Always verify against the official source before acting on any information.",
  },
  {
    icon: AlertTriangle,
    title: '4. No professional advice',
    body: "Information on BetterGensan is for general informational purposes only. It is not legal, medical, financial, tax, or professional advice. For binding decisions, consult a licensed professional or the relevant government office.",
  },
  {
    icon: ShieldCheck,
    title: '5. No transactional services',
    body: "BetterGensan does not collect documents, accept payments, process applications, or submit forms on your behalf. Every transactional link redirects you to the official BIR, DSWD, Pag-IBIG, DENR, LGU, or other responsible portal. We never ask for fees, signatures, or bank details.",
  },
  {
    icon: Scale,
    title: '6. Acceptable use',
    body: "Use BetterGensan for personal, civic, journalistic, research, or educational purposes. You may not abuse the service, attempt to overload it, scrape it at scale without permission, impersonate anyone, or use it to harass or defraud others. We reserve the right to rate-limit or block abusive traffic.",
  },
  {
    icon: FileText,
    title: '7. Public-domain content',
    body: 'Most content surfaced on BetterGensan is in the public domain because it originates from Philippine government bodies and is therefore not subject to copyright under the Intellectual Property Code (Section 176). Where third-party content is shown, it remains the property of its original owner. The BetterGensan codebase itself is open source under the MIT License.',
  },
  {
    icon: ExternalLink,
    title: '8. Third-party links',
    body: 'BetterGensan links to official government portals and other third-party sites. We are not responsible for the content, availability, or practices of those sites. Following an external link is at your own risk.',
  },
  {
    icon: Shield,
    title: '9. Limitation of liability',
    body: 'To the maximum extent allowed by law, BetterGensan and its volunteer maintainers are not liable for any damages arising from the use or inability to use the service, or from reliance on any information shown on the site.',
  },
  {
    icon: Scale,
    title: '10. Governing law',
    body: 'These terms are governed by the laws of the Republic of the Philippines. Any dispute will be subject to the exclusive jurisdiction of the courts of General Santos City, South Cotabato.',
  },
];

const Terms: React.FC = () => {
  return (
    <>
      <SEO
        title="Terms of Use — BetterGensan"
        description="Plain-language Terms of Use for BetterGensan, the citizen-built portal for General Santos City."
        keywords="bettergensan terms of use, gensan portal terms, civic portal disclaimer"
      />

      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Terms of Use' }]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Scale className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Legal · Plain Language
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Terms of Use
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                The plain-language rules for using BetterGensan, a
                citizen-built civic portal for General Santos City.
                Last updated: April 8, 2026.
              </p>
            </div>
          </div>
        </div>
      </div>

      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={FileText}
          eyebrow="The agreement"
          title="Terms in plain language"
          helper="Ten short clauses covering what BetterGensan is, what it is not, and the limits of using it."
        />

        <div className="space-y-3">
          {CLAUSES.map(c => (
            <article
              key={c.title}
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <c.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <h3 className="text-sm font-semibold leading-snug text-gray-900">
                  {c.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-700">
                  {c.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={CheckCircle2}
          eyebrow="Quick summary"
          title="The short version"
          helper="If you only read one section, read this one."
        />

        <ul className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]">
          {[
            'BetterGensan is unofficial. The official city site is gensantos.gov.ph.',
            'Information is provided AS-IS without warranty of accuracy.',
            'We never collect documents, payments, or personal data on transactional flows.',
            'For legal, medical, tax, or financial decisions, consult a licensed professional.',
            'The codebase is MIT-licensed. Most surfaced government content is public domain.',
            'Be respectful. Do not abuse the service or use it to harm others.',
          ].map(line => (
            <li
              key={line}
              className="flex items-start gap-2 text-sm text-gray-700"
            >
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
              <span>{line}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
          <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div>
            Questions about these terms? Email{' '}
            <a
              href="mailto:psalm.catulpos@brigada.com.ph"
              className="font-semibold text-primary-700 hover:text-primary-800"
            >
              psalm.catulpos@brigada.com.ph
            </a>
            .
          </div>
        </div>
      </PageSection>
    </>
  );
};

export default Terms;
