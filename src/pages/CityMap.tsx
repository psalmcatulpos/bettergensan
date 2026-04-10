// /city-map — Infrastructure Projects listing
//
// Left filter sidebar + right content (Map / Table tabs).
// All filters are URL-param backed for shareability.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  GeoJSON,
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapPin,
  TableProperties,
  Building2,
  ChevronRight,
  Search,
  X,
  Calendar,
  Tag,
  CheckSquare,
  Filter,
  SlidersHorizontal,
  RotateCcw,
} from 'lucide-react';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import {
  readAllInfrastructureProjects,
  formatPhp,
  humanDate,
  type InfrastructureProjectRow,
} from '../lib/gensanCache';
import { GENSAN_BOUNDARY } from '../data/gensanBoundary';

const GENSAN_CENTER: [number, number] = [6.1164, 125.1716];
const DEFAULT_ZOOM = 12;
const LIMIT_OPTIONS = [25, 50, 100, 250];

const infraIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const BOUNDARY_STYLE = {
  color: '#0066eb',
  weight: 2,
  dashArray: '6 4',
  fillColor: '#0066eb',
  fillOpacity: 0.04,
};

function ResizeInvalidator() {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100);
    return () => clearTimeout(t);
  }, [map]);
  return null;
}

function statusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-600';
  const s = status.toLowerCase();
  if (s.includes('completed') || s.includes('done'))
    return 'bg-emerald-50 text-emerald-700';
  if (s.includes('ongoing') || s.includes('active') || s.includes('progress'))
    return 'bg-blue-50 text-blue-700';
  if (s.includes('cancelled') || s.includes('terminated'))
    return 'bg-red-50 text-red-700';
  return 'bg-gray-100 text-gray-600';
}

// ── Filter sidebar primitives ──

function FilterSection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Filter;
  children: React.ReactNode;
}) {
  return (
    <div className="border-t border-gray-100 pt-3 first:border-0 first:pt-0">
      <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
        <Icon className="h-3 w-3 text-gray-400" />
        {title}
      </div>
      {children}
    </div>
  );
}

function SelectField({
  value,
  onChange,
  options,
  placeholder,
  disabled,
  helper,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder: string;
  disabled?: boolean;
  helper?: string;
}) {
  return (
    <div>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className="w-full rounded-lg border border-gray-200 bg-white px-2.5 py-1.5 text-[12px] text-gray-700 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <option value="">{placeholder}</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {helper && (
        <p className="mt-0.5 text-[10px] text-gray-400">{helper}</p>
      )}
    </div>
  );
}

type Tab = 'map' | 'table';

function CityMap() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);

  // ── URL-backed filter state ──
  const viewParam = searchParams.get('view');
  const activeTab: Tab = viewParam === 'table' ? 'table' : 'map';
  const urlSearch = searchParams.get('q') ?? '';
  const urlYear = searchParams.get('year') ?? '';
  const urlCategory = searchParams.get('category') ?? '';
  const parsedLimit = parseInt(searchParams.get('limit') ?? '100', 10);
  const urlLimit = isNaN(parsedLimit) || parsedLimit < 1 ? 100 : parsedLimit;
  const urlStatuses = useMemo(
    () => searchParams.get('status')?.split(',').filter(Boolean) ?? [],
    [searchParams]
  );

  // ── Local draft state (applied on button click) ──
  const [search, setSearch] = useState(urlSearch);
  const [year, setYear] = useState(urlYear);
  const [category, setCategory] = useState(urlCategory);
  const [limit, setLimit] = useState(urlLimit);
  const [statuses, setStatuses] = useState<string[]>(urlStatuses);

  const [projects, setProjects] = useState<InfrastructureProjectRow[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback((signal: AbortSignal) => {
    setLoading(true);
    readAllInfrastructureProjects(signal)
      .then(rows => {
        if (!signal.aborted) setProjects(rows);
      })
      .finally(() => {
        if (!signal.aborted) setLoading(false);
      });
  }, []);

  useEffect(() => {
    const ac = new AbortController();
    load(ac.signal);
    return () => ac.abort();
  }, [load]);

  // ── Derive facets from full dataset ──
  const facets = useMemo(() => {
    const years = new Set<string>();
    const categories = new Set<string>();
    const statusCounts = new Map<string, number>();

    for (const p of projects) {
      if (p.start_date) {
        const y = p.start_date.slice(0, 4);
        if (y.length === 4) years.add(y);
      }
      if (p.category) categories.add(p.category);
      const s = p.status ?? 'Unknown';
      statusCounts.set(s, (statusCounts.get(s) ?? 0) + 1);
    }

    return {
      years: [...years].sort().reverse(),
      categories: [...categories].sort(),
      statusCounts: [...statusCounts.entries()]
        .sort((a, b) => b[1] - a[1]),
    };
  }, [projects]);

  // ── Apply filters ──
  const applyFilters = useCallback(() => {
    const p: Record<string, string> = {};
    if (activeTab !== 'map') p.view = activeTab;
    if (search.trim()) p.q = search.trim();
    if (year) p.year = year;
    if (category) p.category = category;
    if (limit !== 100) p.limit = String(limit);
    if (statuses.length > 0) p.status = statuses.join(',');
    setSearchParams(p, { replace: true });
  }, [activeTab, search, year, category, limit, statuses, setSearchParams]);

  const resetFilters = useCallback(() => {
    setSearch('');
    setYear('');
    setCategory('');
    setLimit(100);
    setStatuses([]);
    setSearchParams(activeTab === 'map' ? {} : { view: activeTab }, {
      replace: true,
    });
  }, [activeTab, setSearchParams]);

  const setActiveTab = (tab: Tab) => {
    const p: Record<string, string> = {};
    if (tab !== 'map') p.view = tab;
    if (urlSearch) p.q = urlSearch;
    if (urlYear) p.year = urlYear;
    if (urlCategory) p.category = urlCategory;
    if (urlLimit !== 100) p.limit = String(urlLimit);
    if (urlStatuses.length > 0) p.status = urlStatuses.join(',');
    setSearchParams(p, { replace: true });
  };

  const toggleStatus = (s: string) => {
    setStatuses(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  // ── Filter dataset (uses URL params, not draft state) ──
  const filtered = useMemo(() => {
    let rows = projects;

    if (urlSearch.trim()) {
      const q = urlSearch.toLowerCase();
      rows = rows.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          (p.agency && p.agency.toLowerCase().includes(q)) ||
          (p.contractor && p.contractor.toLowerCase().includes(q)) ||
          (p.location_text && p.location_text.toLowerCase().includes(q)) ||
          (p.category && p.category.toLowerCase().includes(q)) ||
          (p.status && p.status.toLowerCase().includes(q))
      );
    }
    if (urlYear) {
      rows = rows.filter(
        p => p.start_date && p.start_date.startsWith(urlYear)
      );
    }
    if (urlCategory) {
      rows = rows.filter(p => p.category === urlCategory);
    }
    if (urlStatuses.length > 0) {
      rows = rows.filter(p => urlStatuses.includes(p.status ?? 'Unknown'));
    }

    return rows.slice(0, urlLimit);
  }, [projects, urlSearch, urlYear, urlCategory, urlStatuses, urlLimit]);

  const mappable = useMemo(
    () => filtered.filter(p => p.latitude != null && p.longitude != null),
    [filtered]
  );

  const goToDetail = (id: string) => navigate(`/city-map/${id}`);

  const hasActiveFilters =
    urlSearch || urlYear || urlCategory || urlStatuses.length > 0;

  // ── Sidebar content (shared between desktop sticky + mobile drawer) ──
  const filterContent = (
    <div className="flex flex-col gap-3">
      {/* Search */}
      <div>
        <div className="mb-1.5 flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
          <Search className="h-3 w-3 text-gray-400" />
          Search Projects
        </div>
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && applyFilters()}
            placeholder="Name, contractor, location..."
            className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-7 text-[12px] text-gray-700 placeholder:text-gray-400 transition focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Max results */}
      <FilterSection title="Maximum Results" icon={SlidersHorizontal}>
        <SelectField
          value={String(limit)}
          onChange={v => setLimit(parseInt(v, 10) || 100)}
          options={LIMIT_OPTIONS.map(n => ({
            value: String(n),
            label: `${n} results`,
          }))}
          placeholder="100 results"
          helper="Higher limits may take longer to load"
        />
      </FilterSection>

      {/* Year */}
      {facets.years.length > 0 && (
        <FilterSection title="Infrastructure Year" icon={Calendar}>
          <SelectField
            value={year}
            onChange={setYear}
            options={facets.years.map(y => ({ value: y, label: y }))}
            placeholder="All Years"
          />
        </FilterSection>
      )}

      {/* Category */}
      {facets.categories.length > 0 && (
        <FilterSection title="Project Category" icon={Tag}>
          <SelectField
            value={category}
            onChange={setCategory}
            options={facets.categories.map(c => ({ value: c, label: c }))}
            placeholder="All Categories"
          />
        </FilterSection>
      )}

      {/* Status checkboxes */}
      {facets.statusCounts.length > 0 && (
        <FilterSection title="Project Status" icon={CheckSquare}>
          <div className="flex flex-col gap-0.5">
            {facets.statusCounts.map(([s, count]) => (
              <label
                key={s}
                className="flex cursor-pointer items-center gap-2 rounded-md px-1 py-1 text-[12px] transition hover:bg-gray-50"
              >
                <input
                  type="checkbox"
                  checked={statuses.includes(s)}
                  onChange={() => toggleStatus(s)}
                  className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                />
                <span className="flex-1 text-gray-700">{s}</span>
                <span className="text-[10px] tabular-nums text-gray-400">
                  {count.toLocaleString()}
                </span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Actions */}
      <div className="flex gap-2 border-t border-gray-100 pt-3">
        <button
          type="button"
          onClick={applyFilters}
          className="flex-1 rounded-lg bg-primary-600 px-3 py-2 text-[12px] font-bold text-white transition hover:bg-primary-700"
        >
          Apply Filters
        </button>
        <button
          type="button"
          onClick={resetFilters}
          className="inline-flex items-center gap-1 rounded-lg border border-gray-200 px-3 py-2 text-[12px] font-medium text-gray-600 transition hover:bg-gray-50"
        >
          <RotateCcw className="h-3 w-3" />
          Reset
        </button>
      </div>
    </div>
  );

  return (
    <>
      <SEO
        title="Infrastructure Projects — General Santos City"
        description="Browse infrastructure projects in General Santos City. View on a map or as a table."
        keywords="General Santos City infrastructure, GenSan projects, public works, city map"
      />

      {/* ── Page header ── */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-[1100px] px-4 pb-4 pt-3">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'City', href: '/city-profile' },
              { label: 'Infrastructure Projects' },
            ]}
          />

          <div className="mt-3 flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-600 text-white">
              <Building2 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-[0.12em] text-primary-600">
                City
              </div>
              <h1 className="text-xl font-extrabold tracking-tight text-gray-900 sm:text-2xl">
                Infrastructure Projects
              </h1>
              <p className="mt-0.5 text-[13px] text-gray-500">
                Public works and infrastructure projects in General Santos
                City, sourced from Bisto.ph.
              </p>
            </div>
          </div>

          {/* View tabs + mobile filter toggle */}
          <div className="mt-4 flex items-center justify-between">
            <div className="inline-flex rounded-lg border border-gray-200 bg-white p-0.5">
              <button
                type="button"
                onClick={() => setActiveTab('map')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                  activeTab === 'map'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <MapPin className="h-3.5 w-3.5" />
                Map
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('table')}
                className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[12px] font-semibold transition ${
                  activeTab === 'table'
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                <TableProperties className="h-3.5 w-3.5" />
                Table
              </button>
            </div>

            {/* Mobile filter toggle */}
            <button
              type="button"
              onClick={() => setShowFilters(prev => !prev)}
              className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-semibold transition lg:hidden ${
                showFilters
                  ? 'border-primary-300 bg-primary-50 text-primary-700'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Filter className="h-3.5 w-3.5" />
              Filters
              {hasActiveFilters && (
                <span className="h-1.5 w-1.5 rounded-full bg-primary-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ── Body: sidebar + content ── */}
      <div className="mx-auto max-w-[1100px] px-4 py-5">
        <div className="flex gap-5">
          {/* Desktop filter sidebar */}
          <aside className="hidden w-[240px] shrink-0 lg:block">
            <div className="sticky top-4 rounded-xl border border-gray-200 bg-white p-3">
              {filterContent}
            </div>
          </aside>

          {/* Mobile filter drawer */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div
                className="absolute inset-0 bg-black/20"
                onClick={() => setShowFilters(false)}
              />
              <div className="absolute bottom-0 left-0 right-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-gray-200 bg-white p-4 shadow-xl">
                <div className="mb-3 flex items-center justify-between">
                  <h2 className="text-sm font-bold text-gray-900">Filters</h2>
                  <button
                    type="button"
                    onClick={() => setShowFilters(false)}
                    className="rounded p-1 text-gray-400 hover:text-gray-600"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
                {filterContent}
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="min-w-0 flex-1">
            {/* Count + active filter indicator */}
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[12px] text-gray-500">
                {loading
                  ? 'Loading projects...'
                  : `${filtered.length} project${filtered.length !== 1 ? 's' : ''}${
                      hasActiveFilters ? ' (filtered)' : ''
                    }${activeTab === 'map' ? ` · ${mappable.length} mapped` : ''}`}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="text-[11px] font-medium text-primary-600 hover:text-primary-700"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Loading */}
            {loading && (
              <div className="flex h-[400px] items-center justify-center rounded-xl border border-gray-200 bg-gray-50">
                <span className="inline-flex items-center gap-2 text-sm text-gray-500">
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  Loading infrastructure data...
                </span>
              </div>
            )}

            {/* Map tab */}
            {!loading && activeTab === 'map' && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
                <MapContainer
                  center={GENSAN_CENTER}
                  zoom={DEFAULT_ZOOM}
                  scrollWheelZoom={false}
                  style={{ height: '560px', width: '100%' }}
                >
                  <ResizeInvalidator />
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <GeoJSON data={GENSAN_BOUNDARY} style={BOUNDARY_STYLE} />
                  {mappable.map(p => (
                    <Marker
                      key={p.id}
                      position={[p.latitude!, p.longitude!]}
                      icon={infraIcon}
                    >
                      <Popup>
                        <div className="max-w-xs text-xs">
                          <div className="font-semibold text-gray-900">
                            {p.title}
                          </div>
                          {p.status && (
                            <span
                              className={`mt-1 inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusColor(p.status)}`}
                            >
                              {p.status}
                            </span>
                          )}
                          {p.agency && (
                            <div className="mt-1 text-gray-600">
                              {p.agency}
                            </div>
                          )}
                          {p.budget_amount != null && (
                            <div className="mt-1 font-medium text-primary-700">
                              {formatPhp(p.budget_amount)}
                            </div>
                          )}
                          <button
                            type="button"
                            onClick={() => goToDetail(p.id)}
                            className="mt-2 inline-flex items-center gap-1 rounded bg-primary-600 px-2 py-1 text-[10px] font-medium text-white hover:bg-primary-700"
                          >
                            View Details
                            <ChevronRight className="h-3 w-3" />
                          </button>
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            )}

            {/* Table tab */}
            {!loading && activeTab === 'table' && (
              <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04]">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 bg-gray-50 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                        <th className="px-4 py-2.5">Project</th>
                        <th className="hidden px-4 py-2.5 md:table-cell">
                          Agency
                        </th>
                        <th className="hidden px-4 py-2.5 lg:table-cell">
                          Location
                        </th>
                        <th className="px-4 py-2.5 text-right">Budget</th>
                        <th className="px-4 py-2.5">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filtered.length === 0 && (
                        <tr>
                          <td
                            colSpan={5}
                            className="px-4 py-12 text-center text-sm text-gray-500"
                          >
                            {hasActiveFilters
                              ? 'No projects match your filters.'
                              : 'No infrastructure projects synced yet.'}
                          </td>
                        </tr>
                      )}
                      {filtered.map(p => (
                        <tr
                          key={p.id}
                          onClick={() => goToDetail(p.id)}
                          className="cursor-pointer transition hover:bg-gray-50"
                        >
                          <td className="px-4 py-2.5">
                            <div className="font-medium text-gray-900 line-clamp-2">
                              {p.title}
                            </div>
                            {p.category && (
                              <div className="mt-0.5 text-[11px] text-gray-400">
                                {p.category}
                              </div>
                            )}
                          </td>
                          <td className="hidden px-4 py-2.5 text-[13px] text-gray-600 md:table-cell">
                            <div className="line-clamp-2">
                              {p.agency || '—'}
                            </div>
                          </td>
                          <td className="hidden px-4 py-2.5 text-[13px] text-gray-600 lg:table-cell">
                            <div className="line-clamp-1">
                              {p.location_text || p.barangay || '—'}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-4 py-2.5 text-right text-[13px] font-medium text-gray-900">
                            {formatPhp(p.budget_amount) || '—'}
                          </td>
                          <td className="px-4 py-2.5">
                            {p.status ? (
                              <span
                                className={`inline-block rounded px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider ${statusColor(p.status)}`}
                              >
                                {p.status}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Empty state */}
            {!loading && projects.length === 0 && (
              <p className="mt-6 text-center text-sm text-gray-500">
                No infrastructure projects synced yet. Data will appear here
                once the Bisto.ph sync runs.
              </p>
            )}

            <p className="mt-3 text-[10px] text-gray-400">
              Data sourced from Bisto.ph. Last synced{' '}
              {projects.length > 0
                ? humanDate(projects[0].last_synced_at)
                : '—'}
              .
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

export default CityMap;
