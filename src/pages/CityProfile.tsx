// /city-profile — General Santos City overview.
// Polished civic profile, not a wall of text. Static content compiled from
// public references — citations are listed at the bottom.

import { useEffect, useState } from 'react';
import {
  Anchor,
  Award,
  Banknote,
  BookOpen,
  Building2,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Compass,
  Droplets,
  Gauge,
  Globe,
  Globe2,
  Hash,
  Landmark,
  Languages,
  MapIcon,
  MapPin,
  Mountain,
  Network,
  PartyPopper,
  Plane,
  Scale,
  ScrollText,
  ShieldCheck,
  Sparkles,
  Star,
  Sun,
  TrendingUp,
  Trophy,
  Users,
  Waves,
  Wind,
} from 'lucide-react';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';

// ---------- Shared types ----------

interface StatCard {
  icon: typeof Users;
  label: string;
  value: string;
  detail?: string;
}

interface BigStat {
  icon: typeof Users;
  label: string;
  value: string;
  detail: string;
}

interface HighlightCard {
  icon: typeof Trophy;
  title: string;
  body: string;
}

// ---------- BIG headline stats (3) ----------

const BIG_STATS: BigStat[] = [
  {
    icon: Users,
    label: 'Population',
    value: '722,059',
    detail: '2024 PSA census (declared 2025)',
  },
  {
    icon: Compass,
    label: 'Land area',
    value: '492.86 km²',
    detail: 'mixed coastal, urban, agricultural',
  },
  {
    icon: Hash,
    label: 'Barangays',
    value: '26',
    detail: 'each with an elected council',
  },
];

// ---------- Map ----------

// OpenStreetMap embed centered on General Santos City (06°06′N · 125°10′E).
// bbox is min_lon, min_lat, max_lon, max_lat.
const GENSAN_LAT = 6.1164;
const GENSAN_LON = 125.1716;
const MAP_BBOX = '125.05,5.95,125.30,6.25';
const MAP_MARKER = `${GENSAN_LAT},${GENSAN_LON}`;
const MAP_EMBED_URL = `https://www.openstreetmap.org/export/embed.html?bbox=${MAP_BBOX}&layer=mapnik&marker=${MAP_MARKER}`;
const MAP_LINK_URL = `https://www.openstreetmap.org/?mlat=${GENSAN_LAT}&mlon=${GENSAN_LON}#map=11/${GENSAN_LAT}/${GENSAN_LON}`;

// ---------- Weather (Open-Meteo, no API key) ----------

interface WeatherData {
  temp: number;
  humidity: number;
  windKmh: number;
  code: number;
  currentTime: string;
  hourly: Array<{ time: string; temp: number; code: number }>;
}

async function fetchWeather(): Promise<WeatherData | null> {
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${GENSAN_LAT}&longitude=${GENSAN_LON}` +
    `&current=temperature_2m,relative_humidity_2m,wind_speed_10m,weather_code` +
    `&hourly=temperature_2m,weather_code` +
    `&forecast_days=2&timezone=Asia%2FManila&wind_speed_unit=kmh`;
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    // deno-lint-ignore no-explicit-any
    const data: any = await res.json();
    const currentTime: string = data.current.time;
    const idx: number = data.hourly.time.findIndex(
      (t: string) => t > currentTime
    );
    const startIdx = idx === -1 ? 0 : idx;
    const hourly = (data.hourly.time as string[])
      .slice(startIdx, startIdx + 4)
      .map((t, i) => ({
        time: t,
        temp: Math.round(data.hourly.temperature_2m[startIdx + i]),
        code: data.hourly.weather_code[startIdx + i],
      }));
    return {
      temp: Math.round(data.current.temperature_2m),
      humidity: Math.round(data.current.relative_humidity_2m),
      windKmh: Math.round(data.current.wind_speed_10m),
      code: data.current.weather_code,
      currentTime,
      hourly,
    };
  } catch {
    return null;
  }
}

// WMO weather code → Lucide icon
function weatherIcon(code: number): typeof Sun {
  if (code === 0) return Sun;
  if (code <= 2) return CloudSun;
  if (code === 3) return Cloud;
  if (code === 45 || code === 48) return CloudFog;
  if (code >= 51 && code <= 57) return CloudDrizzle;
  if (code >= 61 && code <= 67) return CloudRain;
  if (code >= 71 && code <= 77) return CloudSnow;
  if (code >= 80 && code <= 82) return CloudRain;
  if (code === 85 || code === 86) return CloudSnow;
  if (code >= 95) return CloudLightning;
  return Cloud;
}

function weatherLabel(code: number): string {
  if (code === 0) return 'Clear sky';
  if (code === 1) return 'Mainly clear';
  if (code === 2) return 'Partly cloudy';
  if (code === 3) return 'Overcast';
  if (code === 45 || code === 48) return 'Fog';
  if (code >= 51 && code <= 57) return 'Drizzle';
  if (code >= 61 && code <= 67) return 'Rain';
  if (code >= 71 && code <= 77) return 'Snow';
  if (code >= 80 && code <= 82) return 'Rain showers';
  if (code === 85 || code === 86) return 'Snow showers';
  if (code === 95) return 'Thunderstorm';
  if (code >= 96) return 'Thunderstorm + hail';
  return 'Cloudy';
}

// Format "2026-04-07T15:00" (Manila local) → "3 PM"
function formatHour(iso: string): string {
  const hour = parseInt(iso.slice(11, 13), 10);
  if (hour === 0) return '12 AM';
  if (hour === 12) return '12 PM';
  if (hour < 12) return `${hour} AM`;
  return `${hour - 12} PM`;
}

// ---------- Grouped detail cards ----------

const GEOGRAPHY: StatCard[] = [
  {
    icon: MapPin,
    label: 'Location',
    value: '06°06\u2032N · 125°10\u2032E',
    detail: 'southern Mindanao',
  },
  {
    icon: MapIcon,
    label: 'Borders',
    value: 'Polomolok · Tupi · Tampakan · Alabel · Maasim',
    detail: 'South Cotabato + Sarangani',
  },
  {
    icon: Waves,
    label: 'Coastline',
    value: 'Sarangani Bay',
    detail: 'natural deep-water harbor',
  },
  {
    icon: CloudSun,
    label: 'Climate',
    value: 'Tropical · Type IV',
    detail: 'rainfall evenly distributed',
  },
  {
    icon: Plane,
    label: 'Access',
    value: 'GES airport · Makar Wharf',
    detail: 'air, sea, and road gateway',
  },
  {
    icon: Mountain,
    label: 'Topography',
    value: 'Coastal lowland to upland',
    detail: 'sea level → 600 m+ in inland barangays',
  },
];

const DEMOGRAPHICS: StatCard[] = [
  {
    icon: Users,
    label: 'Population',
    value: '722,059',
    detail: '2024 PSA census (declared 2025)',
  },
  {
    icon: Gauge,
    label: 'Density',
    value: '1,415 / km²',
    detail: '2020 PSA reference date',
  },
  {
    icon: TrendingUp,
    label: 'Growth rate',
    value: '+3.24 % / yr',
    detail: '2015\u20132020 PSA, annualized',
  },
  {
    icon: Languages,
    label: 'Languages',
    value: 'Cebuano · Filipino · English',
    detail: 'plus Hiligaynon, Ilonggo, Blaan',
  },
  {
    icon: Globe2,
    label: 'Ethnic mix',
    value: 'Cebuano · Hiligaynon · Ilocano',
    detail: 'and indigenous Blaan, Maguindanaon',
  },
  {
    icon: Building2,
    label: 'Avg. household size',
    value: '4.11',
    detail: 'persons / household (PSA 2015)',
  },
];

const ADMINISTRATIVE: StatCard[] = [
  {
    icon: ShieldCheck,
    label: 'City type',
    value: 'Highly Urbanized City',
    detail: 'independent of South Cotabato',
  },
  {
    icon: Hash,
    label: 'Barangays',
    value: '26',
    detail: 'each with an elected council',
  },
  {
    icon: MapIcon,
    label: 'District',
    value: 'Lone',
    detail: '1 representative to Congress',
  },
  {
    icon: Globe,
    label: 'Region',
    value: 'SOCCSKSARGEN',
    detail: 'Region XII regional center',
  },
  {
    icon: Scale,
    label: 'Government',
    value: 'Mayor + Sangguniang Panlungsod',
    detail: 'elected city council',
  },
  {
    icon: Banknote,
    label: 'Income class',
    value: '1st-class HUC',
    detail: 'highest LGU income tier',
  },
];

const IDENTITY: HighlightCard[] = [
  {
    icon: Trophy,
    title: 'Tuna Capital of the Philippines',
    body: 'One of Southeast Asia\u2019s largest tuna landing and processing centers. Six major canneries operate in the city, supplying canned tuna to North American, European, and Asian markets.',
  },
  {
    icon: Plane,
    title: 'Gateway to southern Mindanao',
    body: 'Makar Wharf and General Santos International Airport make the city the principal entry point for cargo, agriculture exports, tourism, and travel into southern Mindanao.',
  },
  {
    icon: Network,
    title: 'Regional commercial center',
    body: 'The administrative and commercial heart of SOCCSKSARGEN (Region XII), with banking, retail, BPO, and government regional offices serving four provinces.',
  },
  {
    icon: PartyPopper,
    title: 'Cultural crossroads',
    body: 'A meeting point for Cebuano, Hiligaynon, Ilocano, Ilonggo, and indigenous Blaan and Maguindanaon communities living and working side by side, celebrated each year at the Kalilangan Festival.',
  },
];

const REFERENCES = [
  {
    label: 'Official City Government Website',
    href: 'https://gensantos.gov.ph/',
  },
  {
    label: 'Philippine Statistics Authority — 2024 Census of Population',
    href: 'https://psa.gov.ph/',
  },
  {
    label: 'Republic Act No. 5412 (Charter of General Santos City)',
    href: 'https://lawphil.net/statutes/repacts/ra1968/ra_5412_1968.html',
  },
  {
    label: 'DILG Profile — General Santos City',
    href: 'https://www.dilg.gov.ph/',
  },
];

const CityProfile: React.FC = () => {
  return (
    <>
      <SEO
        title="General Santos City Profile"
        description="Overview of General Santos City: history, population, geography, economy, government, and key facts. The Tuna Capital of the Philippines."
        keywords="general santos city, gensan profile, gensan history, gensan economy, soccsksargen, mindanao, tuna capital"
      />

      {/* ---------- Hero ---------- */}
      <div className="bg-gray-50 py-10">
        <div className="mx-auto max-w-[1100px] px-4">
          <Breadcrumbs
            items={[{ label: 'Home', href: '/' }, { label: 'City Profile' }]}
            className="mb-4"
          />
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white ring-1 ring-primary-700 shadow-sm shadow-primary-900/20">
              <MapPin className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-primary-600">
                Highly Urbanized City · SOCCSKSARGEN
              </div>
              <h1 className="text-2xl font-bold tracking-tight text-gray-900 sm:text-3xl">
                General Santos City Profile
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-gray-900">
                Tuna Capital of the Philippines · Regional center of
                SOCCSKSARGEN · Gateway to southern Mindanao. Geography,
                demographics, economy, and government — sourced from PSA,
                gensantos.gov.ph, and PhilAtlas.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- Centered narrow page wrapper ---------- */}
      <div className="mx-auto max-w-[1100px] space-y-8 px-4 py-6">
        {/* BIG headline stats (3) */}
        <section>
          <div className="grid gap-3 md:grid-cols-3">
            {BIG_STATS.map(s => (
              <BigStatCard key={s.label} stat={s} />
            ))}
          </div>
        </section>

        {/* Weather + Map */}
        <section>
          <SectionHeader
            icon={MapPin}
            title="Weather & map"
            tagline="Live conditions · OpenStreetMap location"
          />
          <div className="mt-3 grid gap-3 lg:grid-cols-3">
            <div className="lg:col-span-1">
              <WeatherCard />
            </div>
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:col-span-2">
              <iframe
                src={MAP_EMBED_URL}
                title="Map of General Santos City"
                className="h-[340px] w-full"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 px-3 py-2 text-[11px] text-gray-500">
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-primary-600" />
                  City Hall · 06°06′N · 125°10′E
                </span>
                <a
                  href={MAP_LINK_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline decoration-dotted hover:text-primary-700"
                >
                  Larger on OpenStreetMap →
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* History timeline */}
        <section>
          <HistoryTimeline />
        </section>

        {/* Geography */}
        <section>
          <SectionHeader
            icon={Mountain}
            title="Geography"
            tagline="Where the city sits in Mindanao"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GEOGRAPHY.map(s => (
              <StatCardItem key={s.label} stat={s} />
            ))}
          </div>
        </section>

        {/* Demographics */}
        <section>
          <SectionHeader
            icon={Users}
            title="Demographics"
            tagline="Who lives in GenSan today"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DEMOGRAPHICS.map(s => (
              <StatCardItem key={s.label} stat={s} />
            ))}
          </div>
        </section>

        {/* Administrative */}
        <section>
          <SectionHeader
            icon={Landmark}
            title="Administrative"
            tagline="How GenSan is governed"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ADMINISTRATIVE.map(s => (
              <StatCardItem key={s.label} stat={s} />
            ))}
          </div>
          <p className="mt-3 text-[11px] text-gray-500">
            For up-to-date executive orders, procurement notices, and official
            announcements, see the live data on the{' '}
            <a
              href="/"
              className="text-primary-600 underline decoration-dotted hover:text-primary-700"
            >
              BetterGensan home page
            </a>
            .
          </p>
        </section>

        {/* Identity */}
        <section>
          <SectionHeader
            icon={Star}
            title="Identity"
            tagline="The city's role in the Philippines"
          />
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {IDENTITY.map(h => (
              <HighlightCardItem key={h.title} card={h} />
            ))}
          </div>
        </section>

        {/* References */}
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-4">
          <div className="mb-2 flex items-center gap-2">
            <ScrollText className="h-3.5 w-3.5 text-gray-500" />
            <h2 className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
              Data sources & references
            </h2>
          </div>
          <ul className="space-y-1 text-[11px] text-gray-600">
            {REFERENCES.map(r => (
              <li key={r.href}>
                ·{' '}
                <a
                  href={r.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary-600 underline decoration-dotted hover:text-primary-700"
                >
                  {r.label}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-[10px] text-gray-400">
            BetterGensan is a citizen-built portal. This profile compiles
            information from public sources; figures may differ from the
            latest official records.
          </p>
        </section>
      </div>
    </>
  );
};

export default CityProfile;

// ----------------------------------------------------------------------------
// Reusable section bits — header w/ icon, stat card, highlight card.
// Pure presentation, hover lift, primary-700 accent matches the timeline.
// ----------------------------------------------------------------------------

interface SectionHeaderProps {
  icon: typeof Users;
  title: string;
  tagline?: string;
}

const SectionHeader = ({ icon: Icon, title, tagline }: SectionHeaderProps) => (
  <div className="flex items-center gap-2">
    <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-100 text-primary-600">
      <Icon className="h-4 w-4" />
    </div>
    <div>
      <h2 className="text-base font-bold leading-tight text-gray-900">
        {title}
      </h2>
      {tagline && <p className="text-[11px] text-gray-500">{tagline}</p>}
    </div>
  </div>
);

interface BigStatCardProps {
  stat: BigStat;
}

const BigStatCard = ({ stat }: BigStatCardProps) => (
  <article className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-primary-50/40 p-3.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md">
    {/* Decorative blob top-right */}
    <div
      className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full bg-primary-100/60 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
      aria-hidden
    />
    <div className="relative flex items-center gap-3">
      <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white shadow-sm transition-transform duration-300 group-hover:scale-110">
        <stat.icon className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[10px] font-semibold uppercase tracking-wider text-primary-700">
          {stat.label}
        </div>
        <div className="text-2xl font-bold leading-none text-gray-900">
          {stat.value}
        </div>
        <div className="mt-0.5 truncate text-[11px] text-gray-500">
          {stat.detail}
        </div>
      </div>
    </div>
  </article>
);

interface StatCardItemProps {
  stat: StatCard;
}

const StatCardItem = ({ stat }: StatCardItemProps) => (
  <div className="group rounded-lg border border-gray-200 bg-white p-3 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm">
    <div className="mb-2 flex h-7 w-7 items-center justify-center rounded-md bg-primary-50 text-primary-600 transition-colors duration-300 group-hover:bg-primary-700 group-hover:text-white">
      <stat.icon className="h-3.5 w-3.5" />
    </div>
    <div className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
      {stat.label}
    </div>
    <div className="mt-0.5 text-sm font-bold leading-tight text-gray-900">
      {stat.value}
    </div>
    {stat.detail && (
      <div className="mt-0.5 text-[11px] leading-snug text-gray-500">
        {stat.detail}
      </div>
    )}
  </div>
);

interface HighlightCardItemProps {
  card: HighlightCard;
}

const HighlightCardItem = ({ card }: HighlightCardItemProps) => (
  <article className="group relative overflow-hidden rounded-xl border border-gray-200 bg-gradient-to-br from-white to-primary-50/40 p-4 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md">
    {/* Decorative blur blob */}
    <div
      className="pointer-events-none absolute -right-5 -top-5 h-20 w-20 rounded-full bg-primary-100/60 blur-2xl transition-opacity duration-300 group-hover:opacity-80"
      aria-hidden
    />
    <div className="relative flex gap-3">
      <div className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary-700 text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3">
        <card.icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="text-sm font-bold leading-snug text-gray-900">
          <Sparkles className="mr-1 inline h-3 w-3 text-primary-500" />
          {card.title}
        </h3>
        <p className="mt-1 text-[12px] leading-snug text-gray-700">
          {card.body}
        </p>
      </div>
    </div>
  </article>
);

// ----------------------------------------------------------------------------
// WeatherCard — live current conditions + 4-hour forecast for General Santos.
// Data: Open-Meteo (https://open-meteo.com), free, no API key, CORS-enabled.
// Falls back silently if the API is unreachable so it never breaks the page.
// ----------------------------------------------------------------------------

const WeatherCard = () => {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const w = await fetchWeather();
      if (cancelled) return;
      setWeather(w);
      setLoading(false);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <div className="flex h-full min-h-[340px] items-center justify-center rounded-xl border border-gray-200 bg-white text-xs text-gray-400 shadow-sm">
        Loading weather…
      </div>
    );
  }

  if (!weather) {
    return (
      <div className="flex h-full min-h-[340px] items-center justify-center rounded-xl border border-dashed border-gray-200 bg-gray-50 px-3 text-center text-[11px] text-gray-500">
        Live weather temporarily unavailable.
      </div>
    );
  }

  const Icon = weatherIcon(weather.code);
  const label = weatherLabel(weather.code);

  return (
    <div className="flex h-full flex-col rounded-xl border border-gray-200 bg-white p-3.5 shadow-sm">
      {/* Current conditions */}
      <div className="flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary-50 text-primary-600">
          <Icon className="h-6 w-6" />
        </div>
        <div className="flex-1">
          <div className="text-3xl font-bold leading-none text-gray-900">
            {weather.temp}°C
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[12px] text-gray-700">
            {label}
            <span className="h-1.5 w-1.5 rounded-full bg-success-500" />
          </div>
          <div className="mt-1.5 flex items-center gap-1 text-[11px] text-primary-600">
            <MapPin className="h-3 w-3" />
            General Santos, South Cotabato
          </div>
        </div>
      </div>

      <div className="my-2.5 border-t border-gray-100" />

      {/* Humidity + wind */}
      <div className="flex items-center gap-4 text-[12px] text-gray-700">
        <span className="inline-flex items-center gap-1">
          <Droplets className="h-3.5 w-3.5 text-primary-600" />
          <strong>{weather.humidity}%</strong>
        </span>
        <span className="inline-flex items-center gap-1">
          <Wind className="h-3.5 w-3.5 text-primary-600" />
          <strong>{weather.windKmh} km/h</strong>
        </span>
      </div>

      <div className="my-2.5 border-t border-gray-100" />

      {/* 4-hour forecast */}
      <div className="grid grid-cols-4 gap-1.5">
        {weather.hourly.map(h => {
          const HIcon = weatherIcon(h.code);
          return (
            <div
              key={h.time}
              className="flex min-h-[80px] flex-col items-center justify-between rounded-md border border-gray-200 bg-gray-50 px-1 py-2 text-center"
            >
              <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {formatHour(h.time)}
              </span>
              <HIcon className="h-5 w-5 text-primary-600" />
              <span className="text-xs font-bold text-gray-900">
                {h.temp}°
              </span>
            </div>
          );
        })}
      </div>

      {/* Source line */}
      <div className="mt-auto pt-2 text-[10px] text-gray-400">
        Source:{' '}
        <a
          href="https://open-meteo.com/"
          target="_blank"
          rel="noopener noreferrer"
          className="underline decoration-dotted hover:text-gray-600"
        >
          open-meteo.com
        </a>
      </div>
    </div>
  );
};

// ----------------------------------------------------------------------------
// HistoryTimeline — animated, civic-styled timeline + side highlight cards.
// Hover effects: cards lift on hover, dots scale up, borders shift to primary.
// On mount: each row fades in + slides from the left, staggered by index.
// ----------------------------------------------------------------------------

interface TimelineEvent {
  year: string;
  body: React.ReactNode;
}

const TIMELINE: TimelineEvent[] = [
  {
    year: '1914',
    body: (
      <>
        The lakeside settlement of <strong>Buayan</strong> served as the
        early heart of what would become General Santos City, originally home
        to <strong>Blaan</strong> and <strong>Maguindanaon</strong>{' '}
        communities along the Sarangani Bay coast.
      </>
    ),
  },
  {
    year: 'Feb 27, 1939',
    body: (
      <>
        <strong>General Paulino Santos</strong> arrived with 62 settlers from
        Luzon under the <strong>National Land Settlement Administration</strong>
        , founding the pioneer community of <strong>Lagao</strong> in the
        Koronadal Valley.
      </>
    ),
  },
  {
    year: '1948',
    body: (
      <>
        The growing town adopted the name <strong>Dadiangas</strong>, after
        the thorny tree that was common in the area, becoming the new
        commercial center of the settlement.
      </>
    ),
  },
  {
    year: '1954',
    body: (
      <>
        Dadiangas was renamed <strong>General Santos</strong> in honor of
        General Paulino Santos, the leader of the original settlement
        expedition.
      </>
    ),
  },
  {
    year: 'July 8, 1968',
    body: (
      <>
        <strong>Republic Act 5412</strong> converted General Santos into a
        chartered city, establishing its independence and modern political
        structure under the Office of the City Mayor.
      </>
    ),
  },
  {
    year: '1988',
    body: (
      <>
        General Santos was designated a{' '}
        <strong>Highly Urbanized City (HUC)</strong>, separating it
        administratively from South Cotabato province and giving it direct
        access to national funding.
      </>
    ),
  },
  {
    year: '1996',
    body: (
      <>
        The new <strong>General Santos International Airport</strong> at
        Tambler opened, replacing the old Buayan Airport and cementing
        GenSan's role as the gateway to southern Mindanao.
      </>
    ),
  },
  {
    year: '2000s',
    body: (
      <>
        The <strong>tuna industry boom</strong> at Makar Wharf earned
        General Santos international recognition as the{' '}
        <strong>Tuna Capital of the Philippines</strong>, supplying canneries
        across Asia, the US, and Europe.
      </>
    ),
  },
  {
    year: 'Today',
    body: (
      <>
        With a population of <strong>722,059</strong> (2024 PSA) across{' '}
        <strong>26 barangays</strong>, General Santos is the regional center
        of <strong>SOCCSKSARGEN (Region XII)</strong> and one of the largest
        and most important commercial hubs in Mindanao.
      </>
    ),
  },
];

interface SideCard {
  icon: typeof Award;
  title: string;
  body: string;
}

const SIDE_CARDS: SideCard[] = [
  {
    icon: Award,
    title: 'Tuna Capital',
    body: 'GenSan is officially recognized as the Tuna Capital of the Philippines, home to one of Southeast Asia\u2019s largest tuna landing and canning hubs at Makar Wharf.',
  },
  {
    icon: PartyPopper,
    title: 'Kalilangan Festival',
    body: 'Every February, Gensanons celebrate Kalilangan \u2014 the city\u2019s founding anniversary festival honoring the multicultural heritage of Blaan, Maguindanaon, and settler communities.',
  },
  {
    icon: Anchor,
    title: 'Mindanao Gateway',
    body: 'The deep-water port at Makar Wharf and General Santos International Airport make the city the principal entry point for cargo and passengers serving southern Mindanao.',
  },
];

const HistoryTimeline = () => {
  return (
    <div>
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-100 text-primary-600">
          <BookOpen className="h-4 w-4" />
        </div>
        <h2 className="text-base font-bold leading-tight text-gray-900">
          Brief History of General Santos City
        </h2>
      </div>

      <div className="grid gap-3 lg:grid-cols-3">
        {/* ---------- Timeline (left, 2/3 on lg) ---------- */}
        <div className="relative lg:col-span-2">
          {/* Vertical line behind the dots */}
          <div className="absolute left-2 top-2 bottom-2 w-px bg-gray-200" />

          <ul className="space-y-2">
            {TIMELINE.map((e, i) => (
              <li
                key={e.year}
                className="group relative pl-7 animate-in fade-in slide-in-from-left-4 fill-mode-both"
                style={{
                  animationDuration: '500ms',
                  animationDelay: `${i * 60}ms`,
                }}
              >
                {/* Dot on the line */}
                <span
                  className="absolute left-[5px] top-3 h-2.5 w-2.5 rounded-full border-2 border-primary-500 bg-white transition-all duration-300 group-hover:scale-125 group-hover:border-primary-600 group-hover:ring-4 group-hover:ring-primary-100"
                  aria-hidden
                />

                {/* Card */}
                <div
                  className={`rounded-lg border bg-white p-2.5 transition-all duration-300 ${
                    i === 0
                      ? 'border-primary-300 shadow-sm'
                      : 'border-gray-200'
                  } hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm`}
                >
                  <span className="inline-flex items-center rounded-full bg-primary-700 px-2 py-0.5 text-[10px] font-semibold text-white shadow-sm transition-colors duration-300 group-hover:bg-primary-600">
                    {e.year}
                  </span>
                  <p className="mt-1.5 text-[12px] leading-snug text-gray-700">
                    {e.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        {/* ---------- Side highlight cards (right, 1/3 on lg) ---------- */}
        <div className="space-y-2">
          {SIDE_CARDS.map((c, i) => (
            <div
              key={c.title}
              className="group flex items-start gap-2.5 rounded-lg border border-gray-200 bg-white p-2.5 transition-all duration-300 hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-sm animate-in fade-in slide-in-from-right-4 fill-mode-both"
              style={{
                animationDuration: '500ms',
                animationDelay: `${300 + i * 100}ms`,
              }}
            >
              <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary-700 text-white transition-transform duration-300 group-hover:scale-110">
                <c.icon className="h-4 w-4" />
              </div>
              <div>
                <h3 className="text-[12px] font-semibold leading-snug text-gray-900">
                  {c.title}
                </h3>
                <p className="mt-0.5 text-[11px] leading-snug text-gray-600">
                  {c.body}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
