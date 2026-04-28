// /privacy — Privacy Policy for BetterGensan.
//
// BetterGensan collects almost no personal data. The policy explicitly
// reflects that: no accounts on the public site, no tracking pixels, no
// ad networks, no transactional data collection. Server-side anonymous
// access logs are the only meaningful data trail. The policy is written
// in plain language and aligned with the Data Privacy Act of 2012 (RA
// 10173).

import {
  Cookie,
  Database,
  ExternalLink,
  Eye,
  Globe,
  Lock,
  Mail,
  ShieldCheck,
  ShieldOff,
  UserX,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

interface Block {
  icon: LucideIcon;
  title: string;
  body: string;
}

const COLLECTED: Block[] = [
  {
    icon: Globe,
    title: 'Anonymous request logs',
    body: 'Our hosting provider logs the same things every web server logs: timestamp, IP address, user agent, page requested, response code. These logs let us debug outages and detect abuse. We do not link them to a person.',
  },
  {
    icon: Database,
    title: 'Cached public records',
    body: 'BetterGensan caches public records from official LGU sources (executive orders, procurement notices, jobs from Indeed and LinkedIn). These records are about projects, businesses, and government activity. They do not contain private personal data about you.',
  },
];

const NOT_COLLECTED: Block[] = [
  {
    icon: UserX,
    title: 'No user accounts on the public site',
    body: "There are no sign-ups, logins, or profiles on the public side of BetterGensan. We do not know who you are when you browse, search, or click a link.",
  },
  {
    icon: Cookie,
    title: 'No tracking cookies, no ads, no analytics pixels',
    body: 'We do not run Google Analytics, Facebook Pixel, ad networks, or any third-party tracking script. We do not sell or share data because we do not have data to sell.',
  },
  {
    icon: ShieldOff,
    title: 'No transactional data',
    body: 'We never collect IDs, payments, scanned documents, biometric data, or signatures. Every transactional flow on BetterGensan redirects you to the official BIR, DSWD, Pag-IBIG, DENR, or LGU portal where the responsible agency handles your data under their own privacy policy.',
  },
];

const RIGHTS: Block[] = [
  {
    icon: Eye,
    title: 'Right to be informed',
    body: 'You are reading this notice. We tell you exactly what we collect and what we do not.',
  },
  {
    icon: Lock,
    title: 'Right to access and correct',
    body: 'If you believe BetterGensan is showing personally identifiable information about you that should not be public, email us and we will investigate within a reasonable time.',
  },
  {
    icon: ShieldCheck,
    title: 'Right to object',
    body: 'You can ask us to remove cached records that are no longer in the public interest. We honor such requests when they are reasonable and when the source data has actually been removed or corrected upstream.',
  },
];

const Privacy: React.FC = () => {
  return (
    <>
      <SEO
        path="/privacy"
        title="Privacy Policy — BetterGensan"
        description="Privacy policy for BetterGensan, the citizen-built portal for General Santos City. We collect almost no personal data, use no tracking, and host no ads."
        keywords="bettergensan privacy, gensan portal privacy, data privacy act, ra 10173"
      />

      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Privacy Policy' }]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Privacy · Plain Language
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Privacy Policy
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                BetterGensan collects almost no personal data. This page
                explains exactly what we do and do not handle, and your
                rights under the Data Privacy Act of 2012 (RA 10173).
                Last updated: April 8, 2026.
              </p>
            </div>
          </div>
        </div>
      </div>

      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Database}
          eyebrow="What we collect"
          title="The minimal data trail"
          helper="The only data BetterGensan handles is anonymous request logs and the cached public records that power the site."
        />

        <div className="space-y-3">
          {COLLECTED.map(b => (
            <article
              key={b.title}
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <b.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <h3 className="text-sm font-semibold text-gray-900">
                  {b.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-700">
                  {b.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={ShieldOff}
          eyebrow="What we do not collect"
          title="Things BetterGensan never asks for"
          helper="By design, we do not have a way to identify you, track you, or sell information about you."
        />

        <div className="space-y-3">
          {NOT_COLLECTED.map(b => (
            <article
              key={b.title}
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <b.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <h3 className="text-sm font-semibold text-gray-900">
                  {b.title}
                </h3>
                <p className="mt-2 text-xs leading-relaxed text-gray-700">
                  {b.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={ShieldCheck}
          eyebrow="Your rights under RA 10173"
          title="Data subject rights"
          helper="The Data Privacy Act of 2012 gives every Filipino specific rights over their personal data. Here is how those apply to BetterGensan."
        />

        <div className="grid gap-3 sm:grid-cols-3">
          {RIGHTS.map(r => (
            <article
              key={r.title}
              className="flex flex-col gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <r.icon className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900">
                {r.title}
              </h3>
              <p className="text-xs leading-relaxed text-gray-700">{r.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong>Privacy concerns?</strong> Email{' '}
              <a
                href="mailto:psalm.catulpos@brigada.com.ph"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                psalm.catulpos@brigada.com.ph
              </a>
              . We respond to legitimate data requests promptly.
            </div>
          </div>
          <a
            href="https://privacy.gov.ph/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700 transition hover:border-primary-300 hover:bg-primary-50/40"
          >
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <div>
              <strong className="text-gray-900">National Privacy Commission</strong>
              <br />
              For complaints about how any Philippine entity handles your
              personal data, visit{' '}
              <span className="font-medium text-primary-700">
                privacy.gov.ph
              </span>
              .
            </div>
          </a>
        </div>
      </PageSection>
    </>
  );
};

export default Privacy;
