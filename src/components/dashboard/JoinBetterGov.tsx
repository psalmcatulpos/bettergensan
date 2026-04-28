// JoinBetterGov — final homepage sector (utility tier, dotted background).
// Replaces the previous "Government Services / Quick Links" sector. Pulls
// residents into the BetterGensan community: volunteer, contribute code,
// suggest a dataset, or just spread the word. The whole portal is built
// and run by volunteers, so this is the asks block.
//
// All links go to existing routes or external services (GitHub, mailto).
// Cards are clickable surfaces, not just text + buttons.

import {
  ArrowRight,
  Github,
  HandHeart,
  Heart,
  MessageSquare,
  Sparkles,
  Users,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageSection from '../ui/PageSection';
import SectionHeading from '../ui/SectionHeading';
import useReveal from '../../hooks/useReveal';

interface Way {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  /** Empty string = disabled / coming soon (renders as non-interactive). */
  href: string;
  external?: boolean;
  cta: string;
}

const WAYS: Way[] = [
  {
    icon: HandHeart,
    eyebrow: 'Volunteer',
    title: 'Join the BetterGov community',
    body: 'Help build the citizen portal. Design, code, content, local research, accessibility testing. Volunteer slots are open.',
    href: 'https://bettergov.ph/join-us',
    external: true,
    cta: 'Get involved',
  },
  {
    icon: Github,
    eyebrow: 'Code',
    title: 'Contribute on GitHub',
    body: 'BetterGensan is open source. Pull requests for bug fixes, new datasets, and accessibility improvements are welcome.',
    href: 'https://github.com/psalmcatulpos/bettergensan',
    external: true,
    cta: 'View on GitHub',
  },
  {
    icon: MessageSquare,
    eyebrow: 'Suggest',
    title: 'Suggest a dataset',
    body: 'Spotted a public dataset we should surface, or an outdated department phone number? Email us and we will reconcile.',
    href: 'mailto:psalm.catulpos@brigada.com.ph',
    external: true,
    cta: 'Email the team',
  },
  {
    icon: Sparkles,
    eyebrow: 'Why',
    title: 'Cost to GenSan: ₱0',
    body: 'BetterGensan is built and run by volunteers. No taxpayer funds, no LGU budget, no political endorsement. Read the mission.',
    href: '/about',
    cta: 'About BetterGensan',
  },
];

const JoinBetterGov = () => {
  const headingRef = useReveal();
  const gridRef = useReveal();

  return (
    <PageSection
      id="join-bettergov"
      background="transparent"
      tier="utility"
      className="section-dots"
    >
      <div ref={headingRef} className="reveal">
      <SectionHeading
        tier="utility"
        icon={Heart}
        eyebrow="Join us"
        title="Help build BetterGensan"
        helper="BetterGensan is built by GenSan residents, for GenSan residents. Four ways to plug in."
      />
      </div>

      <div ref={gridRef} className="reveal grid gap-3 sm:grid-cols-2 lg:grid-cols-4" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
        {WAYS.map(w => {
          const disabled = w.href === '';
          const className = disabled
            ? 'flex flex-col rounded-2xl border border-dashed border-gray-200 bg-gray-50/60 p-5 cursor-default'
            : 'group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px';
          const inner = (
            <>
              <div
                className={`mb-4 flex h-11 w-11 items-center justify-center rounded-xl ring-1 shadow-sm ${
                  disabled
                    ? 'bg-gray-300 text-white ring-gray-400 shadow-gray-500/20'
                    : 'bg-primary-600 text-white ring-primary-700 shadow-primary-900/20'
                }`}
              >
                <w.icon className="h-5 w-5" />
              </div>
              <div
                className={`mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] ${
                  disabled ? 'text-gray-500' : 'text-primary-700'
                }`}
              >
                {w.eyebrow}
              </div>
              <h3
                className={`text-sm font-semibold leading-snug ${
                  disabled ? 'text-gray-700' : 'text-gray-900'
                }`}
              >
                {w.title}
              </h3>
              <p
                className={`mt-1.5 flex-grow text-xs leading-relaxed ${
                  disabled ? 'text-gray-500' : 'text-gray-600'
                }`}
              >
                {w.body}
              </p>
              <span
                className={`mt-3 inline-flex items-center gap-1 text-[11px] font-semibold ${
                  disabled
                    ? 'text-gray-500'
                    : 'text-primary-700 group-hover:text-primary-800'
                }`}
              >
                {w.cta}
                {!disabled && (
                  <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
                )}
              </span>
            </>
          );
          if (disabled) {
            return (
              <div key={w.title} className={className} aria-disabled="true">
                {inner}
              </div>
            );
          }
          return w.external ? (
            <a
              key={w.title}
              href={w.href}
              target={w.href.startsWith('mailto:') ? undefined : '_blank'}
              rel={w.href.startsWith('mailto:') ? undefined : 'noopener noreferrer'}
              className={className}
            >
              {inner}
            </a>
          ) : (
            <Link key={w.title} to={w.href} className={className}>
              {inner}
            </Link>
          );
        })}
      </div>

      <div className="mt-6 flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 p-3 text-xs text-blue-900">
        <Users className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
        <div>
          <strong>Built in the open.</strong> Every line of code, every
          dataset, and every design decision is reviewable on GitHub.
          BetterGensan is a citizen-built civic portal, not an official
          city service.
        </div>
      </div>
    </PageSection>
  );
};

export default JoinBetterGov;
