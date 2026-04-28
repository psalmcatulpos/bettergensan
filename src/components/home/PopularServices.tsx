// PopularServices — homepage sector that links residents to the most-used
// citizen service category pages. Sits directly under PlatformValue and
// before the primary data sectors so the most-requested entry points are
// surfaced before the data dashboards begin.
//
// Each card is a brand-icon tile, eyebrow, title, body, and a quiet CTA
// arrow. The whole card is a Link, so the entire surface is clickable.

import {
  ArrowRight,
  Briefcase,
  FileText,
  HardHat,
  HeartHandshake,
  LayoutGrid,
  ShieldAlert,
  Stethoscope,
  Wallet,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import PageSection from '../ui/PageSection';
import SectionHeading from '../ui/SectionHeading';
import useReveal from '../../hooks/useReveal';

interface ServiceLink {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
  href: string;
}

const SERVICES: ServiceLink[] = [
  {
    icon: FileText,
    eyebrow: 'Civic Documents',
    title: 'Certificates',
    body: 'Birth, marriage, death, barangay clearance, barangay ID, and police clearance.',
    href: '/services/certificates',
  },
  {
    icon: Briefcase,
    eyebrow: 'For Entrepreneurs',
    title: 'Business & Permits',
    body: "Mayor's permit (apply online via Filipizen), DTI / SEC, BIR registration, and the 5-step path to launch a business.",
    href: '/services/business',
  },
  {
    icon: Wallet,
    eyebrow: 'Pay Your Dues',
    title: 'Tax Payments',
    body: 'Real property tax, business tax, cedula, BIR income tax, VAT, and ePayment channels.',
    href: '/services/tax-payments',
  },
  {
    icon: HeartHandshake,
    eyebrow: 'Aid & Assistance',
    title: 'Social Services',
    body: '4Ps, AICS, Senior Citizen, PWD, Solo Parent, and PhilHealth, SSS, GSIS membership.',
    href: '/services/social-welfare',
  },
  {
    icon: Stethoscope,
    eyebrow: 'Free & Affordable',
    title: 'Health Services',
    body: 'Free vaccination, maternal care, TB-DOTS, HIV testing, and the GenSan hospital map.',
    href: '/services/health-services',
  },
  {
    icon: ShieldAlert,
    eyebrow: 'Emergencies',
    title: 'Public Safety',
    body: 'PNP police stations map, BFP, CDRRMO, and the full directory of emergency hotlines.',
    href: '/services/disaster-preparedness',
  },
  {
    icon: HardHat,
    eyebrow: 'Roads & Utilities',
    title: 'Infrastructure',
    body: 'Building and occupancy permits, water and electric connections, and damage reports.',
    href: '/services/infrastructure-public-works',
  },
  {
    icon: LayoutGrid,
    eyebrow: 'Browse all',
    title: 'All Services',
    body: 'Open the full Services index for every category and quick reference link.',
    href: '/services',
  },
];

const PopularServices = () => {
  const headingRef = useReveal();
  const gridRef = useReveal();

  return (
    <PageSection background="white" tier="secondary">
      <div ref={headingRef} className="reveal">
      <SectionHeading
        tier="secondary"
        icon={LayoutGrid}
        eyebrow="Popular services"
        title="Quick access to citizen services"
        helper="The eight service categories residents request most. Tap any tile to open the full guide with steps, requirements, and direct links to the responsible office."
        action={
          <Link
            to="/services"
            className="inline-flex items-center gap-1 rounded-full bg-primary-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-primary-700"
          >
            View all services
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        }
      />
      </div>

      <div ref={gridRef} className="reveal grid gap-3 sm:grid-cols-2 lg:grid-cols-4" style={{ '--reveal-delay': '100ms' } as React.CSSProperties}>
        {SERVICES.map(s => (
          <Link
            key={s.title}
            to={s.href}
            className="group flex flex-col rounded-2xl border border-gray-200 bg-white p-5 shadow-sm shadow-gray-900/[0.04] transition-[border-color,transform] duration-[var(--dur-fast)] hover:border-primary-200 motion-safe:hover:-translate-y-px"
          >
            <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <s.icon className="h-5 w-5" />
            </div>
            <div className="mb-1 text-[10px] font-semibold uppercase tracking-[0.12em] text-primary-700">
              {s.eyebrow}
            </div>
            <h3 className="text-sm font-semibold leading-snug text-gray-900">
              {s.title}
            </h3>
            <p className="mt-1.5 flex-grow text-xs leading-relaxed text-gray-600">
              {s.body}
            </p>
            <span className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-primary-700 group-hover:text-primary-800">
              Open
              <ArrowRight className="h-3 w-3 transition group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </PageSection>
  );
};

export default PopularServices;
