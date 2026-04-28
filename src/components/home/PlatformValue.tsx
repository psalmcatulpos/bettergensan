// PlatformValue — featured "what BetterGensan helps you do" block, sits
// directly under the hero. Acts as a platform identity statement so the
// homepage opens with intent before the data sectors begin.
//
// Three feature cards, each with an icon, title, helper line, and a quiet
// inline link into the relevant sector. The block is intentionally compact
// (one row on desktop, stacked on mobile) so it bridges the hero and the
// first heavy primary sector without competing with either.

import { Briefcase, Gavel, Scale } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import useReveal from '../../hooks/useReveal';

interface ValueCard {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
  cta: string;
}

const CARDS: ValueCard[] = [
  {
    icon: Briefcase,
    eyebrow: 'Work',
    title: 'Find local work',
    body: 'Live Indeed and LinkedIn listings filtered to General Santos City, refreshed daily into one clean feed.',
    href: '/jobs',
    cta: 'See open jobs',
  },
  {
    icon: Scale,
    eyebrow: 'Civic decisions',
    title: 'Follow what City Hall decides',
    body: 'Executive orders from the Mayor and the full archive of Sangguniang Panglungsod ordinances and resolutions — searchable and never deleted.',
    href: '/#civic-decisions',
    cta: 'Browse civic records',
  },
  {
    icon: Gavel,
    eyebrow: 'Procurement',
    title: 'Track public bids and awards',
    body: 'Open bids, alternative procurement, infrastructure notices, the price catalogue, and historical awards from the GenSan BAC.',
    href: '/procurement',
    cta: 'View procurement',
  },
];

const PlatformValue = () => {
  const headingRef = useReveal();
  const cardsRef = useReveal();

  return (
    <section className="section-dots border-y border-gray-100">
      <div className="mx-auto max-w-[1100px] px-4 py-7 sm:py-8">
        {/* ----- Heading ----- */}
        <div ref={headingRef} className="reveal mb-5 max-w-2xl">
          <div className="mb-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary-700">
            Citizen Portal
          </div>
          <h2 className="text-2xl font-bold leading-tight tracking-tight text-gray-900 sm:text-3xl">
            Built for everyday life in General Santos City
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            One trustworthy place for what's happening in GenSan today —
            jobs, civic decisions from the Mayor and City Council, and every
            public bid and award. Cached daily, source-linked, and never
            silently deleted.
          </p>
        </div>

        {/* ----- Cards ----- */}
        <div ref={cardsRef} className="reveal grid gap-4 sm:grid-cols-2 lg:grid-cols-3" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
          {CARDS.map(card => (
            <article
              key={card.title}
              className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
            >
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-50 text-primary-700 ring-1 ring-primary-100">
                <card.icon className="h-5 w-5" />
              </div>
              <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-700">
                {card.eyebrow}
              </div>
              <h3 className="text-base font-semibold leading-snug text-gray-900">
                {card.title}
              </h3>
              <p className="mt-2 flex-grow text-sm leading-relaxed text-gray-600">
                {card.body}
              </p>
              <Link
                to={card.href}
                className="mt-4 inline-flex items-center gap-1 text-xs font-semibold text-primary-700 transition hover:text-primary-800"
              >
                {card.cta}
                <span aria-hidden className="transition group-hover:translate-x-0.5">
                  →
                </span>
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PlatformValue;
