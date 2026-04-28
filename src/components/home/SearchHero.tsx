// SearchHero — homepage hero with a real, functional search bar.
//
// Replaces the previous "BetterGensan AI" prompt mock. The search is purely
// client-side: it filters a static index of every public destination on the
// site (services, government pages, sectors, hotlines) using simple
// case-insensitive substring matching against label, description, and keyword
// tags. Pressing Enter on a result navigates to it. Pressing Enter with no
// result selected falls back to the first match.
//
// No external API, no AI, no backend dependency. The index is hand-curated
// here so future contributors can add a new destination by appending one
// line.

import {
  ArrowRight,
  Banknote,
  Briefcase,
  Building2,
  CornerDownLeft,
  FileText,
  Gift,
  Globe,
  HandHeart,
  HardHat,
  Heart,
  Home,
  Landmark,
  LayoutGrid,
  Scale,
  Search,
  ShieldAlert,
  Sparkles,
  Stethoscope,
  TreePine,
  Users,
  Wallet,
  Wheat,
  X,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from 'react';
import { useNavigate } from 'react-router-dom';

// ---------- Quick action pills (left column) ----------

interface QuickAction {
  icon: LucideIcon;
  label: string;
  href: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  { icon: Briefcase, label: 'Jobs', href: '#jobs' },
  { icon: Scale, label: 'Civic Decisions', href: '#civic-decisions' },
  { icon: Gift, label: 'Gov Opportunities', href: '#gov-opportunities' },
  { icon: Users, label: 'Population', href: '#population' },
  { icon: HandHeart, label: 'Join BetterGov', href: '#join-bettergov' },
];

// ---------- Search index ----------

interface SearchEntry {
  icon: LucideIcon;
  label: string;
  group: string;
  href: string;
  description: string;
  /** Extra tags to make the entry findable by alternate words / synonyms. */
  keywords: string;
}

const INDEX: SearchEntry[] = [
  // ----- Services -----
  {
    icon: FileText,
    label: 'Certificates',
    group: 'Services',
    href: '/services/certificates',
    description: 'Birth, marriage, death, barangay clearance, police clearance.',
    keywords: 'psa nbi cedula civil registry barangay id',
  },
  {
    icon: Briefcase,
    label: 'Business & Permits',
    group: 'Services',
    href: '/services/business',
    description: "Mayor's permit, DTI, SEC, BIR, sanitary permit, fire safety.",
    keywords:
      'bplo dti sec bir mayors permit msme negosyo eboss filipizen online renewal',
  },
  {
    icon: Globe,
    label: 'Online Services (eBOSS)',
    group: 'Services',
    href: '/eboss',
    description:
      'Apply for permits, pay taxes, and track applications online via Filipizen.',
    keywords:
      'eboss filipizen online permit renewal billing rpt building occupancy professional',
  },
  {
    icon: Wallet,
    label: 'Tax Payments',
    group: 'Services',
    href: '/services/tax-payments',
    description: 'Real property tax, business tax, BIR income tax, VAT, cedula.',
    keywords: 'rpt cedula vat ebirforms efps landbank gcash',
  },
  {
    icon: HandHeart,
    label: 'Social Services',
    group: 'Services',
    href: '/services/social-welfare',
    description: '4Ps, AICS, Senior Citizen, PWD, Solo Parent, PhilHealth, SSS.',
    keywords: 'cswdo dswd 4ps aics senior pwd solo parent philhealth sss gsis pag-ibig',
  },
  {
    icon: Stethoscope,
    label: 'Health Services',
    group: 'Services',
    href: '/services/health-services',
    description: 'Free vaccination, maternal care, TB-DOTS, HIV, mental health.',
    keywords: 'cho doh vaccine vaccination immunization tb dots hiv philhealth hospital',
  },
  {
    icon: Wheat,
    label: 'Agriculture & Fisheries',
    group: 'Services',
    href: '/services/agriculture-fisheries',
    description: 'RSBSA, free seeds, RCEF, PCIC insurance, BFAR, ATI training.',
    keywords: 'rsbsa rcef pcic bfar ati farmer fisherfolk tuna coconut',
  },
  {
    icon: HardHat,
    label: 'Infrastructure & Public Works',
    group: 'Services',
    href: '/services/infrastructure-public-works',
    description: 'Building permit, occupancy, water (GSCWD), electric (SOCOTECO).',
    keywords: 'obo gscwd socoteco building permit road drainage water electric dpwh',
  },
  {
    icon: Home,
    label: 'Housing & Land Use',
    group: 'Services',
    href: '/services/housing-land-use',
    description: 'Pag-IBIG housing loan, DHSUD, NHA, SHFC CMP, City Housing Office.',
    keywords: 'pag-ibig hdmf dhsud nha shfc cmp housing loan zoning',
  },
  {
    icon: Sparkles,
    label: 'Education',
    group: 'Services',
    href: '/services/education',
    description: 'DepEd, scholarships, TESDA, DOST-SEI, UniFAST free higher education.',
    keywords: 'deped tesda ched dost sei unifast scholarship als',
  },
  {
    icon: ShieldAlert,
    label: 'Public Safety',
    group: 'Services',
    href: '/services/disaster-preparedness',
    description: 'PNP stations, BFP, CDRRMO, PAGASA, PHIVOLCS, hotlines.',
    keywords: 'pnp police bfp fire cdrrmo ndrrmc pagasa phivolcs 911 emergency',
  },
  {
    icon: TreePine,
    label: 'Environment',
    group: 'Services',
    href: '/services/environment',
    description: 'Waste segregation, tree permits, ECC, hazardous waste, coastal cleanup.',
    keywords: 'cenro denr emb ra 9003 waste recycling ecc',
  },
  {
    icon: LayoutGrid,
    label: 'All Services',
    group: 'Services',
    href: '/services',
    description: 'Browse the full service catalog.',
    keywords: 'index catalog directory list',
  },

  // ----- Government -----
  {
    icon: Building2,
    label: 'City Departments',
    group: 'Government',
    href: '/government/departments',
    description: 'Directory of all GenSan local government departments and offices.',
    keywords: 'departments offices city hall directory bureau',
  },
  {
    icon: Users,
    label: 'Local Officials Directory',
    group: 'Government',
    href: '/government/officials',
    description: 'Mayor, Vice Mayor, councilors, and the 21st Sangguniang Panlungsod.',
    keywords: 'mayor vice mayor councilor pacquiao yumang sp sangguniang officials',
  },
  {
    icon: FileText,
    label: 'Executive Orders',
    group: 'Government',
    href: '/eo',
    description: 'Daily-refreshed full archive of GenSan executive orders.',
    keywords: 'eo mayoral order archive',
  },
  {
    icon: Landmark,
    label: 'Sangguniang Panglungsod',
    group: 'Government',
    href: '/splis',
    description:
      'Full archive of City Council ordinances and resolutions, paginated and filterable.',
    keywords:
      'sp sangguniang panglungsod ordinance resolution council legislation splis',
  },
  {
    icon: Banknote,
    label: 'Procurement',
    group: 'Government',
    href: '/procurement',
    description: 'Bids, awards, infra notices, and the price catalogue.',
    keywords: 'procurement bid bac awards bidresults indicative infra',
  },

  // ----- City -----
  {
    icon: Landmark,
    label: 'City Profile',
    group: 'City',
    href: '/city-profile',
    description: 'About General Santos City, geography, demographics, history.',
    keywords: 'about gensan history geography population barangays tuna capital',
  },
  {
    icon: Heart,
    label: 'About BetterGensan',
    group: 'City',
    href: '/about',
    description: 'What this portal is and how it works.',
    keywords: 'mission portal civic tech',
  },
  {
    icon: Briefcase,
    label: 'Jobs Near You',
    group: 'City',
    href: '/jobs',
    description: 'Latest Indeed and LinkedIn openings in GenSan.',
    keywords: 'jobs openings hiring indeed linkedin work career',
  },

  // ----- Homepage sectors (in-page anchors) -----
  {
    icon: Scale,
    label: 'Civic Decisions (executive orders + ordinances)',
    group: 'Homepage',
    href: '/#civic-decisions',
    description:
      'Latest mayoral orders, ordinances, and resolutions affecting General Santos City.',
    keywords:
      'eo executive order ordinance resolution sangguniang panglungsod sp council law',
  },
  {
    icon: HandHeart,
    label: 'Join BetterGensan',
    group: 'Homepage',
    href: '/#join-bettergov',
    description: 'Volunteer, contribute code, or suggest a dataset.',
    keywords: 'volunteer contribute github community open source',
  },
];

const popularPills = [
  { label: 'Business permit', q: 'business permit' },
  { label: 'Police clearance', q: 'police clearance' },
  { label: 'Pag-IBIG housing', q: 'pag-ibig housing' },
  { label: 'Procurement', q: 'procurement' },
  { label: 'Mayor', q: 'mayor' },
];

// ---------- Component ----------

const SearchHero = () => {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter the index for the current query.
  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [] as SearchEntry[];
    return INDEX.filter(e => {
      const haystack =
        `${e.label} ${e.description} ${e.keywords} ${e.group}`.toLowerCase();
      return haystack.includes(q);
    }).slice(0, 8);
  }, [query]);

  // Reset active row when results change.
  useEffect(() => {
    setActiveIndex(0);
  }, [results.length]);

  // Click outside closes the dropdown.
  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const go = (entry: SearchEntry) => {
    setOpen(false);
    setQuery('');
    if (entry.href.startsWith('#') || entry.href.startsWith('/#')) {
      const anchor = entry.href.replace(/^\/?#/, '#');
      navigate('/' + anchor);
      // Smooth scroll after navigation finishes
      setTimeout(() => {
        const el = document.querySelector(anchor);
        if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 80);
    } else {
      navigate(entry.href);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIndex(i => Math.min(i + 1, Math.max(0, results.length - 1)));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIndex(i => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = results[activeIndex] ?? results[0];
      if (target) go(target);
    } else if (e.key === 'Escape') {
      setOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <section className="py-10 md:py-14 [background:linear-gradient(135deg,#0032a0_0%,#003D82_100%)]">
      <div className="mx-auto max-w-[1100px] px-4">
        <div className="grid items-start gap-8 lg:grid-cols-2">
          {/* ---------- Left column ---------- */}
          <div className="text-white">
            <p className="mb-1.5 text-xs opacity-90">
              Your citizen portal for General Santos City
            </p>
            <h1 className="mb-3 text-2xl font-bold leading-tight md:text-3xl lg:text-4xl">
              What do you want to do today?
            </h1>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {QUICK_ACTIONS.map(({ icon: Icon, label, href }) => (
                <a
                  key={label}
                  href={href}
                  className="flex items-center gap-1.5 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-white transition hover:bg-white/20"
                >
                  <Icon className="h-3.5 w-3.5" />
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* ---------- Right column — functional search ---------- */}
          <div className="relative" ref={containerRef}>
            <div className="rounded-2xl bg-white p-3 shadow-xl shadow-primary-900/20 ring-1 ring-white/10">
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 transition focus-within:border-primary-500 focus-within:ring-1 focus-within:ring-primary-500">
                <Search className="h-4 w-4 shrink-0 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={query}
                  onChange={e => {
                    setQuery(e.target.value);
                    setOpen(true);
                  }}
                  onFocus={() => setOpen(true)}
                  onKeyDown={onKeyDown}
                  placeholder="Search services, departments, hotlines, EO archive…"
                  className="w-full bg-transparent text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none"
                  aria-label="Search BetterGensan"
                  autoComplete="off"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => {
                      setQuery('');
                      inputRef.current?.focus();
                    }}
                    aria-label="Clear search"
                    className="flex h-6 w-6 items-center justify-center rounded text-gray-400 transition hover:bg-gray-100 hover:text-gray-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
                <kbd className="hidden rounded border border-gray-200 bg-gray-50 px-1.5 py-0.5 text-[10px] font-medium text-gray-500 sm:inline-flex">
                  ↵
                </kbd>
              </div>

              {/* Popular search pills */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {popularPills.map(p => (
                  <button
                    key={p.q}
                    type="button"
                    onClick={() => {
                      setQuery(p.q);
                      setOpen(true);
                      inputRef.current?.focus();
                    }}
                    className="rounded-full border border-gray-200 bg-gray-50 px-2 py-0.5 text-[11px] text-gray-700 transition hover:border-primary-300 hover:bg-primary-50 hover:text-primary-700"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* ---------- Results dropdown ---------- */}
            {open && query.trim() && (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-xl shadow-primary-900/20">
                {results.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-500">
                    No matches for{' '}
                    <span className="font-semibold text-gray-700">
                      "{query}"
                    </span>
                  </div>
                ) : (
                  <ul className="max-h-[420px] overflow-y-auto py-1">
                    {results.map((r, i) => {
                      const active = i === activeIndex;
                      return (
                        <li key={`${r.group}-${r.label}-${r.href}`}>
                          <button
                            type="button"
                            onMouseEnter={() => setActiveIndex(i)}
                            onClick={() => go(r)}
                            className={`group flex w-full items-start gap-3 px-3 py-2.5 text-left transition ${
                              active ? 'bg-primary-50' : 'bg-white'
                            }`}
                          >
                            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/10">
                              <r.icon className="h-4 w-4" />
                            </div>
                            <div className="min-w-0 flex-grow">
                              <div className="flex items-baseline justify-between gap-2">
                                <span className="truncate text-sm font-semibold text-gray-900">
                                  {r.label}
                                </span>
                                <span className="shrink-0 text-[10px] font-medium uppercase tracking-wider text-primary-700">
                                  {r.group}
                                </span>
                              </div>
                              <p className="mt-0.5 line-clamp-1 text-[11px] text-gray-600">
                                {r.description}
                              </p>
                            </div>
                            <ArrowRight
                              className={`mt-1 h-3.5 w-3.5 shrink-0 transition ${
                                active
                                  ? 'translate-x-0.5 text-primary-700'
                                  : 'text-gray-300'
                              }`}
                            />
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50 px-3 py-1.5 text-[10px] text-gray-500">
                  <div className="flex items-center gap-3">
                    <span className="inline-flex items-center gap-1">
                      <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 font-medium">
                        ↑
                      </kbd>
                      <kbd className="rounded border border-gray-200 bg-white px-1 py-0.5 font-medium">
                        ↓
                      </kbd>
                      navigate
                    </span>
                    <span className="inline-flex items-center gap-1">
                      <CornerDownLeft className="h-3 w-3" />
                      open
                    </span>
                  </div>
                  <span>{results.length} results</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

    </section>
  );
};

export default SearchHero;
