// /city-map/:projectId — Public Infrastructure Intelligence Record
//
// Civic dossier layout: authoritative header → tiered content sections →
// sticky intelligence sidebar. Every section hides when data is absent.

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  GeoJSON,
  MapContainer,
  Marker,
  TileLayer,
  useMap,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  ArrowLeft,
  Building2,
  Calendar,
  CheckCircle2,
  ChevronRight,
  CircleDollarSign,
  Clock,
  Crosshair,
  ExternalLink,
  FileText,
  Globe,
  HardHat,
  Info,
  MapPin,
  Shield,
  Tag,
  TrendingUp,
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

import { GENSAN_BOUNDARY } from '../data/gensanBoundary';
import Breadcrumbs from '../components/ui/Breadcrumbs';
import SEO from '../components/SEO';
import {
  readInfrastructureProjectById,
  readAllInfrastructureProjects,
  formatPhp,
  humanDate,
  humanAge,
  type InfrastructureProjectRow,
  type BistoRawPayload,
} from '../lib/gensanCache';

const infraIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

function MapRecenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 14);
    setTimeout(() => map.invalidateSize(), 100);
  }, [map, lat, lng]);
  return null;
}

// ── Status helpers ──

function statusColor(status: string | null): string {
  if (!status) return 'bg-gray-100 text-gray-600 border-gray-200';
  const s = status.toLowerCase();
  if (s.includes('completed') || s.includes('done'))
    return 'bg-emerald-50 text-emerald-700 border-emerald-200';
  if (s.includes('ongoing') || s.includes('active') || s.includes('progress'))
    return 'bg-blue-50 text-blue-700 border-blue-200';
  if (s.includes('cancelled') || s.includes('terminated'))
    return 'bg-red-50 text-red-700 border-red-200';
  return 'bg-gray-100 text-gray-600 border-gray-200';
}

function progressColor(pct: number): string {
  if (pct >= 100) return 'bg-emerald-500';
  if (pct >= 50) return 'bg-blue-500';
  if (pct >= 25) return 'bg-amber-500';
  return 'bg-red-500';
}

function progressTextColor(pct: number): string {
  if (pct >= 100) return 'text-emerald-700';
  if (pct >= 50) return 'text-blue-700';
  if (pct >= 25) return 'text-amber-700';
  return 'text-red-700';
}

function freshnessTone(iso: string): {
  label: string;
  dot: string;
  text: string;
} {
  const ms = Date.now() - new Date(iso).getTime();
  if (ms < 48 * 3600_000)
    return { label: 'Fresh', dot: 'bg-emerald-500', text: 'text-emerald-700' };
  if (ms < 7 * 86400_000)
    return { label: 'Recent', dot: 'bg-blue-500', text: 'text-blue-700' };
  if (ms < 30 * 86400_000)
    return { label: 'Aging', dot: 'bg-amber-500', text: 'text-amber-700' };
  return { label: 'Stale', dot: 'bg-gray-400', text: 'text-gray-500' };
}

// ── Reusable primitives ──

/** Tier 1 section — strong header bar */
function PrimarySection({
  title,
  icon: Icon,
  children,
  className,
}: {
  title: string;
  icon: typeof Info;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm shadow-gray-900/[0.04] ${className ?? ''}`}
    >
      <div className="flex items-center gap-2 border-b border-gray-100 bg-gray-50/60 px-4 py-2.5">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-primary-600 text-white">
          <Icon className="h-3.5 w-3.5" />
        </div>
        <h2 className="text-[13px] font-bold text-gray-900">{title}</h2>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

/** Tier 2 section — lighter header */
function SecondarySection({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Info;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-2 border-b border-gray-100 px-4 py-2">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <h2 className="text-[12px] font-semibold text-gray-700">{title}</h2>
      </div>
      <div className="px-4 py-3">{children}</div>
    </div>
  );
}

/** Key-value field — hides when value is null/empty */
function Field({
  label,
  value,
  mono,
  emphasis,
}: {
  label: string;
  value: React.ReactNode;
  mono?: boolean;
  emphasis?: boolean;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="py-1.5">
      <dt className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
        {label}
      </dt>
      <dd
        className={`mt-0.5 text-[13px] leading-snug ${
          emphasis
            ? 'font-semibold text-gray-900'
            : 'text-gray-700'
        } ${mono ? 'font-mono text-[12px]' : ''}`}
      >
        {value}
      </dd>
    </div>
  );
}

/** Two-column responsive grid for fields */
function FieldGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-1 gap-x-6 gap-y-0 sm:grid-cols-2">
      {children}
    </div>
  );
}

/** Stat metric — large number with label */
function Metric({
  label,
  value,
  sub,
  className,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <div className="text-[10px] font-semibold uppercase tracking-[0.1em] text-gray-400">
        {label}
      </div>
      <div className="mt-0.5 text-lg font-bold leading-tight text-gray-900">
        {value}
      </div>
      {sub && (
        <div className="mt-0.5 text-[11px] text-gray-500">{sub}</div>
      )}
    </div>
  );
}

/** Sidebar card */
function SidePanel({
  title,
  icon: Icon,
  children,
}: {
  title: string;
  icon: typeof Info;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white">
      <div className="flex items-center gap-1.5 border-b border-gray-100 px-3 py-2">
        <Icon className="h-3.5 w-3.5 text-gray-400" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-500">
          {title}
        </h3>
      </div>
      <div className="px-3 py-2.5">{children}</div>
    </div>
  );
}

function SideRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  if (value === null || value === undefined || value === '') return null;
  return (
    <div className="flex items-start justify-between gap-2 py-1 text-[11px]">
      <span className="shrink-0 text-gray-400">{label}</span>
      <span className="text-right font-medium text-gray-800">{value}</span>
    </div>
  );
}

// ── Main ──

function InfrastructureDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<InfrastructureProjectRow | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState<InfrastructureProjectRow[]>([]);

  const loadProject = useCallback(
    (signal: AbortSignal) => {
      if (!projectId) return;
      setLoading(true);
      readInfrastructureProjectById(projectId, signal)
        .then(row => {
          if (!signal.aborted) setProject(row);
        })
        .finally(() => {
          if (!signal.aborted) setLoading(false);
        });
    },
    [projectId]
  );

  useEffect(() => {
    const ac = new AbortController();
    loadProject(ac.signal);
    return () => ac.abort();
  }, [loadProject]);

  useEffect(() => {
    if (!project) return;
    const ac = new AbortController();
    readAllInfrastructureProjects(ac.signal).then(all => {
      if (ac.signal.aborted) return;
      const matches = all.filter(
        p =>
          p.id !== project.id &&
          ((project.category && p.category === project.category) ||
            (project.agency && p.agency === project.agency) ||
            (project.contractor && p.contractor === project.contractor))
      );
      setRelated(matches.slice(0, 6));
    });
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project?.id]);

  const raw: BistoRawPayload =
    (project?.raw_payload as BistoRawPayload) ?? {};
  const hasCoords =
    project?.latitude != null &&
    project?.longitude != null &&
    isFinite(project.latitude) &&
    isFinite(project.longitude) &&
    Math.abs(project.latitude) <= 90 &&
    Math.abs(project.longitude) <= 180;
  const rawProgress = raw.progress ?? null;
  const progress =
    rawProgress != null ? Math.max(0, Math.min(rawProgress, 100)) : null;

  const locationLine = useMemo(() => {
    if (!project) return '';
    return [
      project.barangay,
      project.city_municipality,
      project.province,
      project.region,
    ]
      .filter(Boolean)
      .join(', ');
  }, [project]);

  const syncAge = project
    ? humanAge(Date.now() - new Date(project.last_synced_at).getTime())
    : '';
  const freshness = project
    ? freshnessTone(project.last_synced_at)
    : { label: 'Unknown', dot: 'bg-gray-400', text: 'text-gray-500' };

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <span className="inline-flex items-center gap-2 text-sm text-gray-500">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading project record...
        </span>
      </div>
    );
  }

  // ── Not found ──
  if (!project) {
    return (
      <div className="mx-auto max-w-[1100px] px-4 py-16">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Infrastructure Projects', href: '/city-map' },
            { label: 'Not Found' },
          ]}
        />
        <div className="mt-8 flex flex-col items-center gap-3">
          <p className="text-sm text-gray-500">
            This project record could not be found.
          </p>
          <Link
            to="/city-map"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to all projects
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <SEO
        title={`${project.title} — Infrastructure Record`}
        description={
          project.description ||
          `Public infrastructure project record: ${project.title}`
        }
      />

      {/* ═══════════════════════════════════════════════════════
          HERO / HEADER — Project identity at a glance
          ═══════════════════════════════════════════════════════ */}
      <div className="border-b border-gray-200 bg-gray-50">
        <div className="mx-auto max-w-[1100px] px-4 pb-5 pt-4">
          {/* Breadcrumbs */}
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Infrastructure', href: '/city-map' },
              { label: 'Record' },
            ]}
          />

          {/* Back link */}
          <Link
            to="/city-map"
            className="mt-2 inline-flex items-center gap-1 text-[12px] font-medium text-primary-600 hover:text-primary-700"
          >
            <ArrowLeft className="h-3 w-3" />
            All Projects
          </Link>

          {/* Title block */}
          <h1 className="mt-2 max-w-3xl text-[22px] font-extrabold leading-tight tracking-tight text-gray-900 sm:text-[26px]">
            {project.title}
          </h1>

          {/* Subtitle — office / location / category */}
          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-gray-500">
            {project.agency && (
              <span className="inline-flex items-center gap-1 font-medium text-gray-600">
                <Building2 className="h-3 w-3 text-gray-400" />
                {project.agency}
              </span>
            )}
            {locationLine && (
              <span className="inline-flex items-center gap-1">
                <MapPin className="h-3 w-3 text-gray-400" />
                {locationLine}
              </span>
            )}
            {project.category && (
              <span className="inline-flex items-center gap-1">
                <Tag className="h-3 w-3 text-gray-400" />
                {project.category}
              </span>
            )}
          </div>

          {/* Status chips */}
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {project.status && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider ${statusColor(project.status)}`}
              >
                {project.status}
              </span>
            )}
            {progress != null && (
              <span
                className={`inline-flex items-center gap-1 rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-bold ${progressTextColor(progress)}`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${progressColor(progress)}`}
                />
                {progress}%
              </span>
            )}
            {raw.infraYear && (
              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                FY {raw.infraYear}
              </span>
            )}
            {project.category && (
              <span className="rounded-full border border-gray-200 bg-white px-2.5 py-0.5 text-[11px] font-medium text-gray-600">
                {project.category}
              </span>
            )}
          </div>

          {/* Identity strip — contract / office / region / source */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-gray-200 pt-3 text-[11px] text-gray-400">
            {raw.contractId && (
              <span>
                Contract{' '}
                <span className="font-mono font-semibold text-gray-600">
                  {raw.contractId}
                </span>
              </span>
            )}
            {project.region && (
              <span>
                <Globe className="mr-0.5 inline h-3 w-3" />
                {project.region}
              </span>
            )}
            {project.geographic_scope_match && (
              <span>
                Scope:{' '}
                <span className="font-medium text-gray-600">
General Santos City
                </span>
              </span>
            )}
            <span>
              Source:{' '}
              <span className="font-medium text-gray-600">Bisto.ph</span>
            </span>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════
          BODY — Two-column: content + sticky sidebar
          ═══════════════════════════════════════════════════════ */}
      <div className="mx-auto max-w-[1100px] px-4 py-5">
        {/* On mobile: sidebar snapshot first, then content */}
        {/* On desktop: left content + right sticky sidebar */}
        <div className="flex flex-col gap-5 lg:flex-row">
          {/* ── LEFT COLUMN ── */}
          <div className="flex min-w-0 flex-1 flex-col gap-5">
            {/* ╌╌╌ TIER 1: Overview + Timeline + Map ╌╌╌ */}

            {/* Project Overview — hero card */}
            <PrimarySection title="Project Overview" icon={Info}>
              {/* Metric row */}
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
                {project.budget_amount != null && (
                  <Metric
                    label="Approved Budget"
                    value={
                      <span className="text-primary-700">
                        {formatPhp(project.budget_amount)}
                      </span>
                    }
                  />
                )}
                {progress != null && (
                  <Metric
                    label="Completion"
                    value={
                      <span className={progressTextColor(progress)}>
                        {progress}%
                      </span>
                    }
                    sub={project.status ?? undefined}
                  />
                )}
                {(project.start_date || project.end_date) && (
                  <Metric
                    label="Timeline"
                    value={
                      <span className="text-base">
                        {humanDate(project.start_date)}
                      </span>
                    }
                    sub={
                      project.end_date
                        ? `to ${humanDate(project.end_date)}`
                        : undefined
                    }
                  />
                )}
                {project.contractor && (
                  <Metric
                    label="Contractor"
                    value={
                      <span className="text-sm font-semibold leading-tight">
                        {project.contractor.split('(')[0].trim()}
                      </span>
                    }
                    sub={
                      project.contractor.includes('(')
                        ? project.contractor
                            .slice(project.contractor.indexOf('('))
                            .trim()
                        : undefined
                    }
                  />
                )}
              </div>

              {/* Progress bar */}
              {progress != null && (
                <div className="mt-4 border-t border-gray-100 pt-3">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold uppercase tracking-wider text-gray-400">
                      Physical Progress
                    </span>
                    <span
                      className={`font-bold ${progressTextColor(progress)}`}
                    >
                      {progress}%
                    </span>
                  </div>
                  <div className="mt-1.5 h-2.5 overflow-hidden rounded-full bg-gray-100">
                    <div
                      className={`h-full rounded-full transition-all ${progressColor(progress)}`}
                      style={{ width: `${Math.min(progress, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Additional row items */}
              {(raw.amountPaid != null && raw.amountPaid > 0) ||
              raw.sourceOfFunds ? (
                <div className="mt-3 grid grid-cols-1 gap-x-6 border-t border-gray-100 pt-3 sm:grid-cols-2">
                  {raw.amountPaid != null && raw.amountPaid > 0 && (
                    <Field
                      label="Amount Disbursed"
                      value={formatPhp(raw.amountPaid)}
                    />
                  )}
                  <Field label="Funding Source" value={raw.sourceOfFunds} />
                </div>
              ) : null}
            </PrimarySection>

            {/* Timeline */}
            {(project.start_date || project.end_date) && (
              <PrimarySection title="Timeline" icon={Calendar}>
                <div className="grid grid-cols-1 gap-x-6 sm:grid-cols-3">
                  <Field
                    label="Start Date"
                    value={humanDate(project.start_date)}
                    emphasis
                  />
                  <Field
                    label="Target Completion"
                    value={humanDate(project.end_date)}
                    emphasis
                  />
                  {project.status?.toLowerCase().includes('completed') && (
                    <Field
                      label="Actual Completion"
                      value={humanDate(project.end_date)}
                      emphasis
                    />
                  )}
                </div>
                {progress != null && (
                  <div className="mt-2 grid grid-cols-2 gap-x-6">
                    <Field label="Status" value={project.status} />
                    <Field label="Progress" value={`${progress}%`} />
                  </div>
                )}
                {raw.infraYear && (
                  <Field label="Infrastructure Year" value={raw.infraYear} />
                )}
              </PrimarySection>
            )}

            {/* Map / Location — evidence layer */}
            {hasCoords && (
              <PrimarySection title="Verified Location" icon={MapPin}>
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <MapContainer
                    center={[project.latitude!, project.longitude!]}
                    zoom={14}
                    scrollWheelZoom={false}
                    style={{ height: '380px', width: '100%' }}
                  >
                    <MapRecenter
                      lat={project.latitude!}
                      lng={project.longitude!}
                    />
                    <TileLayer
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <GeoJSON
                      data={GENSAN_BOUNDARY}
                      style={{
                        color: '#0066eb',
                        weight: 1.5,
                        dashArray: '4 3',
                        fillColor: '#0066eb',
                        fillOpacity: 0.03,
                      }}
                    />
                    <Marker
                      position={[project.latitude!, project.longitude!]}
                      icon={infraIcon}
                    />
                  </MapContainer>
                </div>

                <div className="mt-2.5 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                  <div className="text-[12px] text-gray-600">
                    <MapPin className="mr-1 inline h-3 w-3 text-gray-400" />
                    {locationLine ||
                      project.location_text ||
                      'Coordinates available'}
                  </div>
                  <div className="flex items-center gap-3 text-[11px] text-gray-400">
                    <span>
                      <Crosshair className="mr-0.5 inline h-3 w-3" />
                      {project.latitude!.toFixed(5)},{' '}
                      {project.longitude!.toFixed(5)}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${project.latitude}&mlon=${project.longitude}#map=16/${project.latitude}/${project.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 font-medium text-primary-600 hover:text-primary-700"
                    >
                      Open in OSM
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
                <p className="mt-1 text-[10px] italic text-gray-400">
                  Mapped from source coordinates provided by DPWH via
                  Bisto.ph
                </p>
              </PrimarySection>
            )}

            {/* ╌╌╌ TIER 2: Details ╌╌╌ */}

            {/* Project Information */}
            <SecondarySection title="Project Information" icon={FileText}>
              <FieldGrid>
                <Field label="Contract ID" value={raw.contractId} mono />
                <Field label="External ID" value={project.external_id} mono />
                <Field label="Category" value={project.category} />
                <Field label="Component" value={raw.componentCategories} />
                <Field label="Program" value={raw.programName} />
                <Field label="Fiscal Year" value={raw.infraYear} />
                <Field label="Funding Source" value={raw.sourceOfFunds} />
                <Field
                  label="Geographic Scope"
                  value="General Santos City"
                />
              </FieldGrid>
            </SecondarySection>

            {/* Implementation / Contractor */}
            {(project.agency || project.contractor || locationLine) && (
              <SecondarySection
                title="Implementation Details"
                icon={HardHat}
              >
                <FieldGrid>
                  <Field
                    label="Contractor"
                    value={project.contractor}
                    emphasis
                  />
                  <Field label="Implementing Office" value={project.agency} />
                  <Field label="Program" value={raw.programName} />
                  <Field label="Region" value={project.region} />
                  <Field label="Province" value={project.province} />
                  <Field
                    label="City / Municipality"
                    value={project.city_municipality}
                  />
                  <Field label="Barangay" value={project.barangay} />
                </FieldGrid>
              </SecondarySection>
            )}

            {/* Procurement */}
            {(raw.contractId || project.budget_amount != null) && (
              <SecondarySection
                title="Procurement Details"
                icon={CircleDollarSign}
              >
                <FieldGrid>
                  <Field label="Contract ID" value={raw.contractId} mono />
                  <Field
                    label="Approved Budget"
                    value={formatPhp(project.budget_amount)}
                    emphasis
                  />
                  <Field label="Funding Source" value={raw.sourceOfFunds} />
                  {raw.amountPaid != null && raw.amountPaid > 0 && (
                    <Field
                      label="Amount Disbursed"
                      value={formatPhp(raw.amountPaid)}
                    />
                  )}
                </FieldGrid>
              </SecondarySection>
            )}

            {/* ╌╌╌ TIER 3: Metadata / Source / Related ╌╌╌ */}

            {/* Record Integrity */}
            <div className="rounded-xl border border-gray-200 bg-gray-50/50 px-4 py-3">
              <div className="flex items-center gap-2 text-[12px] font-semibold text-gray-600">
                <Shield className="h-4 w-4 text-gray-400" />
                Record Integrity
              </div>
              <div className="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 sm:grid-cols-4">
                <div className="py-1">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">
                    Source
                  </div>
                  <div className="text-[12px] font-medium text-gray-700">
                    Bisto.ph / BetterGov
                  </div>
                </div>
                <div className="py-1">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">
                    First Tracked
                  </div>
                  <div className="text-[12px] font-medium text-gray-700">
                    {humanDate(project.first_seen_at)}
                  </div>
                </div>
                <div className="py-1">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">
                    Last Synced
                  </div>
                  <div className="text-[12px] font-medium text-gray-700">
                    {syncAge}
                  </div>
                </div>
                <div className="py-1">
                  <div className="text-[10px] uppercase tracking-wider text-gray-400">
                    Data Freshness
                  </div>
                  <div
                    className={`flex items-center gap-1 text-[12px] font-semibold ${freshness.text}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${freshness.dot}`}
                    />
                    {freshness.label}
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[10px] leading-relaxed text-gray-400">
                Public infrastructure record aggregated from monitored
                government data sources. Information is refreshed
                periodically and may not reflect real-time project status.
              </p>
            </div>

            {/* Related Projects */}
            {related.length > 0 && (
              <div>
                <div className="mb-3 flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                  <h2 className="text-[13px] font-semibold text-gray-700">
                    Related Records
                  </h2>
                  <span className="text-[11px] text-gray-400">
                    {related.length} project
                    {related.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                  {related.map(p => (
                    <Link
                      key={p.id}
                      to={`/city-map/${p.id}`}
                      className="group flex flex-col rounded-xl border border-gray-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-[13px] font-semibold leading-snug text-gray-900 line-clamp-2 group-hover:text-primary-600">
                          {p.title}
                        </h3>
                        <ChevronRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-300 transition group-hover:text-primary-500" />
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-1.5">
                        {p.status && (
                          <span
                            className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${statusColor(p.status)}`}
                          >
                            {p.status}
                          </span>
                        )}
                        {p.budget_amount != null && (
                          <span className="text-[11px] font-bold text-primary-700">
                            {formatPhp(p.budget_amount)}
                          </span>
                        )}
                      </div>
                      <div className="mt-auto pt-2 text-[11px] text-gray-400">
                        {p.category && (
                          <span>
                            {p.category}
                            {p.agency ? ' · ' : ''}
                          </span>
                        )}
                        {p.agency && (
                          <span className="line-clamp-1">{p.agency}</span>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ── RIGHT SIDEBAR — sticky intelligence panel ── */}
          <div className="flex w-full shrink-0 flex-col gap-3 lg:w-[280px] lg:self-start lg:sticky lg:top-4">
            {/* Primary action */}
            <a
              href="https://bisto.ph"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2.5 text-[13px] font-bold text-white shadow-sm transition hover:bg-primary-700"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View Source Record
            </a>

            {/* Project Snapshot */}
            <SidePanel title="Project Snapshot" icon={TrendingUp}>
              <div className="space-y-0.5">
                {project.budget_amount != null && (
                  <div className="py-1.5">
                    <div className="text-[10px] uppercase tracking-wider text-gray-400">
                      Budget
                    </div>
                    <div className="text-base font-extrabold text-primary-700">
                      {formatPhp(project.budget_amount)}
                    </div>
                  </div>
                )}
                {progress != null && (
                  <div className="py-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] uppercase tracking-wider text-gray-400">
                        Progress
                      </span>
                      <span
                        className={`text-[12px] font-bold ${progressTextColor(progress)}`}
                      >
                        {progress}%
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-gray-100">
                      <div
                        className={`h-full rounded-full ${progressColor(progress)}`}
                        style={{
                          width: `${Math.min(progress, 100)}%`,
                        }}
                      />
                    </div>
                  </div>
                )}
                <SideRow label="Status" value={project.status} />
                <SideRow label="Fiscal Year" value={raw.infraYear} />
                <SideRow label="Category" value={project.category} />
              </div>
            </SidePanel>

            {/* Quick Info */}
            <SidePanel title="Quick Info" icon={Info}>
              <div className="space-y-0.5">
                {raw.contractId && (
                  <SideRow
                    label="Contract"
                    value={
                      <span className="font-mono text-[10px]">
                        {raw.contractId}
                      </span>
                    }
                  />
                )}
                <SideRow
                  label="Contractor"
                  value={
                    project.contractor ? (
                      <span className="line-clamp-1">
                        {project.contractor.split('(')[0].trim()}
                      </span>
                    ) : null
                  }
                />
                <SideRow
                  label="Office"
                  value={
                    project.agency ? (
                      <span className="line-clamp-1">{project.agency}</span>
                    ) : null
                  }
                />
                <SideRow
                  label="Funding"
                  value={
                    raw.sourceOfFunds ? (
                      <span className="line-clamp-1">
                        {raw.sourceOfFunds}
                      </span>
                    ) : null
                  }
                />
              </div>
            </SidePanel>

            {/* Location */}
            {(locationLine || hasCoords) && (
              <SidePanel title="Location" icon={MapPin}>
                {locationLine && (
                  <p className="text-[12px] leading-relaxed text-gray-600">
                    {locationLine}
                  </p>
                )}
                {hasCoords && (
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="font-mono text-[10px] text-gray-400">
                      {project.latitude!.toFixed(5)},{' '}
                      {project.longitude!.toFixed(5)}
                    </span>
                    <a
                      href={`https://www.openstreetmap.org/?mlat=${project.latitude}&mlon=${project.longitude}#map=16/${project.latitude}/${project.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] font-medium text-primary-600 hover:text-primary-700"
                    >
                      OSM ↗
                    </a>
                  </div>
                )}
              </SidePanel>
            )}

            {/* Source & Freshness */}
            <SidePanel title="Source & Freshness" icon={Clock}>
              <div className="space-y-0.5">
                <SideRow
                  label="Source"
                  value={
                    <span className="font-medium">Bisto.ph</span>
                  }
                />
                <SideRow
                  label="First Tracked"
                  value={humanDate(project.first_seen_at)}
                />
                <SideRow label="Last Synced" value={syncAge} />
                <SideRow
                  label="Freshness"
                  value={
                    <span
                      className={`inline-flex items-center gap-1 font-semibold ${freshness.text}`}
                    >
                      <span
                        className={`h-1.5 w-1.5 rounded-full ${freshness.dot}`}
                      />
                      {freshness.label}
                    </span>
                  }
                />
                {raw.hasSatelliteImage && (
                  <SideRow
                    label="Satellite"
                    value={
                      <span className="inline-flex items-center gap-1 text-emerald-600">
                        <CheckCircle2 className="h-3 w-3" />
                        Available
                      </span>
                    }
                  />
                )}
                {raw.reportCount != null && (
                  <SideRow
                    label="Reports"
                    value={`${raw.reportCount}`}
                  />
                )}
              </div>
            </SidePanel>
          </div>
        </div>
      </div>
    </>
  );
}

export default InfrastructureDetail;
