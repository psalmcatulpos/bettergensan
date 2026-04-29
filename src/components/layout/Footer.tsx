// Footer — 3-column layout for BetterGensan.
//
//   Col 1  Brand block: logo, name, tagline, social icons
//   Col 2  QUICK LINKS — internal portal pages
//   Col 3  RESOURCES — external official portals
//
// Internal links use react-router <Link>; external links open in a new tab.
// The previous CTA stack (Cost / Volunteer / Contribute / Contact) was
// removed in favor of the JoinBetterGov homepage sector that surfaces the
// same calls to action with more breathing room.

import { Facebook, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

interface FooterLink {
  label: string;
  href: string;
  external?: boolean;
}

const QUICK_LINKS: FooterLink[] = [
  { label: 'About BetterGensan', href: '/about' },
  { label: 'Terms of Use', href: '/terms' },
  { label: 'Privacy Policy', href: '/privacy' },
  { label: 'Accessibility', href: '/accessibility' },
  { label: 'FAQ', href: '/faq' },
];

// Official GenSan and national portals we link, cite, or cache from. Curated
// to match what BetterGensan actually surfaces (executive orders, SP records,
// procurement, health, demographics) plus the two national civic-tech anchors.
const RESOURCES: FooterLink[] = [
  // ----- GenSan official subdomains -----
  {
    label: 'Official City Government Portal',
    href: 'https://gensantos.gov.ph',
    external: true,
  },
  {
    label: 'Executive Orders (eo.gensantos.gov.ph)',
    href: 'https://eo.gensantos.gov.ph',
    external: true,
  },
  {
    label: 'Sangguniang Panlungsod (sp.gensantos.gov.ph)',
    href: 'https://sp.gensantos.gov.ph',
    external: true,
  },
  {
    label: 'SP Legislative Documents (SPLIS)',
    href: 'https://splis.gensantos.gov.ph',
    external: true,
  },
  {
    label: 'Procurement Portal (BAC)',
    href: 'https://procurement.gensantos.gov.ph',
    external: true,
  },
  {
    label: 'City Health Office',
    href: 'https://cho.gensantos.gov.ph',
    external: true,
  },
  {
    label: 'CHO Online Appointment',
    href: 'https://choappointment.gensantos.gov.ph',
    external: true,
  },
  // ----- National civic-tech anchors -----
  {
    label: 'Philippine Statistics Authority',
    href: 'https://psa.gov.ph',
    external: true,
  },
  {
    label: 'Open Data Philippines',
    href: 'https://data.gov.ph',
    external: true,
  },
  {
    label: 'Freedom of Information',
    href: 'https://www.foi.gov.ph',
    external: true,
  },
];

const SOCIAL_LINKS = [
  {
    label: 'Facebook',
    href: 'https://www.facebook.com/bettergovph',
    Icon: Facebook,
  },
  {
    label: 'Discord',
    href: 'https://discord.com/invite/mHtThpN8bT',
    Icon: MessageCircle,
  },
];

const FooterLinkItem: React.FC<{ link: FooterLink }> = ({ link }) => {
  const className =
    'footer-link text-sm text-gray-400 hover:text-white transition-colors duration-[200ms]';
  if (link.external) {
    return (
      <a
        href={link.href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {link.label}
      </a>
    );
  }
  return (
    <Link to={link.href} className={className}>
      {link.label}
    </Link>
  );
};

const Footer: React.FC = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="mx-auto max-w-[1100px] px-4 pb-8 pt-14">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-2 lg:grid-cols-12">
          {/* ---------- Col 1: Brand ---------- */}
          <div className="lg:col-span-4">
            <Link to="/" className="mb-4 flex items-center gap-3">
              <img
                src="/logo.png"
                alt=""
                className="h-12 w-12 object-contain"
              />
              <div className="leading-tight">
                <div className="text-base font-bold">
                  Better<span className="text-primary-300">Gensan</span>
                </div>
                <div className="text-[10px] uppercase tracking-[0.14em] text-gray-500">
                  .org
                </div>
              </div>
            </Link>
            <p className="mb-5 max-w-xs text-sm leading-relaxed text-gray-400">
              Empowering the people of General Santos City with transparent
              access to public records, services, and city information.
            </p>
            <div className="flex items-center gap-2">
              {SOCIAL_LINKS.map(({ label, href, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/5 text-gray-300 transition hover:bg-white/10 hover:text-white"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ---------- Col 2: Quick Links ---------- */}
          <div className="lg:col-span-3">
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Quick Links
            </h3>
            <ul className="space-y-2.5">
              {QUICK_LINKS.map(link => (
                <li key={link.label}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </div>

          {/* ---------- Col 3: Resources ---------- */}
          <div className="lg:col-span-5">
            <h3 className="mb-4 text-[11px] font-bold uppercase tracking-[0.14em] text-gray-500">
              Resources
            </h3>
            <ul className="space-y-2.5">
              {RESOURCES.map(link => (
                <li key={link.label}>
                  <FooterLinkItem link={link} />
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* ---------- Bottom strip ---------- */}
        <div className="mt-12 flex flex-col items-start justify-between gap-4 border-t border-white/10 pt-6 text-xs text-gray-500 md:flex-row md:items-center">
          <div className="flex items-center gap-3">
            <a
              href="https://bettergov.ph"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Part of the BetterGov movement"
              className="shrink-0 opacity-70 transition hover:opacity-100"
            >
              <img
                src="/bettergov-footer.svg"
                alt="BetterGov"
                className="h-10 w-auto"
              />
            </a>
            <p>
              © {new Date().getFullYear()} BetterGensan. All content is public
              domain unless otherwise specified.
            </p>
          </div>
          <p className="text-[11px]">
            Powered by{' '}
            <span className="font-medium text-gray-300">Regiment</span> ·
            Developed by{' '}
            <span className="font-medium text-gray-300">Psalm Catulpos</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
