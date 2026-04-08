// SectionHeading — standardized header for any homepage sector or content
// block. Establishes a clear typography hierarchy:
//
//   eyebrow      — small uppercase tag, optional, sets context
//   title        — main heading (size scales with `tier`)
//   helper       — short descriptive line, smaller and muted
//   action       — optional right-aligned link / button
//
// `tier` controls visual weight so primary sectors look heavier than
// secondary or utility sectors without each component re-deriving sizes.
//
//   primary    → text-3xl, eyebrow text-primary-700, larger gap
//   secondary  → text-2xl, eyebrow text-gray-500
//   utility    → text-xl,  eyebrow text-gray-400, helper inline
//
// Usage:
//   <SectionHeading
//     tier="primary"
//     icon={Briefcase}
//     eyebrow="Work"
//     title="Jobs Near You"
//     helper="Latest openings updated daily"
//     action={<Link to="/jobs">View all jobs</Link>}
//   />

import type { LucideIcon } from 'lucide-react';
import { cn } from '../../lib/utils';

export type SectionTier = 'primary' | 'secondary' | 'utility';

/**
 * Two visual styles for the section icon tile:
 *   tinted — soft brand wash (bg-primary-50 + ring), the default
 *   solid  — brand-filled tile (bg-primary-600 + white glyph)
 *
 * Sections on the homepage alternate between these two for rhythm.
 */
export type SectionIconVariant = 'tinted' | 'solid';

interface SectionHeadingProps {
  tier?: SectionTier;
  icon?: LucideIcon;
  eyebrow?: string;
  title: string;
  helper?: string;
  action?: React.ReactNode;
  className?: string;
  /** Visual style of the icon tile. Defaults to 'tinted'. */
  iconVariant?: SectionIconVariant;
  /** Override the icon wrapper classes (use for signature sections that
   *  need a heavier, brand-filled icon tile). */
  iconClassName?: string;
  /** Override the title classes (use sparingly — e.g. signature sections). */
  titleClassName?: string;
}

const TITLE_CLASSES: Record<SectionTier, string> = {
  primary:
    'text-2xl sm:text-3xl font-bold tracking-tight text-gray-900 leading-tight',
  secondary: 'text-xl sm:text-2xl font-bold tracking-tight text-gray-900',
  utility: 'text-lg sm:text-xl font-semibold text-gray-900',
};

const EYEBROW_CLASSES: Record<SectionTier, string> = {
  primary: 'text-primary-600',
  secondary: 'text-primary-600',
  utility: 'text-primary-600',
};

const HELPER_CLASSES: Record<SectionTier, string> = {
  primary: 'text-sm text-gray-900',
  secondary: 'text-sm text-gray-900',
  utility: 'text-xs text-gray-900',
};

// Tier controls size + rounding; iconVariant controls fill style.
// Primary tier is slightly larger to anchor heavier sections.
const ICON_SIZE_WRAP: Record<SectionTier, string> = {
  primary: 'h-11 w-11 rounded-xl',
  secondary: 'h-10 w-10 rounded-xl',
  utility: 'h-10 w-10 rounded-xl',
};

const ICON_VARIANT_WRAP: Record<SectionIconVariant, string> = {
  tinted: 'bg-primary-50 text-primary-700 ring-1 ring-primary-100',
  solid:
    'bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20',
};

const ICON_SIZE: Record<SectionTier, string> = {
  primary: 'h-5 w-5',
  secondary: 'h-5 w-5',
  utility: 'h-5 w-5',
};

const SectionHeading = ({
  tier = 'secondary',
  icon: Icon,
  eyebrow,
  title,
  helper,
  action,
  className,
  iconVariant = 'solid',
  iconClassName,
  titleClassName,
}: SectionHeadingProps) => {
  return (
    <div
      className={cn(
        'mb-6 flex flex-wrap items-start justify-between gap-4',
        tier === 'primary' && 'mb-8',
        tier === 'utility' && 'mb-4',
        className
      )}
    >
      <div className="flex items-start gap-3">
        {Icon && (
          <div
            className={cn(
              'flex shrink-0 items-center justify-center',
              ICON_SIZE_WRAP[tier],
              ICON_VARIANT_WRAP[iconVariant],
              iconClassName
            )}
          >
            <Icon className={ICON_SIZE[tier]} />
          </div>
        )}
        <div className="min-w-0">
          {eyebrow && (
            <div
              className={cn(
                'mb-1 text-[11px] font-semibold uppercase tracking-[0.12em]',
                EYEBROW_CLASSES[tier]
              )}
            >
              {eyebrow}
            </div>
          )}
          <h2 className={cn(TITLE_CLASSES[tier], titleClassName)}>{title}</h2>
          {helper && (
            <p className={cn('mt-1 max-w-2xl', HELPER_CLASSES[tier])}>
              {helper}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0 self-center">{action}</div>}
    </div>
  );
};

export default SectionHeading;
