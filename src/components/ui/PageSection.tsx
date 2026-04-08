// PageSection — standardized full-width section with a centered narrow inner
// container. Use this for any homepage sector or top-level content block so
// every page on BetterGensan shares the same width, padding, and rhythm.
//
// Two knobs:
//
//   background — controls the band color:
//     'white'        plain
//     'gray'         gray-50
//     'tinted'       primary-tinted band, used to spotlight the signature
//                    section so it stands out from neighboring blocks
//     'transparent'  no fill
//
//   tier — controls vertical breathing room and signals visual hierarchy:
//     'primary'    py-12 — Make Money / Jobs / Safety / GovOpps
//     'secondary'  py-8  — Local Prices / Transport / Community
//     'utility'    py-6  — Government Services
//     'flush'      py-0  — when the child component manages its own padding
//
// The header inside should use <SectionHeading tier="..."/> with the same
// tier so heading size and section padding stay in sync.

import { cn } from '../../lib/utils';

export type PageSectionBackground =
  | 'white'
  | 'gray'
  | 'tinted'
  | 'transparent';

export type PageSectionTier = 'primary' | 'secondary' | 'utility' | 'flush';

interface PageSectionProps {
  children: React.ReactNode;
  background?: PageSectionBackground;
  tier?: PageSectionTier;
  /** Optional anchor id (e.g. for hash-link nav). */
  id?: string;
  /** Extra classes appended to the outer <section>. */
  className?: string;
  /** Extra classes appended to the inner centered container. */
  innerClassName?: string;
}

const BG_CLASSES: Record<PageSectionBackground, string> = {
  white: 'bg-white',
  gray: 'bg-gray-50',
  tinted:
    'bg-gradient-to-b from-primary-50/60 via-white to-white border-y border-primary-100/60',
  transparent: '',
};

const TIER_PADDING: Record<PageSectionTier, string> = {
  primary: 'py-12 sm:py-14',
  secondary: 'py-8 sm:py-10',
  utility: 'py-6 sm:py-8',
  flush: 'py-0',
};

const PageSection = ({
  children,
  background = 'white',
  tier = 'secondary',
  id,
  className,
  innerClassName,
}: PageSectionProps) => {
  return (
    <section
      id={id}
      className={cn(BG_CLASSES[background], TIER_PADDING[tier], className)}
    >
      <div className={cn('mx-auto max-w-[1100px] px-4', innerClassName)}>
        {children}
      </div>
    </section>
  );
};

export default PageSection;

// ----------------------------------------------------------------------------
// PageContainer — narrow centered column without the full-width band.
// Use for detail pages and standalone content blocks where you don't need
// alternating section backgrounds. Same width as PageSection's inner container.
// ----------------------------------------------------------------------------

interface PageContainerProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContainer = ({ children, className }: PageContainerProps) => (
  <div className={cn('mx-auto max-w-[1100px] px-4', className)}>{children}</div>
);
