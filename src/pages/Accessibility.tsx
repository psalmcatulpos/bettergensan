// /accessibility — Accessibility statement for BetterGensan.
//
// Plain-language description of how the portal supports screen readers,
// keyboard navigation, color contrast, responsive layouts, and language.
// Includes a clear feedback channel for accessibility issues. We aim for
// WCAG 2.1 AA but the page is honest about being a work in progress.

import {
  Accessibility as AccessibilityIcon,
  ExternalLink,
  Keyboard,
  Languages,
  Mail,
  MonitorSmartphone,
  ScanEye,
  Type,
  Volume2,
  Wrench,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import SectionHeading from '../components/ui/SectionHeading';
import PageSection from '../components/ui/PageSection';

interface Feature {
  icon: LucideIcon;
  title: string;
  body: string;
}

const FEATURES: Feature[] = [
  {
    icon: Keyboard,
    title: 'Keyboard navigation',
    body: 'Every interactive element on BetterGensan can be reached and activated using the keyboard. Tab moves forward, Shift+Tab moves back, Enter or Space activates buttons and links. The homepage search bar supports ↑ ↓ to move through results and Enter to open.',
  },
  {
    icon: Volume2,
    title: 'Screen reader support',
    body: 'We use semantic HTML elements (headings, lists, buttons, landmarks) so screen readers like NVDA, JAWS, and VoiceOver can navigate the structure. Icons that convey meaning have aria-labels. Decorative icons are hidden from assistive tech.',
  },
  {
    icon: ScanEye,
    title: 'Color contrast',
    body: 'Body text, links, and form controls aim for WCAG 2.1 AA contrast ratios (4.5:1 for normal text, 3:1 for large text). The brand blue used for actions and headings was chosen specifically to meet AA against white backgrounds.',
  },
  {
    icon: MonitorSmartphone,
    title: 'Responsive at every size',
    body: 'The whole site is mobile-first. Layouts reflow cleanly from a 320px phone screen up to a 1100px desktop column. Tables and grids switch to scrollable views or single-column lists on smaller screens.',
  },
  {
    icon: Type,
    title: 'Readable typography',
    body: 'Default body text is 14px with at least 1.5 line-height. The browser zoom and the OS-level text-size accessibility setting both work without breaking the layout.',
  },
  {
    icon: Languages,
    title: 'Plain language',
    body: 'Government documents are often written in legal or bureaucratic language. We rewrite headlines, eyebrows, and helper text into plain civic English so residents can understand what each service is and how to access it.',
  },
];

const KNOWN_GAPS = [
  'PDF previews on the executive orders detail page rely on Google Drive embeds, which are not fully WCAG-compliant. We are evaluating in-page text extraction as a fallback.',
  'Leaflet maps (hospitals, police stations) include marker popups but the underlying map canvas is not screen-reader accessible. The HTML directory list below each map provides the same data in an accessible format.',
  'Some scraped government titles are stored ALL CAPS upstream. The UI normalizes them at render time, but a few edge cases may still appear in upper case.',
  'Multi-language support is not yet wired up. The interface is currently English-only.',
];

const Accessibility: React.FC = () => {
  return (
    <>
      <SEO
        path="/accessibility"
        title="Accessibility — BetterGensan"
        description="How BetterGensan handles screen readers, keyboard navigation, color contrast, and accessibility for residents of General Santos City."
        keywords="bettergensan accessibility, wcag 2.1 aa, screen reader, civic portal accessibility"
      />

      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'Accessibility' }]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <AccessibilityIcon className="h-6 w-6" />
            </div>
            <div>
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Accessibility · WCAG 2.1 AA target
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                Accessibility
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                How BetterGensan supports keyboard navigation, screen
                readers, color contrast, and plain civic language. Our goal
                is full WCAG 2.1 AA conformance, and we are honest about
                where we are not there yet.
              </p>
            </div>
          </div>
        </div>
      </div>

      <PageSection background="white" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={AccessibilityIcon}
          eyebrow="What we support"
          title="Accessibility features"
          helper="Six accessibility commitments built into BetterGensan from the ground up."
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {FEATURES.map(f => (
            <article
              key={f.title}
              className="flex items-start gap-3 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
                <f.icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-grow">
                <h3 className="text-sm font-semibold leading-snug text-gray-900">
                  {f.title}
                </h3>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-700">
                  {f.body}
                </p>
              </div>
            </article>
          ))}
        </div>
      </PageSection>

      <PageSection background="gray" tier="secondary">
        <SectionHeading
          tier="secondary"
          icon={Wrench}
          eyebrow="Honest about limits"
          title="Known gaps"
          helper="Things we know are not fully accessible yet, and what we are doing about them."
        />

        <ul className="space-y-2.5 rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04]">
          {KNOWN_GAPS.map(g => (
            <li
              key={g}
              className="flex items-start gap-2 text-sm text-gray-700"
            >
              <Wrench className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
              <span>{g}</span>
            </li>
          ))}
        </ul>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
            <Mail className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
            <div>
              <strong>Found an accessibility barrier?</strong> Email{' '}
              <a
                href="mailto:psalm.catulpos@brigada.com.ph"
                className="font-semibold text-primary-700 hover:text-primary-800"
              >
                psalm.catulpos@brigada.com.ph
              </a>
              . Tell us what page, what tool you were using, and what
              happened. We treat accessibility issues as priority bugs.
            </div>
          </div>
          <a
            href="https://www.w3.org/TR/WCAG21/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-start gap-2 rounded-xl border border-gray-200 bg-white p-3 text-xs text-gray-700 transition hover:border-primary-300 hover:bg-primary-50/40"
          >
            <ExternalLink className="mt-0.5 h-4 w-4 shrink-0 text-primary-600" />
            <div>
              <strong className="text-gray-900">WCAG 2.1 reference</strong>
              <br />
              The Web Content Accessibility Guidelines we measure against.
              W3C Recommendation, 2018.
            </div>
          </a>
        </div>
      </PageSection>
    </>
  );
};

export default Accessibility;
