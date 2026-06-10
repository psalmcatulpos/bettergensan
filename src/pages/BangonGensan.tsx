// /bangon-gensan — BangonGensan Emergency Response Surface
//
// Full-page operational map for emergency / disaster-response work.
// Cloned from CommandCenter; same layers and panels, separate brand so
// it can diverge for incident-specific overlays without disturbing the
// public Smart Map.

import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Protocol } from 'pmtiles';
import {
  ArrowLeft,
  MapPin,
  Shield,
  Layers,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Activity,
  Users,
  BadgeAlert,
  CircleDot,
  Thermometer,
  BarChart3,
  FileText,
  HandHelping,
  Send,
  CheckCircle2,
  Clock,
  Utensils,
  Droplet,
  Pill,
  Home as HomeIcon,
  LifeBuoy,
  ArrowRight,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import { GENSAN_BOUNDARY, isInsideGensan } from '../data/gensanBoundary';
import { GENSAN_BARANGAYS } from '../data/gensanBarangays';
import GENSAN_POPULATION from '../data/gensanPopulation.json';
import {
  readInfrastructureProjects,
  readSafetyReports,
  type InfrastructureProjectRow,
  type SafetyReportRow,
} from '../lib/gensanCache';
import { POLICE_STATIONS } from '../components/safety/policeStations';
import { HOSPITALS } from '../components/health/hospitals';
import { supabase } from '../lib/supabase';
import PrivacyGate from '../components/bangon/PrivacyGate';
import {
  cleanText,
  normalizePhonePH,
  isValidFacebookUrl,
  stripAngle,
  validatePhoto,
  tryConsumeSubmit,
  tryConsumeChat,
  hasLetter,
} from '../lib/bangonSanitize';

// ── BangonGensan: relief request shape (mirrors public.bangon_requests) ──
type BangonNeedType = 'food' | 'water' | 'medicine' | 'shelter' | 'rescue';
type BangonStatus = 'pending' | 'acknowledged' | 'fulfilled';

interface BangonRequest {
  id: string;
  need_type: BangonNeedType;
  barangay: string;
  landmark: string | null;
  full_name: string;
  contact_number: string;
  status: BangonStatus;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

const NEED_TYPES: { key: BangonNeedType; label: string; icon: React.ReactNode; tone: string }[] = [
  { key: 'food',     label: 'Food',     icon: <Utensils size={22} />,  tone: 'bg-amber-600/15 border-amber-500/40 text-amber-200 hover:bg-amber-600/25' },
  { key: 'water',    label: 'Water',    icon: <Droplet size={22} />,   tone: 'bg-sky-600/15 border-sky-500/40 text-sky-200 hover:bg-sky-600/25' },
  { key: 'medicine', label: 'Medicine', icon: <Pill size={22} />,      tone: 'bg-emerald-600/15 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/25' },
  { key: 'shelter',  label: 'Shelter',  icon: <HomeIcon size={22} />,  tone: 'bg-violet-600/15 border-violet-500/40 text-violet-200 hover:bg-violet-600/25' },
  { key: 'rescue',   label: 'Rescue',   icon: <LifeBuoy size={22} />,  tone: 'bg-red-600/15 border-red-500/40 text-red-200 hover:bg-red-600/25' },
];

const NEED_META: Record<BangonNeedType, { label: string; color: string; icon: React.ReactNode }> = {
  food:     { label: 'Food',     color: 'text-amber-300 bg-amber-900/30 border-amber-700/40',   icon: <Utensils size={10} /> },
  water:    { label: 'Water',    color: 'text-sky-300 bg-sky-900/30 border-sky-700/40',         icon: <Droplet size={10} /> },
  medicine: { label: 'Medicine', color: 'text-emerald-300 bg-emerald-900/30 border-emerald-700/40', icon: <Pill size={10} /> },
  shelter:  { label: 'Shelter',  color: 'text-violet-300 bg-violet-900/30 border-violet-700/40',icon: <HomeIcon size={10} /> },
  rescue:   { label: 'Rescue',   color: 'text-red-300 bg-red-900/30 border-red-700/40',         icon: <LifeBuoy size={10} /> },
};

const STATUS_META: Record<BangonStatus, { label: string; color: string }> = {
  pending:      { label: 'Pending',      color: 'bg-amber-600 hover:bg-amber-500 text-white' },
  acknowledged: { label: 'Acknowledged', color: 'bg-sky-600 hover:bg-sky-500 text-white' },
  fulfilled:    { label: 'Fulfilled',    color: 'bg-emerald-600 hover:bg-emerald-500 text-white' },
};
const STATUS_ORDER: BangonStatus[] = ['pending', 'acknowledged', 'fulfilled'];

// ── BangonGensan: incident reports ──────────────────────────────────
type IncidentType = 'natural_disaster' | 'fire' | 'medical' | 'security' | 'infrastructure' | 'other';
type BangonIncidentStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';
const INCIDENT_TYPES: { key: IncidentType; label: string; tone: string }[] = [
  { key: 'natural_disaster', label: 'Disaster',  tone: 'bg-orange-600/15 border-orange-500/40 text-orange-200 hover:bg-orange-600/25' },
  { key: 'fire',             label: 'Fire',      tone: 'bg-red-600/15 border-red-500/40 text-red-200 hover:bg-red-600/25' },
  { key: 'medical',          label: 'Medical',   tone: 'bg-emerald-600/15 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/25' },
  { key: 'security',         label: 'Security',  tone: 'bg-violet-600/15 border-violet-500/40 text-violet-200 hover:bg-violet-600/25' },
  { key: 'infrastructure',   label: 'Infra',     tone: 'bg-amber-600/15 border-amber-500/40 text-amber-200 hover:bg-amber-600/25' },
  { key: 'other',            label: 'Other',     tone: 'bg-gray-700/30 border-gray-600/50 text-gray-200 hover:bg-gray-700/50' },
];

interface BangonIncidentRow {
  id: string;
  incident_type: IncidentType;
  barangay: string;
  landmark: string | null;
  description: string;
  photo_url: string | null;
  contact_number: string;
  status: BangonIncidentStatus;
  verified: boolean;
  created_at: string;
  updated_at: string;
}

// Row shape for the bangon-social-sync edge function output.
// Coordinates are guaranteed non-null by the RLS policy (public read filter).
interface BangonSocialRow {
  id: string;
  external_id: string;
  source: 'facebook-disaster-pages' | 'facebook-disaster-search';
  source_page_name: string | null;
  source_query: string | null;
  category: string | null;
  severity: 'low' | 'medium' | 'high' | null;
  headline: string | null;
  summary: string | null;
  message: string | null;
  message_url: string | null;
  barangay: string | null;
  latitude: number;
  longitude: number;
  landmark: string | null;
  posted_at: string;
  verified: boolean;
}

// Disaster-category color mapping for the social-media layer. Falls through
// to a neutral gray if OpenAI returned a category not in this list.
const SOCIAL_COLOR: Record<string, string> = {
  Earthquake: '#a855f7',
  Flood: '#0ea5e9',
  Typhoon: '#0284c7',
  Landslide: '#92400e',
  'Fire Disaster': '#dc2626',
  'Power Outage': '#facc15',
  'Water Shortage': '#06b6d4',
  Evacuation: '#f97316',
  'Relief Operation': '#10b981',
  Rescue: '#ef4444',
  'Missing Person (Disaster)': '#7c3aed',
  Other: '#6b7280',
};
const SOCIAL_COLOR_DEFAULT = '#6b7280';

// Hex color + short label per need_type / incident_type — used by the Live Feed,
// the bottom legend, and the map markers. Kept in module scope so the same
// palette renders in every surface.
const NEED_COLOR: Record<BangonNeedType, string> = {
  food: '#f59e0b', water: '#0ea5e9', medicine: '#10b981',
  shelter: '#8b5cf6', rescue: '#ef4444',
};
const NEED_SHORT: Record<BangonNeedType, string> = {
  food: 'Food', water: 'Water', medicine: 'Medicine',
  shelter: 'Shelter', rescue: 'Rescue',
};
const INCIDENT_COLOR: Record<IncidentType, string> = {
  natural_disaster: '#f97316', fire: '#dc2626', medical: '#10b981',
  security: '#8b5cf6', infrastructure: '#f59e0b', other: '#6b7280',
};
const INCIDENT_SHORT: Record<IncidentType, string> = {
  natural_disaster: 'Disaster', fire: 'Fire', medical: 'Medical',
  security: 'Security', infrastructure: 'Infra', other: 'Other',
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return 'now';
  const m = Math.floor(diff / 60_000);
  if (m < 1) return 'now';
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
}

// ── BangonGensan: offer help tags ───────────────────────────────────
const OFFER_TAGS = ['Food', 'Water', 'Medicine', 'Shelter', 'Transport', 'Skills'] as const;
type OfferTag = (typeof OFFER_TAGS)[number];

// ── BangonGensan: anonymous chat ────────────────────────────────────
interface ChatMessage {
  id: string;
  session_id: string;
  display_name: string;
  content: string;
  created_at: string;
}

// Chat identity:
//   - Session ID lives in a SameSite=Lax cookie (24h TTL), not localStorage,
//     so it follows the browser session and clears on cookie purge.
//   - Display name is deterministic: hashed from `IP + session_id` so the
//     same IP-with-same-cookie always renders as the same handle. If the IP
//     lookup fails (offline, blocked), we degrade to session-only seed —
//     the name stays stable for that session.
const CHAT_COOKIE = 'bg_chat_session';
const CHAT_COOKIE_TTL_DAYS = 1;

const HANDLE_ADJ = [
  'Quiet', 'Brave', 'Calm', 'Quick', 'Steady', 'Kind', 'Sharp', 'Bright',
  'Bold', 'Fast', 'Gentle', 'Loyal', 'Wise', 'Lucky', 'Silent', 'Sturdy',
];
const HANDLE_ANIMAL = [
  'Tarsier', 'Tuna', 'Marlin', 'Hawk', 'Carabao', 'Falcon', 'Heron', 'Crab',
  'Egret', 'Manta', 'Eagle', 'Dolphin', 'Tamaraw', 'Kalaw', 'Maya', 'Pawikan',
];

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const prefix = name + '=';
  const match = document.cookie.split('; ').find(r => r.startsWith(prefix));
  return match ? decodeURIComponent(match.slice(prefix.length)) : null;
}

function writeCookie(name: string, value: string, days: number) {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

// xmur3-style 32-bit hash — deterministic and small.
function hash32(str: string): number {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return (h ^ (h >>> 16)) >>> 0;
}

function handleFromSeed(seed: string): string {
  const h = hash32(seed);
  const a = HANDLE_ADJ[h % HANDLE_ADJ.length];
  const b = HANDLE_ANIMAL[(h >>> 8) % HANDLE_ANIMAL.length];
  const n = (h >>> 16) % 100;
  return `${a}${b}${n.toString().padStart(2, '0')}`;
}

async function fetchClientIp(): Promise<string | null> {
  try {
    const res = await fetch('https://api.ipify.org?format=json', { cache: 'no-store' });
    if (!res.ok) return null;
    const data = await res.json();
    return typeof data?.ip === 'string' ? data.ip : null;
  } catch {
    return null;
  }
}

async function resolveChatHandle(): Promise<{ sessionId: string; displayName: string }> {
  if (typeof window === 'undefined') return { sessionId: 'srv', displayName: 'Anon' };

  // Clean up any prior localStorage-based identity so the cookie is the
  // single source of truth from now on.
  try {
    window.localStorage.removeItem('bg_chat_session_id');
    window.localStorage.removeItem('bg_chat_display_name');
  } catch { /* ignore */ }

  let sessionId = readCookie(CHAT_COOKIE);
  if (!sessionId) {
    sessionId = window.crypto?.randomUUID?.()
      ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    writeCookie(CHAT_COOKIE, sessionId, CHAT_COOKIE_TTL_DAYS);
  }

  const ip = await fetchClientIp();
  const seed = ip ? `${ip}|${sessionId}` : sessionId;
  return { sessionId, displayName: handleFromSeed(seed) };
}

const BARANGAY_NAMES: string[] = (GENSAN_BARANGAYS.features as Array<{ properties: { name: string } }>)
  .map(f => f.properties.name)
  .filter((n, i, arr) => arr.indexOf(n) === i)
  .sort((a, b) => a.localeCompare(b));

// Polygon centroid (average of outer-ring coords). Good enough for plotting
// bangon_requests / bangon_incidents — these only carry a barangay name, no
// lat/lng. The centroid puts the marker somewhere inside the barangay polygon.
function polygonCentroid(coords: number[][]): [number, number] {
  let lng = 0, lat = 0, n = 0;
  for (const [x, y] of coords) { lng += x; lat += y; n += 1; }
  return n > 0 ? [lng / n, lat / n] : [0, 0];
}

const BARANGAY_CENTROIDS: Record<string, [number, number]> = (() => {
  const out: Record<string, [number, number]> = {};
  for (const f of GENSAN_BARANGAYS.features as Array<{ properties: { name: string }; geometry: GeoJSON.Geometry }>) {
    const name = f.properties.name;
    const g = f.geometry;
    let ring: number[][] | null = null;
    if (g.type === 'Polygon') ring = g.coordinates[0] as number[][];
    else if (g.type === 'MultiPolygon') ring = (g.coordinates[0]?.[0] ?? null) as number[][] | null;
    if (ring) out[name.toLowerCase()] = polygonCentroid(ring);
  }
  return out;
})();

// PSA Census barangay population — 2020 official + 2024 estimate.
// 2020: PSA Census of Population (official per-barangay).
// 2024: PSA hasn't released barangay-level 2024 yet. City total = 722,059
// (0.86% annualized growth 2020→2024). Per-barangay estimates use each
// barangay's own 2015→2020 annualized growth rate projected to 2024.
// Labeled as "est." in the popup so it's not mistaken for official data.
const BARANGAY_POP: Record<string, { pop2020: number; pop2024est: number; growthPct: string }> = (() => {
  const raw: [string, number, number][] = [
    ['Apopong', 46384, 58314], ['Baluan', 7611, 11861], ['Batomelong', 3235, 2967],
    ['Buayan', 11196, 11487], ['Bula', 31363, 30845], ['Calumpang', 75342, 87718],
    ['City Heights', 24014, 24343], ['Conel', 11164, 15931],
    ['Dadiangas East', 4746, 3387], ['Dadiangas North', 8056, 6801],
    ['Dadiangas South', 6199, 4815], ['Dadiangas West', 13827, 13090],
    ['Fatima', 66460, 72613], ['Katangawan', 13948, 17355],
    ['Labangal', 61713, 77052], ['Lagao', 50789, 53706],
    ['Ligaya', 5298, 6688], ['Mabuhay', 28288, 37629],
    ['Olympog', 3352, 4455], ['San Isidro', 52832, 64958],
    ['San Jose', 11333, 13504], ['Siguel', 12757, 15687],
    ['Sinawal', 13285, 18467], ['Tambler', 21474, 31539],
    ['Tinagacan', 6322, 8344], ['Upper Labay', 3458, 3759],
  ];
  const out: Record<string, { pop2020: number; pop2024est: number; growthPct: string }> = {};
  for (const [name, p15, p20] of raw) {
    // Annualized growth (2015→2020), project forward 4 years to 2024 est.
    const annualGrowth = Math.pow(p20 / p15, 1 / 5) - 1;
    const est2024 = Math.round(p20 * Math.pow(1 + annualGrowth, 4));
    const pct = (annualGrowth * 100).toFixed(1);
    out[name] = { pop2020: p20, pop2024est: est2024, growthPct: `${Number(pct) >= 0 ? '+' : ''}${pct}%` };
  }
  out['Bawing'] = out['Siguel']; // alternate name
  return out;
})();

// ── Constants ────────────────────────────────────────────────────────

const GENSAN_CENTER: [number, number] = [125.1716, 6.1164]; // [lng, lat] for MapLibre
const DEFAULT_ZOOM = 13.5;
const DEFAULT_PITCH = 45;
const DEFAULT_BEARING = -12;

// ── Project NOAH Hazard Maps (PMTiles) ──────────────────────────────

const NOAH_PMTILES_BASE =
  'pmtiles://https://huggingface.co/datasets/bettergovph/project-noah-hazard-maps/resolve/main/PMTiles/layers';

type HazardLayerKey =
  | 'flood_5yr'
  | 'flood_25yr'
  | 'flood_100yr'
  | 'landslide'
  | 'debris_flow'
  | 'storm_surge_ssa1'
  | 'storm_surge_ssa2'
  | 'storm_surge_ssa3'
  | 'storm_surge_ssa4';

const HAZARD_LAYERS: {
  key: HazardLayerKey;
  label: string;
  group: string;
  sourceLayer: string;
  file: string;
  field: string; // attribute field: "Var" for flood, "HAZ" for others
  colors: [string, string, string]; // Low, Medium, High
}[] = [
  // Flood: extreme (bottom) → heavy → regular (top) so common floods overlay rare ones
  { key: 'flood_100yr', label: 'Extreme Rain', group: 'Flood', sourceLayer: 'flood_100yr', file: 'flood_100yr.pmtiles', field: 'Var', colors: ['#fca5a5', '#ef4444', '#991b1b'] },
  { key: 'flood_25yr', label: 'Heavy Rain', group: 'Flood', sourceLayer: 'flood_25yr', file: 'flood_25yr.pmtiles', field: 'Var', colors: ['#fde68a', '#f59e0b', '#d97706'] },
  { key: 'flood_5yr', label: 'Regular Rain', group: 'Flood', sourceLayer: 'flood_5yr', file: 'flood_5yr.pmtiles', field: 'Var', colors: ['#bfdbfe', '#60a5fa', '#2563eb'] },
  // Landslide: main hazard below, debris flow on top
  { key: 'landslide', label: 'Landslide', group: 'Landslide', sourceLayer: 'landslide', file: 'landslide.pmtiles', field: 'HAZ', colors: ['#fde68a', '#f59e0b', '#b45309'] },
  { key: 'debris_flow', label: 'Debris Flow', group: 'Landslide', sourceLayer: 'debris_flow', file: 'debris_flow.pmtiles', field: 'HAZ', colors: ['#fdba74', '#ea580c', '#9a3412'] },
  // Storm surge: catastrophic (bottom) → minor (top)
  { key: 'storm_surge_ssa4', label: 'Catastrophic (>5 m)', group: 'Storm Surge', sourceLayer: 'storm_surge_ssa4', file: 'storm_surge_ssa4.pmtiles', field: 'HAZ', colors: ['#7f1d1d', '#dc2626', '#fca5a5'] },
  { key: 'storm_surge_ssa3', label: 'Severe (4–5 m)', group: 'Storm Surge', sourceLayer: 'storm_surge_ssa3', file: 'storm_surge_ssa3.pmtiles', field: 'HAZ', colors: ['#9a3412', '#ea580c', '#fdba74'] },
  { key: 'storm_surge_ssa2', label: 'Moderate (3–4 m)', group: 'Storm Surge', sourceLayer: 'storm_surge_ssa2', file: 'storm_surge_ssa2.pmtiles', field: 'HAZ', colors: ['#0e7490', '#06b6d4', '#a5f3fc'] },
  { key: 'storm_surge_ssa1', label: 'Minor (2–3 m)', group: 'Storm Surge', sourceLayer: 'storm_surge_ssa1', file: 'storm_surge_ssa1.pmtiles', field: 'HAZ', colors: ['#a5f3fc', '#67e8f9', '#cffafe'] },
];

// Bounding box for GenSan — limits PMTiles tile fetching to the city area only
const GENSAN_BOUNDS: [number, number, number, number] = [124.99, 5.92, 125.27, 6.30];

const HAZARD_GROUP_ICONS: Record<string, string> = {
  Flood: '💧',
  Landslide: '⛰️',
  'Storm Surge': '🌊',
};

// ── PHIVOLCS Tsunami Inundation (HazardHunterPH KMZ L4 pyramid) ──────
// Pyramidal LOD tile set from PHIVOLCS HazardHunterPH for GenSan
// (PSGC 126303000, tsu_2025_126303000_05). The L4 tier is the highest
// resolution: 3 rows × 5 cols of 1024×1024 PNGs with alpha, no chrome.
// Each tile's [west, south, east, north] WGS84 bounds come straight
// from the KML LatLonBox — do NOT crop or reproject. Hosted as static
// assets under /public/maps/phivolcs/tsunami/.
type PhivolcsLayerKey = 'tsunami';

interface PhivolcsTile {
  file: string;
  west: number;
  south: number;
  east: number;
  north: number;
}

interface PhivolcsLayerDef {
  key: PhivolcsLayerKey;
  label: string;
  publishedYear: number;
  basePath: string;
  defaultOpacity: number;
  tiles: PhivolcsTile[];
  gradient: [string, string];
  description: string;
  legend: { color: string; label: string }[];
}

const PHIVOLCS_LAYERS: PhivolcsLayerDef[] = [
  {
    key: 'tsunami',
    label: 'Tsunami Inundation',
    publishedYear: 2025,
    basePath: '/maps/phivolcs/tsunami',
    defaultOpacity: 0.7,
    gradient: ['#fde047', '#0c4a6e'],
    description: 'Modeled tsunami inundation along the GenSan coastline (Sarangani Bay) from credible offshore earthquake sources.',
    legend: [
      { color: '#fde047', label: '≤3 m' },
      { color: '#0ea5e9', label: '3–6 m' },
      { color: '#0c4a6e', label: '>6 m' },
    ],
    // Bounds copied verbatim from the KML LatLonBox. No coordinate math.
    tiles: [
      { file: 'L4_0_0.png', west: 124.91207, south: 6.19806, east: 125.05497, north: 6.34088 },
      { file: 'L4_0_1.png', west: 125.05497, south: 6.19806, east: 125.19787, north: 6.34088 },
      { file: 'L4_0_2.png', west: 125.19787, south: 6.19806, east: 125.34076, north: 6.34088 },
      { file: 'L4_0_3.png', west: 125.34076, south: 6.19806, east: 125.48366, north: 6.34088 },
      { file: 'L4_0_4.png', west: 125.48366, south: 6.19806, east: 125.49999, north: 6.34088 },
      { file: 'L4_1_0.png', west: 124.91207, south: 6.05524, east: 125.05497, north: 6.19806 },
      { file: 'L4_1_1.png', west: 125.05497, south: 6.05524, east: 125.19787, north: 6.19806 },
      { file: 'L4_1_2.png', west: 125.19787, south: 6.05524, east: 125.34076, north: 6.19806 },
      { file: 'L4_1_3.png', west: 125.34076, south: 6.05524, east: 125.48366, north: 6.19806 },
      { file: 'L4_1_4.png', west: 125.48366, south: 6.05524, east: 125.49999, north: 6.19806 },
      { file: 'L4_2_0.png', west: 124.91207, south: 5.92525, east: 125.05497, north: 6.05524 },
      { file: 'L4_2_1.png', west: 125.05497, south: 5.92525, east: 125.19787, north: 6.05524 },
      { file: 'L4_2_2.png', west: 125.19787, south: 5.92525, east: 125.34076, north: 6.05524 },
      { file: 'L4_2_3.png', west: 125.34076, south: 5.92525, east: 125.48366, north: 6.05524 },
      { file: 'L4_2_4.png', west: 125.48366, south: 5.92525, east: 125.49999, north: 6.05524 },
    ],
  },
];

// ── Marine Analytics Layers (WMTS / XYZ raster tiles) ───────


type OceanLayerKey =
  | 'chlorophyll'
  | 'sst'
  | 'bathymetry'
  | 'sla'
  | 'currents'
  | 'wind_waves'
  | 'salinity';

interface OceanLayerDef {
  key: OceanLayerKey;
  label: string;
  group: 'Productivity' | 'Physics' | 'Conditions';
  /** WMTS/XYZ tile URL with {z}/{y}/{x} placeholders. {date} replaced at runtime. */
  tileUrl: string;
  needsDate: boolean;
  /** Days to subtract from today for the {date} placeholder. Default 2 for GIBS processing lag. */
  dateLagDays?: number;
  /** Max zoom level the source provides — MapLibre upscales beyond this */
  maxzoom: number;
  /** 1 = browser-fetchable now, 2 = needs backend proxy, 3 = needs tile generation */
  phase: 1 | 2 | 3;
  defaultOpacity: number;
  legend: { color: string; label: string }[];
  attribution: string;
}

// NASA GIBS WMTS REST endpoint — standard XYZ tiles, no auth required.
// TileMatrixSet determines max zoom: Level7 = z0-7, Level9 = z0-9.
// MapLibre upscales tiles beyond maxzoom so they stay visible at city zoom.
const GIBS_WMTS = 'https://gibs.earthdata.nasa.gov/wmts/epsg3857/best';

const OCEAN_LAYERS: OceanLayerDef[] = [
  // Phase 1 — free, no auth, GIBS WMTS REST tiles (verified working)
  //
  // GIBS REST pattern: {base}/{Layer}/default/{date}/{TileMatrixSet}/{z}/{y}/{x}.{ext}
  // NOTE: GIBS uses {z}/{y}/{x} (row then column), which matches MapLibre's
  // {z}/{y}/{x} placeholders when used in the `tiles` array.
  {
    key: 'chlorophyll',
    label: 'Chlorophyll-a',
    group: 'Productivity',
    // OCI PACE — newer sensor with wider swath than MODIS for better daily
    // coverage. Still L2 swath data so gaps are expected on any single day.
    tileUrl: `${GIBS_WMTS}/OCI_PACE_Chlorophyll_a/default/{date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`,
    needsDate: true,
    maxzoom: 7,
    phase: 1,
    defaultOpacity: 0.7,
    legend: [
      { color: '#440154', label: 'Low' },
      { color: '#21918c', label: 'Med' },
      { color: '#fde725', label: 'High' },
    ],
    attribution: 'NASA PACE OCI',
  },
  {
    key: 'sst',
    label: 'SST Anomaly',
    group: 'Productivity',
    // SST ANOMALY — deviation from historical average. Fish react to
    // change, not absolute temp. In PH waters (28-31°C year-round),
    // absolute SST is a useless red blob. Anomaly reveals the structure:
    // unusual warming/cooling zones where prey aggregates.
    // L4 MUR global composite, full ocean coverage, daily, ~1 day lag.
    tileUrl: `${GIBS_WMTS}/GHRSST_L4_MUR_Sea_Surface_Temperature_Anomalies/default/{date}/GoogleMapsCompatible_Level7/{z}/{y}/{x}.png`,
    needsDate: true,
    maxzoom: 7,
    phase: 1,
    defaultOpacity: 0.65,
    legend: [
      { color: '#313695', label: 'Cooler' },
      { color: '#ffffbf', label: 'Normal' },
      { color: '#a50026', label: 'Warmer' },
    ],
    attribution: 'NASA GHRSST MUR L4 Anomaly',
  },
  {
    key: 'bathymetry',
    label: 'Bathymetry',
    group: 'Physics',
    // ArcGIS Ocean Base — desaturated + dimmed at layer level to act as
    // subtle depth shading, not a standalone basemap. Ghost-like opacity.
    tileUrl: 'https://services.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    needsDate: false,
    maxzoom: 10,
    phase: 1,
    defaultOpacity: 0.2,
    legend: [
      { color: '#1a1a2e', label: 'Deep' },
      { color: '#4a4a5a', label: 'Shelf' },
      { color: '#8a8a95', label: 'Shallow' },
    ],
    attribution: 'Esri Ocean Basemap',
  },
  // Phase 2 — locked, no free tile service with current data.
  // SLA: GIBS JPL MEaSUREs dataset ended ~2021. Needs Copernicus Marine proxy.
  // Currents: GIBS OSCAR dataset ended July 2024. Needs Copernicus Marine proxy.
  // Wind & Waves: no free XYZ tile service exists at all.
  {
    key: 'sla',
    label: 'Sea Level Anomaly',
    group: 'Physics',
    tileUrl: '',
    needsDate: true,
    maxzoom: 0,
    phase: 2,
    defaultOpacity: 0.6,
    legend: [
      { color: '#313695', label: 'Low' },
      { color: '#fee090', label: 'Neutral' },
      { color: '#a50026', label: 'High' },
    ],
    attribution: 'Copernicus Marine',
  },
  {
    key: 'currents',
    label: 'Surface Currents',
    group: 'Physics',
    tileUrl: '',
    needsDate: true,
    maxzoom: 0,
    phase: 2,
    defaultOpacity: 0.6,
    legend: [
      { color: '#edf8fb', label: 'Slow' },
      { color: '#006d2c', label: 'Fast' },
    ],
    attribution: 'Copernicus Marine',
  },
  {
    key: 'wind_waves',
    label: 'Wind & Waves',
    group: 'Conditions',
    tileUrl: '',
    needsDate: true,
    maxzoom: 0,
    phase: 2,
    defaultOpacity: 0.6,
    legend: [
      { color: '#eff3ff', label: 'Calm' },
      { color: '#08519c', label: 'Rough' },
    ],
    attribution: 'Copernicus Marine',
  },
  {
    key: 'salinity',
    label: 'Salinity',
    group: 'Conditions',
    // NASA SMAP L3 8-day running mean — satellite microwave radiometer.
    // Shows freshwater plume boundaries (river discharge, rainfall runoff)
    // which concentrate baitfish at salinity fronts.
    // Uses 10-day lag (SMAP data has ~8-10 day processing delay).
    tileUrl: `${GIBS_WMTS}/SMAP_L3_Sea_Surface_Salinity_CAP_8Day_RunningMean/default/{date}/GoogleMapsCompatible_Level6/{z}/{y}/{x}.png`,
    needsDate: true,
    dateLagDays: 10,
    maxzoom: 6,
    phase: 1,
    defaultOpacity: 0.6,
    legend: [
      { color: '#f7fbff', label: 'Fresh' },
      { color: '#08306b', label: 'Saline' },
    ],
    attribution: 'NASA SMAP',
  },
];

const PHASE1_OCEAN = OCEAN_LAYERS.filter(l => l.phase === 1);

// ── Live Tracking (Flights via ADSB.fi) ─────────────────────────────

const ADSB_POLL_MS = 15_000; // refresh aircraft positions every 15s
const ADSB_RADIUS_NM = 250; // nautical miles — covers Mindanao region

interface AircraftPosition {
  hex: string;
  flight: string;
  registration: string;
  type: string;
  desc: string;
  lat: number;
  lon: number;
  alt: number | 'ground';
  gs: number; // ground speed in knots
  heading: number;
  vertRate: number;
  squawk: string;
  seen: number;
}

function parseAircraftData(raw: Record<string, unknown>): AircraftPosition {
  return {
    hex: String(raw.hex ?? ''),
    flight: String(raw.flight ?? '').trim(),
    registration: String(raw.r ?? ''),
    type: String(raw.t ?? ''),
    desc: String(raw.desc ?? ''),
    lat: Number(raw.lat) || 0,
    lon: Number(raw.lon) || 0,
    alt: raw.alt_baro === 'ground' ? 'ground' : (Number(raw.alt_baro) || 0),
    gs: Number(raw.gs) || 0,
    heading: Number(raw.track) || 0,
    vertRate: Number(raw.baro_rate) || 0,
    squawk: String(raw.squawk ?? ''),
    seen: Number(raw.seen) || 0,
  };
}

function aircraftToGeoJSON(aircraft: AircraftPosition[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: aircraft
      .filter(a => a.lat !== 0 && a.lon !== 0)
      .map(a => ({
        type: 'Feature' as const,
        properties: {
          hex: a.hex,
          flight: a.flight,
          registration: a.registration,
          type: a.type,
          desc: a.desc,
          alt: a.alt === 'ground' ? 0 : a.alt,
          altLabel: a.alt === 'ground' ? 'Ground' : `${Number(a.alt).toLocaleString()} ft`,
          gs: Math.round(a.gs),
          heading: a.heading,
          vertRate: a.vertRate,
          squawk: a.squawk,
          isGround: a.alt === 'ground',
          // Rotate icon: MapLibre uses 'icon-rotate' with this property
          rotation: a.heading,
        },
        geometry: { type: 'Point' as const, coordinates: [a.lon, a.lat] },
      })),
  };
}

// ── AIS Ship Tracking (AISStream.io WebSocket) ─────────────────────

// Free API key from https://aisstream.io — set as VITE_AISSTREAM_API_KEY
const AISSTREAM_KEY = import.meta.env.VITE_AISSTREAM_API_KEY as string | undefined;

// Bounding box for AIS subscription: Sarangani Bay + Celebes Sea approach
const AIS_BBOX: [[number, number], [number, number]] = [[5.0, 124.0], [7.0, 126.5]];

interface VesselPosition {
  mmsi: number;
  name: string;
  shipType: number;
  lat: number;
  lon: number;
  cog: number; // course over ground
  sog: number; // speed over ground (knots)
  heading: number;
  destination: string;
  eta: string;
  lastUpdate: number; // timestamp ms
}

const SHIP_TYPE_LABEL: Record<number, string> = {
  30: 'Fishing',
  31: 'Towing', 32: 'Towing (large)', 33: 'Dredging', 34: 'Diving ops',
  35: 'Military', 36: 'Sailing', 37: 'Pleasure craft',
  40: 'High-speed craft', 50: 'Pilot vessel', 51: 'SAR', 52: 'Tug',
  53: 'Port tender', 55: 'Law enforcement',
  60: 'Passenger', 61: 'Passenger', 62: 'Passenger', 63: 'Passenger', 69: 'Passenger',
  70: 'Cargo', 71: 'Cargo (hazardous A)', 72: 'Cargo (hazardous B)', 79: 'Cargo',
  80: 'Tanker', 81: 'Tanker (hazardous A)', 89: 'Tanker',
};

function shipTypeLabel(type: number): string {
  if (SHIP_TYPE_LABEL[type]) return SHIP_TYPE_LABEL[type];
  if (type >= 20 && type < 30) return 'Wing in ground';
  if (type >= 40 && type < 50) return 'High-speed craft';
  if (type >= 60 && type < 70) return 'Passenger';
  if (type >= 70 && type < 80) return 'Cargo';
  if (type >= 80 && type < 90) return 'Tanker';
  return 'Vessel';
}

function shipColor(type: number): string {
  if (type === 30) return '#22c55e'; // fishing = green (important for GenSan!)
  if (type >= 60 && type < 70) return '#3b82f6'; // passenger = blue
  if (type >= 70 && type < 80) return '#f59e0b'; // cargo = amber
  if (type >= 80 && type < 90) return '#ef4444'; // tanker = red
  if (type === 35) return '#6b7280'; // military = gray
  if (type === 52) return '#8b5cf6'; // tug = purple
  return '#6366f1'; // default indigo
}

function vesselsToGeoJSON(vessels: VesselPosition[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: vessels.map(v => ({
      type: 'Feature' as const,
      properties: {
        mmsi: v.mmsi,
        name: v.name,
        shipType: v.shipType,
        typeLabel: shipTypeLabel(v.shipType),
        color: shipColor(v.shipType),
        sog: v.sog,
        cog: v.cog,
        heading: v.heading,
        destination: v.destination,
        eta: v.eta,
        isFishing: v.shipType === 30,
      },
      geometry: { type: 'Point' as const, coordinates: [v.lon, v.lat] },
    })),
  };
}

// ── Nautical / Maritime features (OSM Overpass) ─────────────────────

interface NauticalFeature {
  id: number;
  name: string;
  type: string; // seamark:type or man_made or amenity
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

const NAUTICAL_ICON: Record<string, string> = {
  light_major: '🔦',
  light_minor: '🔦',
  lighthouse: '🏠',
  ferry_terminal: '⛴️',
  harbour: '⚓',
  marina: '🚤',
  pier: '🔩',
  buoy_lateral: '🔴',
  buoy_cardinal: '🔶',
  buoy_special_purpose: '🟡',
};

const NAUTICAL_COLOR: Record<string, string> = {
  light_major: '#f59e0b',
  light_minor: '#fbbf24',
  lighthouse: '#f59e0b',
  ferry_terminal: '#3b82f6',
  harbour: '#6366f1',
  marina: '#8b5cf6',
  pier: '#6b7280',
};

function nauticalToGeoJSON(features: NauticalFeature[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: features.map(f => ({
      type: 'Feature' as const,
      properties: {
        id: f.id,
        name: f.name,
        featureType: f.type,
        icon: NAUTICAL_ICON[f.type] || '⚓',
        color: NAUTICAL_COLOR[f.type] || '#6366f1',
        // Extra tags for popup
        seamarkName: f.tags['seamark:name'] || '',
        description: f.tags.description || f.tags.note || '',
        operator: f.tags.operator || '',
      },
      geometry: { type: 'Point' as const, coordinates: [f.lon, f.lat] },
    })),
  };
}

const OVERPASS_NAUTICAL_QUERY = `[out:json][timeout:15];(node["seamark:type"](5.2,124.5,6.5,126.0);node["man_made"="lighthouse"](5.2,124.5,6.5,126.0);node["leisure"="marina"](5.2,124.5,6.5,126.0);node["amenity"="ferry_terminal"](5.2,124.5,6.5,126.0);node["harbour"](5.2,124.5,6.5,126.0););out body;`;

// ── Critical Infrastructure POI categories ──────────────────────────

interface InfraPOICategory {
  key: string;
  label: string;
  group: string;
  icon: string;
  color: string;
  /** 'local' = use bundled data, 'osm' = fetch from Overpass */
  source: 'local' | 'osm';
  /** OSM tag filter for Overpass (only for source='osm') */
  osmFilter?: string;
}

const INFRA_POI_CATEGORIES: InfraPOICategory[] = [
  // Government & Control — from OSM (city hall, barangay halls, gov offices)
  { key: 'city_hall', label: 'City / Town Hall', group: 'Government', icon: '🏛️', color: '#4f46e5', source: 'osm', osmFilter: 'amenity=townhall' },
  { key: 'gov_offices', label: 'Government Offices', group: 'Government', icon: '🏛️', color: '#6366f1', source: 'osm', osmFilter: 'office=government' },
  { key: 'courts', label: 'Courts', group: 'Government', icon: '⚖️', color: '#818cf8', source: 'osm', osmFilter: 'amenity=courthouse' },
  // Security & Emergency — police from bundled data, fire from OSM
  { key: 'police', label: 'Police Stations', group: 'Security', icon: '🚓', color: '#3b82f6', source: 'local' },
  { key: 'fire', label: 'Fire Stations', group: 'Security', icon: '🚒', color: '#ef4444', source: 'osm', osmFilter: 'amenity=fire_station' },
  // Critical Services — hospitals from bundled data, rest from OSM
  { key: 'hospitals', label: 'Hospitals', group: 'Services', icon: '🏥', color: '#dc2626', source: 'local' },
  { key: 'clinics', label: 'Clinics', group: 'Services', icon: '🩺', color: '#f97316', source: 'osm', osmFilter: 'amenity=clinic' },
  { key: 'pharmacies', label: 'Pharmacies', group: 'Services', icon: '💊', color: '#22c55e', source: 'osm', osmFilter: 'amenity=pharmacy' },
];

interface InfraPOI {
  id: number;
  name: string;
  category: string; // key from INFRA_POI_CATEGORIES
  lat: number;
  lon: number;
  tags: Record<string, string>;
}

const OSM_INFRA_CATS = INFRA_POI_CATEGORIES.filter(c => c.source === 'osm' && c.osmFilter);

/** Build Overpass query for OSM-sourced categories only */
function buildInfraOverpassQuery(): string | null {
  if (OSM_INFRA_CATS.length === 0) return null;
  const nodes = OSM_INFRA_CATS.map(c => {
    const [k, v] = c.osmFilter!.split('=');
    return `node["${k}"="${v}"](area.a);`;
  }).join('');
  return `[out:json][timeout:15];area["name"="General Santos"]->.a;(${nodes});out body;`;
}

function classifyInfraPOI(tags: Record<string, string>): string {
  for (const cat of OSM_INFRA_CATS) {
    const [k, v] = cat.osmFilter!.split('=');
    if (tags[k] === v) return cat.key;
  }
  return 'gov_offices';
}

/** Convert bundled police + hospital data into InfraPOI format */
function getLocalInfraPOIs(): InfraPOI[] {
  const pois: InfraPOI[] = [];
  // Police stations — from src/components/safety/policeStations.ts
  for (const s of POLICE_STATIONS) {
    pois.push({
      id: 900000 + s.number,
      name: s.name,
      category: 'police',
      lat: s.position[0],
      lon: s.position[1],
      tags: {
        name: s.name,
        'addr:street': s.address,
        phone: s.phone,
        ...(s.approximate ? { note: 'Approximate location (barangay centroid)' } : {}),
      },
    });
  }
  // Hospitals — from src/components/health/hospitals.ts
  for (let i = 0; i < HOSPITALS.length; i++) {
    const h = HOSPITALS[i];
    pois.push({
      id: 800000 + i,
      name: h.name,
      category: 'hospitals',
      lat: h.position[0],
      lon: h.position[1],
      tags: {
        name: h.name,
        'addr:street': h.address || '',
        phone: h.phones?.join(', ') || '',
        operator: h.type,
      },
    });
  }
  return pois;
}

function infraPOIToGeoJSON(pois: InfraPOI[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: pois.map(p => {
      const cat = INFRA_POI_CATEGORIES.find(c => c.key === p.category);
      return {
        type: 'Feature' as const,
        properties: {
          id: p.id,
          name: p.name,
          category: p.category,
          categoryLabel: cat?.label || p.category,
          icon: cat?.icon || '📍',
          color: cat?.color || '#6b7280',
          address: p.tags['addr:street'] || p.tags['addr:full'] || '',
          phone: p.tags.phone || p.tags['contact:phone'] || '',
          website: p.tags.website || p.tags['contact:website'] || '',
          operator: p.tags.operator || '',
          openingHours: p.tags.opening_hours || '',
        },
        geometry: { type: 'Point' as const, coordinates: [p.lon, p.lat] },
      };
    }),
  };
}

// ── Types ────────────────────────────────────────────────────────────

type IncidentCategory =
  | 'Theft'
  | 'Assault'
  | 'Drug-related'
  | 'Vehicular'
  | 'Fire'
  | 'Disturbance'
  | 'Missing Person'
  | 'Natural Disaster'
  | 'Public Health'
  | 'Government Advisory'
  | 'Other';

interface Incident {
  id: number;
  category: IncidentCategory;
  barangay: string;
  summary: string;
  source: string;
  timestamp: string;
  postedAt: string; // ISO date for filtering
  lat: number;
  lng: number;
  url?: string;
  imageUrl?: string;
  severity: 'low' | 'medium' | 'high';
}

// ── Helpers ──────────────────────────────────────────────────────────

const categoryColor: Record<IncidentCategory, string> = {
  Theft: '#e12e2e',
  Assault: '#d97706',
  'Drug-related': '#7c3aed',
  Vehicular: '#0066eb',
  Fire: '#ef4444',
  Disturbance: '#f59e0b',
  'Missing Person': '#06b6d4',
  'Natural Disaster': '#059669',
  'Public Health': '#0891b2',
  'Government Advisory': '#4f46e5',
  Other: '#6b7280',
};

const severityDot = {
  low: 'bg-blue-400',
  medium: 'bg-amber-400',
  high: 'bg-red-500',
};

function severityRadius(s: string) {
  return s === 'high' ? 10 : s === 'medium' ? 7 : 5;
}

// ── Infrastructure layer helpers ─────────────────────────────────────

type InfraStatus = 'Completed' | 'On-Going' | 'For Procurement' | 'Not Yet Started';

const INFRA_STATUSES: InfraStatus[] = ['Completed', 'On-Going', 'For Procurement', 'Not Yet Started'];

const infraStatusColor: Record<string, string> = {
  Completed: '#00af5f',
  'On-Going': '#0066eb',
  'For Procurement': '#f58900',
  'Not Yet Started': '#9ca3af',
};

function normalizeInfraStatus(raw: string | null): InfraStatus {
  if (!raw) return 'Not Yet Started';
  const s = raw.toLowerCase();
  if (s.includes('completed') || s.includes('done')) return 'Completed';
  if (s.includes('on-going') || s.includes('ongoing') || s.includes('progress')) return 'On-Going';
  if (s.includes('procurement')) return 'For Procurement';
  return 'Not Yet Started';
}

function infraProjectsToGeoJSON(projects: InfrastructureProjectRow[]): GeoJSON.FeatureCollection {
  return {
    type: 'FeatureCollection',
    features: projects
      .filter(p => p.latitude && p.longitude)
      .map(p => {
        const status = normalizeInfraStatus(p.status);
        return {
          type: 'Feature' as const,
          properties: {
            id: p.id,
            title: p.title,
            status,
            category: p.category || 'Infrastructure',
            contractor: p.contractor || 'N/A',
            budget: p.budget_amount,
            color: infraStatusColor[status] || '#9ca3af',
          },
          geometry: { type: 'Point' as const, coordinates: [p.longitude!, p.latitude!] },
        };
      }),
  };
}

// ── GeoJSON builders ─────────────────────────────────────────────────

function incidentsToGeoJSON(incidents: Incident[]): GeoJSON.FeatureCollection {
  // Offset markers at the same coordinates so they don't stack
  const seen = new Map<string, number>();
  return {
    type: 'FeatureCollection',
    features: incidents.map(i => {
      const key = `${i.lat.toFixed(4)},${i.lng.toFixed(4)}`;
      const count = seen.get(key) ?? 0;
      seen.set(key, count + 1);
      // Spiral offset for stacked markers
      const angle = count * 2.4; // golden angle
      const dist = count * 0.0008; // ~80m per step
      const lng = i.lng + Math.cos(angle) * dist;
      const lat = i.lat + Math.sin(angle) * dist;
      return {
        type: 'Feature' as const,
        properties: {
          id: i.id,
          category: i.category,
          barangay: i.barangay,
          summary: i.summary,
          source: i.source,
          timestamp: i.timestamp,
          severity: i.severity,
          color: categoryColor[i.category],
          radius: severityRadius(i.severity),
          url: i.url ?? '',
          imageUrl: i.imageUrl ?? '',
        },
        geometry: { type: 'Point' as const, coordinates: [lng, lat] },
      };
    }),
  };
}

// ── Map styles ───────────────────────────────────────────────────────

const MAP_STYLE_LIGHT: maplibregl.StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: 'raster',
      tiles: ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
    'terrain-dem': {
      type: 'raster-dem',
      tiles: ['https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'],
      encoding: 'terrarium',
      tileSize: 256,
      maxzoom: 15,
    },
  },
  terrain: { source: 'terrain-dem', exaggeration: 1.5 },
  glyphs: 'https://demotiles.maplibre.org/font/{fontstack}/{range}.pbf',
  layers: [
    {
      id: 'osm-raster', type: 'raster', source: 'osm',
      paint: { 'raster-saturation': -0.25, 'raster-brightness-max': 1 },
    },
    {
      id: 'hillshade', type: 'hillshade', source: 'terrain-dem',
      paint: {
        'hillshade-shadow-color': '#473B24',
        'hillshade-illumination-anchor': 'map',
        'hillshade-exaggeration': 0.3,
      },
    },
  ],
};


// ── Main component ──────────────────────────────────────────────────

export default function BangonGensan() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const popupRef = useRef<maplibregl.Popup | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);
  // Refs for barangay popup — closure-safe access to latest data
  const dataRef = useRef({
    filteredIncidents: [] as Incident[],
    filteredInfraProjects: [] as InfrastructureProjectRow[],
    filteredInfraPOIData: [] as InfraPOI[],
    infraPOIData: [] as InfraPOI[],
    aircraft: [] as AircraftPosition[],
    vessels: [] as VesselPosition[],
  });

  const [layers, setLayers] = useState<Record<IncidentCategory, boolean>>({
    Theft: false, Assault: false, 'Drug-related': false, Vehicular: false,
    Fire: false, Disturbance: false, 'Missing Person': false,
    'Natural Disaster': false, 'Public Health': false, 'Government Advisory': false, Other: false,
  });
  const [layerPanelOpen, setLayerPanelOpen] = useState(true);
  const [mapReady, setMapReady] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'chat' | 'controls' | 'sidebar'>('map');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Incidents: false, Infrastructure: false, 'Hazard Maps': false, PHIVOLCS: false, 'Population': false, 'Ocean': false, 'Tracking': false, 'Critical Infra': false });
  const [showInfra, setShowInfra] = useState(false);
  const [infraStatuses, setInfraStatuses] = useState<Record<InfraStatus, boolean>>({
    Completed: false, 'On-Going': false, 'For Procurement': false, 'Not Yet Started': false,
  });
  const [infraProjects, setInfraProjects] = useState<InfrastructureProjectRow[]>([]);
  const [safetyReports, setSafetyReports] = useState<SafetyReportRow[]>([]);
  // Timeline: range as 0-1 fractions of the selected window
  const [timelineWindow, setTimelineWindow] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [timelineRange, setTimelineRange] = useState<[number, number]>([0, 1]);
  const [timelineOpen] = useState(false);
  const darkMode = true;
  // BangonGensan tabbed panels ──────────────────────────────────────────
  const [rightTab, setRightTab] = useState<'reports' | 'requests' | 'fundraisers'>('reports');

  // Approved fundraisers (RLS filters to status='approved' for anon)
  interface FundraiserRow {
    id: string;
    title: string;
    description: string;
    goal_amount: number;
    payment_details: string;
    contact_name: string;
    contact_number: string;
    facebook_url: string | null;
    created_at: string;
  }
  const [fundraisers, setFundraisers] = useState<FundraiserRow[]>([]);
  const [fundraisersError, setFundraisersError] = useState<string | null>(null);
  const loadFundraisers = async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('bangon_fundraisers')
      .select('id, title, description, goal_amount, payment_details, contact_name, contact_number, facebook_url, created_at')
      .order('created_at', { ascending: false })
      .limit(100);
    if (error) { setFundraisersError(error.message); return; }
    setFundraisersError(null);
    setFundraisers((data as FundraiserRow[]) ?? []);
  };
  useEffect(() => {
    if (rightTab !== 'fundraisers') return;
    void loadFundraisers();
    const i = setInterval(() => void loadFundraisers(), 30000);
    return () => clearInterval(i);
    // loadFundraisers is stable across renders; only the tab switch should trigger.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rightTab]);

  // Multi-step request form state
  const [requestStep, setRequestStep] = useState<1 | 2 | 3>(1);
  const [formNeedType, setFormNeedType] = useState<BangonNeedType | null>(null);
  const [formBarangay, setFormBarangay] = useState('');
  const [formLandmark, setFormLandmark] = useState('');
  const [formFullName, setFormFullName] = useState('');
  const [formContact, setFormContact] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Triage list state
  const [bangonRequests, setBangonRequests] = useState<BangonRequest[]>([]);
  const [bangonIncidentRows, setBangonIncidentRows] = useState<BangonIncidentRow[]>([]);
  const [bangonSocialReports, setBangonSocialReports] = useState<BangonSocialRow[]>([]);
  const [triageSort, setTriageSort] = useState<'time' | 'need' | 'barangay'>('time');
  const [triageError, setTriageError] = useState<string | null>(null);

  // Right-panel row → map highlight. Set when the user clicks a Reports or
  // Requests row; the map flies to that marker and a yellow ring highlights
  // it for a few seconds, then clears.
  const [highlightedMarkerId, setHighlightedMarkerId] = useState<string | null>(null);

  const resetRequestForm = () => {
    setRequestStep(1);
    setFormNeedType(null);
    setFormBarangay('');
    setFormLandmark('');
    setFormFullName('');
    setFormContact('');
    setSubmitError(null);
    setSubmitSuccess(false);
  };

  const submitBangonRequest = async () => {
    const fullName = cleanText(formFullName, 80);
    const landmark = cleanText(formLandmark, 120);
    const phone = normalizePhonePH(formContact);
    if (!formNeedType) { setSubmitError('Please pick a need type.'); return; }
    if (!formBarangay) { setSubmitError('Please select your barangay.'); return; }
    if (!fullName || !hasLetter(fullName)) { setSubmitError('Please enter your full name.'); return; }
    if (!phone) { setSubmitError('Please enter a valid PH mobile number (e.g. 09171234567).'); return; }
    const throttle = tryConsumeSubmit();
    if (!throttle.ok) { setSubmitError(`Slow down — try again in ${throttle.retryAfter}s.`); return; }

    setSubmitting(true);
    setSubmitError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bangon_requests')
      .insert({
        need_type: formNeedType,
        barangay: formBarangay,
        landmark: landmark || null,
        full_name: fullName,
        contact_number: phone,
      });
    setSubmitting(false);
    if (error) {
      setSubmitError(error.message || 'Could not submit request. Please try again.');
      return;
    }
    setSubmitSuccess(true);
    void loadBangonRequests();
  };

  // Public surfaces (right-panel Requests / Reports tabs, map markers) only
  // see admin-verified rows. Unverified submissions stay invisible until an
  // admin flips the `verified` flag in the BangonGensan admin panel.
  //
  // All three loaders are wrapped in try/catch so a fetch failure (e.g. the
  // bangon_* tables haven't been pushed to prod yet, or the network is
  // flaky) surfaces as a controlled error instead of a thrown
  // `TypeError: Failed to fetch` propagating up the React tree.
  const loadBangonRequests = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bangon_requests')
        .select('id, need_type, barangay, landmark, full_name, contact_number, status, verified, created_at, updated_at')
        .eq('verified', true)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) {
        setTriageError(error.message);
        return;
      }
      setTriageError(null);
      setBangonRequests((data as BangonRequest[]) ?? []);
    } catch (e) {
      setTriageError(e instanceof Error ? e.message : 'Could not load requests.');
    }
  };

  const loadBangonIncidents = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bangon_incidents')
        .select('id, incident_type, barangay, landmark, description, photo_url, contact_number, status, verified, created_at, updated_at')
        .eq('verified', true)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) return;
      setBangonIncidentRows((data as BangonIncidentRow[]) ?? []);
    } catch { /* swallow — error surfaces on next successful poll */ }
  };

  // Social-media disaster reports — 5-day rolling window.
  // Rows older than 5 days are excluded from the feed/markers; the edge
  // function also drops them at fetch time so they never reach the table.
  const loadBangonSocialReports = async () => {
    try {
      const cutoff = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bangon_social_reports')
        .select('id, external_id, source, source_page_name, source_query, category, severity, headline, summary, message, message_url, barangay, latitude, longitude, landmark, posted_at, verified')
        .gte('posted_at', cutoff)
        .not('latitude', 'is', null)
        .order('posted_at', { ascending: false })
        .limit(300);
      if (error) return;
      setBangonSocialReports((data as BangonSocialRow[]) ?? []);
    } catch { /* swallow */ }
  };

  // Click a Reports or Requests row → fly the map to the marker's location
  // and ring-highlight it. Zoom 13 is wide enough to see the surrounding
  // barangays for context (not pinned right on the dot).
  const flyToMarker = (markerId: string) => {
    const feature = bangonMarkersGeoJSON.features.find(f => (f.properties as { id?: string } | null)?.id === markerId);
    if (!feature) return;
    const coords = (feature.geometry as GeoJSON.Point).coordinates as [number, number];
    const map = mapRef.current;
    if (map) {
      map.flyTo({ center: coords, zoom: 13, speed: 1.2, curve: 1.4 });
    }
    setHighlightedMarkerId(markerId);
    // On mobile, switch to the map view so the user can actually see the marker.
    if (typeof window !== 'undefined' && window.innerWidth < 1024) {
      setMobileView('map');
    }
  };

  // Auto-clear the highlight after a moment so the ring doesn't linger forever.
  useEffect(() => {
    if (!highlightedMarkerId) return;
    const t = setTimeout(() => setHighlightedMarkerId(null), 4000);
    return () => clearTimeout(t);
  }, [highlightedMarkerId]);

  const advanceStatus = async (req: BangonRequest) => {
    const idx = STATUS_ORDER.indexOf(req.status);
    const next = STATUS_ORDER[(idx + 1) % STATUS_ORDER.length];
    // Optimistic update
    setBangonRequests(prev => prev.map(r => (r.id === req.id ? { ...r, status: next } : r)));
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bangon_requests')
      .update({ status: next })
      .eq('id', req.id);
    if (error) {
      // Roll back on failure
      setBangonRequests(prev => prev.map(r => (r.id === req.id ? { ...r, status: req.status } : r)));
      setTriageError(error.message);
    }
  };

  // Requests + incident reports + social-media disaster posts all power the
  // always-visible Live Feed and the map markers, so poll them unconditionally
  // — not just when a specific tab is open. Social reports poll at a slower
  // cadence because the edge function only refreshes every 30 minutes.
  useEffect(() => {
    void loadBangonRequests();
    void loadBangonIncidents();
    void loadBangonSocialReports();
    const fastInterval = setInterval(() => {
      void loadBangonRequests();
      void loadBangonIncidents();
    }, 20000);
    const slowInterval = setInterval(() => {
      void loadBangonSocialReports();
    }, 60000);
    return () => {
      clearInterval(fastInterval);
      clearInterval(slowInterval);
    };
  }, []);

  const sortedTriage = useMemo(() => {
    const arr = [...bangonRequests];
    if (triageSort === 'time') {
      arr.sort((a, b) => b.created_at.localeCompare(a.created_at));
    } else if (triageSort === 'need') {
      arr.sort((a, b) => a.need_type.localeCompare(b.need_type) || b.created_at.localeCompare(a.created_at));
    } else if (triageSort === 'barangay') {
      arr.sort((a, b) => a.barangay.localeCompare(b.barangay) || b.created_at.localeCompare(a.created_at));
    }
    return arr;
  }, [bangonRequests, triageSort]);

  // ── Controls flow: Step 0 picker → chosen concern → its own multistep ──
  type ControlsConcern = 'help' | 'incident' | 'fundraiser' | 'offer';
  const [controlsTab, setControlsTab] = useState<ControlsConcern | null>(null);
  const backToConcerns = () => {
    // Reset any in-flight form state on exit so the picker is fresh.
    resetRequestForm();
    resetIncidentForm();
    resetFundForm();
    resetOfferForm();
    setControlsTab(null);
  };

  // ── Report Incident form ───────────────────────────────────────────
  const [incidentStep, setIncidentStep] = useState<1 | 2 | 3>(1);
  const [incidentType, setIncidentType] = useState<IncidentType | null>(null);
  const [incidentBarangay, setIncidentBarangay] = useState('');
  const [incidentLandmark, setIncidentLandmark] = useState('');
  const [incidentDescription, setIncidentDescription] = useState('');
  const [incidentPhoto, setIncidentPhoto] = useState<File | null>(null);
  const [incidentContact, setIncidentContact] = useState('');
  const [incidentSubmitting, setIncidentSubmitting] = useState(false);
  const [incidentError, setIncidentError] = useState<string | null>(null);
  const [incidentSuccess, setIncidentSuccess] = useState(false);

  const resetIncidentForm = () => {
    setIncidentStep(1);
    setIncidentType(null);
    setIncidentBarangay('');
    setIncidentLandmark('');
    setIncidentDescription('');
    setIncidentPhoto(null);
    setIncidentContact('');
    setIncidentError(null);
    setIncidentSuccess(false);
  };

  const submitIncident = async () => {
    const description = cleanText(incidentDescription, 1000);
    const landmark = cleanText(incidentLandmark, 120);
    const phone = normalizePhonePH(incidentContact);
    if (!incidentType) { setIncidentError('Please pick an incident type.'); return; }
    if (!incidentBarangay) { setIncidentError('Please select the barangay.'); return; }
    if (description.length < 10) { setIncidentError('Please describe what happened (at least 10 characters).'); return; }
    if (!phone) { setIncidentError('Please enter a valid PH mobile number (e.g. 09171234567).'); return; }
    if (incidentPhoto) {
      const check = validatePhoto(incidentPhoto);
      if (!check.ok) { setIncidentError(check.reason); return; }
    }
    const throttle = tryConsumeSubmit();
    if (!throttle.ok) { setIncidentError(`Slow down — try again in ${throttle.retryAfter}s.`); return; }

    setIncidentSubmitting(true);
    setIncidentError(null);

    let photoUrl: string | null = null;
    if (incidentPhoto) {
      try {
        const mime = incidentPhoto.type;
        const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
        const rand = window.crypto?.randomUUID?.() ?? Math.random().toString(36).slice(2);
        const path = `${Date.now()}-${rand}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from('bangon-incidents')
          .upload(path, incidentPhoto, { contentType: mime });
        if (upErr) throw upErr;
        const { data } = supabase.storage.from('bangon-incidents').getPublicUrl(path);
        photoUrl = data.publicUrl;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'photo upload failed';
        setIncidentSubmitting(false);
        setIncidentError(`Could not upload photo (${msg}). Try submitting without it.`);
        return;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bangon_incidents')
      .insert({
        incident_type: incidentType,
        barangay: incidentBarangay,
        landmark: landmark || null,
        description,
        photo_url: photoUrl,
        contact_number: phone,
      });
    setIncidentSubmitting(false);
    if (error) {
      setIncidentError(error.message || 'Could not submit incident report.');
      return;
    }
    setIncidentSuccess(true);
  };

  // ── Add Fundraiser form (multistep) ───────────────────────────────
  const [fundStep, setFundStep] = useState<1 | 2 | 3>(1);
  const [fundTitle, setFundTitle] = useState('');
  const [fundDescription, setFundDescription] = useState('');
  const [fundGoal, setFundGoal] = useState('');
  const [fundPayment, setFundPayment] = useState('');
  const [fundContactName, setFundContactName] = useState('');
  const [fundContact, setFundContact] = useState('');
  const [fundFacebook, setFundFacebook] = useState('');
  const [fundSubmitting, setFundSubmitting] = useState(false);
  const [fundError, setFundError] = useState<string | null>(null);
  const [fundSuccess, setFundSuccess] = useState(false);

  const resetFundForm = () => {
    setFundStep(1);
    setFundTitle(''); setFundDescription(''); setFundGoal('');
    setFundPayment(''); setFundContactName(''); setFundContact('');
    setFundFacebook('');
    setFundError(null); setFundSuccess(false);
  };

  const submitFundraiser = async () => {
    const title = cleanText(fundTitle, 120);
    const description = cleanText(fundDescription, 2000);
    const payment = cleanText(fundPayment, 200);
    const contactName = cleanText(fundContactName, 80);
    const facebook = cleanText(fundFacebook, 300);
    const phone = normalizePhonePH(fundContact);
    const goalNum = parseFloat(fundGoal);

    if (title.length < 8) { setFundError('Title must be at least 8 characters.'); return; }
    if (description.length < 30) { setFundError('Description must be at least 30 characters.'); return; }
    if (!Number.isFinite(goalNum) || goalNum <= 0 || goalNum >= 50_000_000) {
      setFundError('Goal must be between ₱1 and ₱49,999,999.');
      return;
    }
    if (!payment) { setFundError('Please add payment details (GCash / bank).'); return; }
    if (!contactName || !hasLetter(contactName)) { setFundError('Please enter the full name on the GCash / bank account.'); return; }
    if (!phone) { setFundError('Please enter a valid PH mobile number.'); return; }
    if (!isValidFacebookUrl(facebook)) {
      setFundError('Facebook link must be an https:// URL on facebook.com.');
      return;
    }
    const throttle = tryConsumeSubmit();
    if (!throttle.ok) { setFundError(`Slow down — try again in ${throttle.retryAfter}s.`); return; }

    setFundSubmitting(true);
    setFundError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bangon_fundraisers')
      .insert({
        title,
        description,
        goal_amount: goalNum,
        payment_details: payment,
        contact_name: contactName,
        contact_number: phone,
        facebook_url: facebook,
      });
    setFundSubmitting(false);
    if (error) {
      setFundError(error.message || 'Could not submit fundraiser.');
      return;
    }
    setFundSuccess(true);
  };

  // ── Offer Help form (multistep) ──────────────────────────────────
  const [offerStep, setOfferStep] = useState<1 | 2 | 3>(1);
  const [offerTags, setOfferTags] = useState<OfferTag[]>([]);
  const [offerDescription, setOfferDescription] = useState('');
  const [offerBarangay, setOfferBarangay] = useState('');
  const [offerContactName, setOfferContactName] = useState('');
  const [offerContact, setOfferContact] = useState('');
  const [offerSubmitting, setOfferSubmitting] = useState(false);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [offerSuccess, setOfferSuccess] = useState(false);

  const toggleOfferTag = (tag: OfferTag) =>
    setOfferTags(prev => (prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]));

  const resetOfferForm = () => {
    setOfferStep(1);
    setOfferTags([]); setOfferDescription(''); setOfferBarangay('');
    setOfferContactName(''); setOfferContact('');
    setOfferError(null); setOfferSuccess(false);
  };

  const submitOffer = async () => {
    const description = cleanText(offerDescription, 500);
    const contactName = cleanText(offerContactName, 80);
    const phone = normalizePhonePH(offerContact);
    if (offerTags.length === 0 && !description) {
      setOfferError('Pick at least one tag or describe your offer.');
      return;
    }
    if (!offerBarangay) { setOfferError('Please select a barangay.'); return; }
    if (!contactName || !hasLetter(contactName)) { setOfferError('Please enter your name.'); return; }
    if (!phone) { setOfferError('Please enter a valid PH mobile number.'); return; }
    const throttle = tryConsumeSubmit();
    if (!throttle.ok) { setOfferError(`Slow down — try again in ${throttle.retryAfter}s.`); return; }

    setOfferSubmitting(true);
    setOfferError(null);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('bangon_offers')
      .insert({
        offer_description: description || offerTags.join(', '),
        offer_tags: offerTags,
        barangay: offerBarangay,
        contact_name: contactName,
        contact_number: phone,
      });
    setOfferSubmitting(false);
    if (error) {
      setOfferError(error.message || 'Could not submit offer.');
      return;
    }
    setOfferSuccess(true);
  };

  // ── Left-sidebar: chat-only on /bangon-gensan ──────────────────────
  // `leftMode` is retained as a const to avoid ripping out the surrounding
  // conditional, but the Layers branch is no longer rendered (per user spec).
  const leftMode = 'chat' as const;

  // Anonymous community chat — handle resolved async (IP lookup + cookie).
  // chatHandle is null while resolving on first mount; the send button stays
  // disabled in that window.
  const [chatHandle, setChatHandle] = useState<{ sessionId: string; displayName: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatDraft, setChatDraft] = useState('');
  const [chatSending, setChatSending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    void resolveChatHandle().then(h => {
      if (!cancelled) setChatHandle(h);
    });
    return () => { cancelled = true; };
  }, []);

  // Both load and send wrap network calls in try/catch so the chat surface
  // shows a clean error message instead of throwing "TypeError: Failed to
  // fetch" up the stack when Supabase is unreachable or the table is missing.
  const loadChatMessages = async () => {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('bangon_chat_messages')
        .select('id, session_id, display_name, content, created_at')
        .order('created_at', { ascending: true })
        .limit(200);
      if (error) { setChatError(error.message); return; }
      setChatError(null);
      setChatMessages((data as ChatMessage[]) ?? []);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not reach chat.';
      setChatError(msg.includes('fetch') ? 'Chat is unreachable. Check your connection.' : msg);
    }
  };

  const sendChatMessage = async () => {
    if (!chatHandle) return; // identity not resolved yet
    const content = stripAngle(cleanText(chatDraft, 500));
    if (!content) return;
    const throttle = tryConsumeChat();
    if (!throttle.ok) {
      setChatError(`Slow down — too many messages. Try again in ${throttle.retryAfter}s.`);
      return;
    }
    setChatSending(true);
    setChatError(null);
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('bangon_chat_messages')
        .insert({
          session_id: chatHandle.sessionId,
          display_name: chatHandle.displayName,
          content,
        });
      if (error) {
        setChatError(error.message || 'Could not send message.');
        return;
      }
      setChatDraft('');
      void loadChatMessages();
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Could not send message.';
      setChatError(msg.includes('fetch') ? 'Chat is unreachable. Check your connection.' : msg);
    } finally {
      setChatSending(false);
    }
  };

  useEffect(() => {
    if (leftMode !== 'chat') return;
    void loadChatMessages();
    const interval = setInterval(() => void loadChatMessages(), 4000);
    return () => clearInterval(interval);
  }, [leftMode]);

  useEffect(() => {
    // Autoscroll on new message
    const el = chatScrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [chatMessages]);

  const [hazardLayers, setHazardLayers] = useState<Record<HazardLayerKey, boolean>>(
    () => Object.fromEntries(HAZARD_LAYERS.map(l => [l.key, false])) as Record<HazardLayerKey, boolean>,
  );
  const [phivolcsLayers, setPhivolcsLayers] = useState<Record<PhivolcsLayerKey, boolean>>(
    () => Object.fromEntries(PHIVOLCS_LAYERS.map(l => [l.key, false])) as Record<PhivolcsLayerKey, boolean>,
  );
  const [phivolcsOpacity] = useState<Record<PhivolcsLayerKey, number>>(
    () => Object.fromEntries(PHIVOLCS_LAYERS.map(l => [l.key, l.defaultOpacity])) as Record<PhivolcsLayerKey, number>,
  );
  const [popMode, setPopMode] = useState<'off' | 'visual' | 'analyst'>('off');
  const [showBarangays, setShowBarangays] = useState(true);
  const [oceanLayers, setOceanLayers] = useState<Record<OceanLayerKey, boolean>>(
    () => Object.fromEntries(OCEAN_LAYERS.map(l => [l.key, false])) as Record<OceanLayerKey, boolean>,
  );
  const [oceanOpacity] = useState<Record<OceanLayerKey, number>>(
    () => Object.fromEntries(OCEAN_LAYERS.map(l => [l.key, l.defaultOpacity])) as Record<OceanLayerKey, number>,
  );

  // Live tracking
  const [showFlights, setShowFlights] = useState(false);
  const [showShips, setShowShips] = useState(false);
  const [aircraft, setAircraft] = useState<AircraftPosition[]>([]);
  const [nauticalFeatures, setNauticalFeatures] = useState<NauticalFeature[]>([]);
  const [vessels, setVessels] = useState<VesselPosition[]>([]);
  const vesselMapRef = useRef<Map<number, VesselPosition>>(new Map());
  // Critical infrastructure
  const [infraPOI, setInfraPOI] = useState<Record<string, boolean>>(
    () => Object.fromEntries(INFRA_POI_CATEGORIES.map(c => [c.key, false])) as Record<string, boolean>,
  );
  const [infraPOIData, setInfraPOIData] = useState<InfraPOI[]>([]);
  const [infraPOILoaded, setInfraPOILoaded] = useState(false);

  // Keep dataRef in sync for closure-safe barangay popup
  useEffect(() => {
    dataRef.current = { filteredIncidents, filteredInfraProjects, filteredInfraPOIData, infraPOIData, aircraft, vessels };
  });

  // Simulated live clock
  const [clock, setClock] = useState(new Date());
  useEffect(() => {
    const iv = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(iv);
  }, []);

  // Compute actual date range from timeline slider
  const timelineDates = useMemo(() => {
    const windowMs = { '24h': 86400000, '7d': 604800000, '30d': 2592000000, '90d': 7776000000 }[timelineWindow];
    const now = Date.now();
    const windowStart = now - windowMs;
    const from = new Date(windowStart + timelineRange[0] * windowMs);
    const to = new Date(windowStart + timelineRange[1] * windowMs);
    return { from, to, fromIso: from.toISOString(), toIso: to.toISOString() };
  }, [timelineWindow, timelineRange]);

  // Map real safety reports into the incident shape used by the map/feed
  const mappedIncidents = useMemo(() => {
    return safetyReports.map((r): Incident => ({
      id: r.id as unknown as number,
      category: (r.category as IncidentCategory) ?? 'Other' as IncidentCategory,
      barangay: r.barangay ?? 'Unknown',
      summary: r.summary ?? r.message ?? '',
      source: r.verified ? 'Police Reports' : 'Community Reports',
      timestamp: r.posted_at
        ? new Date(r.posted_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })
        : '',
      postedAt: r.posted_at ?? '',
      lat: r.latitude ?? 0,
      lng: r.longitude ?? 0,
      severity: (r.severity as 'low' | 'medium' | 'high') ?? 'low',
      url: r.message_url ?? undefined,
      imageUrl: r.image_url ?? undefined,
    }));
  }, [safetyReports]);

  // All filtered incidents (for feed, analysis, intelligence)
  const filteredIncidents = useMemo(
    () => mappedIncidents.filter(i => {
      if (!(layers[i.category as IncidentCategory] ?? true)) return false;
      // Timeline filter
      if (i.postedAt) {
        if (i.postedAt < timelineDates.fromIso) return false;
        if (i.postedAt > timelineDates.toIso) return false;
      }
      return true;
    }),
    [mappedIncidents, layers, timelineDates],
  );

  // Only incidents with coordinates (for map markers)
  const mappableIncidents = useMemo(
    () => filteredIncidents.filter(i => i.lat !== 0 && i.lng !== 0),
    [filteredIncidents],
  );

  const geojsonData = useMemo(() => incidentsToGeoJSON(mappableIncidents), [mappableIncidents]);

  // Load data from Supabase
  useEffect(() => {
    const ac = new AbortController();
    readInfrastructureProjects(ac.signal).then(setInfraProjects);
    readSafetyReports(ac.signal).then(setSafetyReports);
    return () => ac.abort();
  }, []);

  // ── Live flight tracking (ADSB.fi via Vite proxy) ──────────────────
  useEffect(() => {
    if (!showFlights) { setAircraft([]); return; }
    let cancelled = false;
    const fetchAircraft = async () => {
      try {
        const res = await fetch(
          `/api/adsb/lat/${GENSAN_CENTER[1]}/lon/${GENSAN_CENTER[0]}/dist/${ADSB_RADIUS_NM}`,
        );
        if (!res.ok || cancelled) return;
        const data = await res.json();
        const ac = (data.aircraft ?? []).map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (a: any) => parseAircraftData(a),
        );
        if (!cancelled) setAircraft(ac);
      } catch {
        // network error — keep last known positions
      }
    };
    fetchAircraft();
    const iv = setInterval(fetchAircraft, ADSB_POLL_MS);
    return () => { cancelled = true; clearInterval(iv); };
  }, [showFlights]);

  const aircraftGeoJSON = useMemo(() => aircraftToGeoJSON(aircraft), [aircraft]);

  // ── AIS ship tracking (AISStream.io WebSocket) ─────────────────────
  useEffect(() => {
    if (!showShips || !AISSTREAM_KEY) return;
    const ws = new WebSocket('wss://stream.aisstream.io/v0/stream');
    let flushInterval: ReturnType<typeof setInterval>;

    ws.onopen = () => {
      ws.send(JSON.stringify({
        APIKey: AISSTREAM_KEY,
        BoundingBoxes: [AIS_BBOX],
        FilterMessageTypes: ['PositionReport', 'ShipStaticData'],
      }));
      // Flush vessel map to state every 5s (avoids re-render per message)
      flushInterval = setInterval(() => {
        // Prune stale vessels (>5 min without update)
        const now = Date.now();
        for (const [mmsi, v] of vesselMapRef.current) {
          if (now - v.lastUpdate > 300_000) vesselMapRef.current.delete(mmsi);
        }
        setVessels(Array.from(vesselMapRef.current.values()));
      }, 5000);
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        const meta = msg.MetaData;
        if (!meta?.latitude || !meta?.longitude) return;
        const mmsi = Number(meta.MMSI);
        const existing = vesselMapRef.current.get(mmsi);
        const posReport = msg.Message?.PositionReport;
        const staticData = msg.Message?.ShipStaticData;

        const vessel: VesselPosition = {
          mmsi,
          name: meta.ShipName?.trim() || existing?.name || '',
          shipType: staticData?.Type ?? existing?.shipType ?? 0,
          lat: meta.latitude,
          lon: meta.longitude,
          cog: posReport?.Cog ?? existing?.cog ?? 0,
          sog: posReport?.Sog ?? existing?.sog ?? 0,
          heading: posReport?.TrueHeading ?? existing?.heading ?? 0,
          destination: staticData?.Destination?.trim() || existing?.destination || '',
          eta: staticData?.Eta ? `${staticData.Eta.Month}/${staticData.Eta.Day} ${staticData.Eta.Hour}:${String(staticData.Eta.Minute).padStart(2, '0')}` : existing?.eta || '',
          lastUpdate: Date.now(),
        };
        vesselMapRef.current.set(mmsi, vessel);
      } catch {
        // malformed message
      }
    };

    ws.onerror = () => { /* reconnect handled by cleanup + re-mount */ };

    return () => {
      clearInterval(flushInterval);
      ws.close();
    };
  }, [showShips]);

  const vesselGeoJSON = useMemo(() => vesselsToGeoJSON(vessels), [vessels]);

  // ── Nautical features (OSM Overpass — fetched once) ────────────────
  useEffect(() => {
    if (!showShips) return;
    if (nauticalFeatures.length > 0) return; // already fetched
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(OVERPASS_NAUTICAL_QUERY)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        if (!res.ok || cancelled) return;
        const data = await res.json();
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const features = (data.elements ?? []).map((e: any) => {
          const tags = e.tags ?? {};
          const stype = tags['seamark:type'] || tags.man_made || tags.amenity || tags.leisure || (tags.harbour ? 'harbour' : 'unknown');
          return {
            id: e.id,
            name: tags.name || tags['seamark:name'] || '',
            type: stype,
            lat: e.lat,
            lon: e.lon,
            tags,
          } as NauticalFeature;
        });
        if (!cancelled) setNauticalFeatures(features);
      } catch {
        // silently fail — nautical data is supplementary
      }
    })();
    return () => { cancelled = true; };
  }, [showShips, nauticalFeatures.length]);

  const nauticalGeoJSON = useMemo(() => nauticalToGeoJSON(nauticalFeatures), [nauticalFeatures]);

  // ── Critical infrastructure POI: local data instant, OSM in background
  const anyInfraPOIOn = Object.values(infraPOI).some(Boolean);
  // Phase 1: local data (police + hospitals) renders immediately on first toggle
  useEffect(() => {
    if (!anyInfraPOIOn || infraPOILoaded) return;
    const local = getLocalInfraPOIs();
    setInfraPOIData(local);
    setInfraPOILoaded(true);
  }, [anyInfraPOIOn, infraPOILoaded]);

  // Phase 2: OSM Overpass fetches in the background, merges when ready
  const [osmLoaded, setOsmLoaded] = useState(false);
  useEffect(() => {
    if (!infraPOILoaded || osmLoaded) return;
    let cancelled = false;
    (async () => {
      const query = buildInfraOverpassQuery();
      if (!query) { setOsmLoaded(true); return; }
      try {
        const res = await fetch('https://overpass-api.de/api/interpreter', {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        });
        if (res.ok && !cancelled) {
          const data = await res.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const osmPois: InfraPOI[] = (data.elements ?? []).map((e: any) => ({
            id: e.id,
            name: e.tags?.name || '',
            category: classifyInfraPOI(e.tags ?? {}),
            lat: e.lat,
            lon: e.lon,
            tags: e.tags ?? {},
          }));
          if (!cancelled) {
            setInfraPOIData(prev => [...prev, ...osmPois]);
            setOsmLoaded(true);
          }
        }
      } catch {
        // OSM failed — local data still showing
        if (!cancelled) setOsmLoaded(true);
      }
    })();
    return () => { cancelled = true; };
  }, [anyInfraPOIOn, infraPOILoaded]);

  const filteredInfraPOIData = useMemo(
    () => infraPOIData.filter(p => infraPOI[p.category]),
    [infraPOIData, infraPOI],
  );
  const infraPOIGeoJSON = useMemo(() => infraPOIToGeoJSON(filteredInfraPOIData), [filteredInfraPOIData]);

  const filteredInfraProjects = useMemo(
    () => infraProjects.filter(p => infraStatuses[normalizeInfraStatus(p.status)]),
    [infraProjects, infraStatuses],
  );

  const infraGeoJSON = useMemo(() => infraProjectsToGeoJSON(filteredInfraProjects), [filteredInfraProjects]);

  const activeLayerCount = Object.values(layers).filter(Boolean).length + Object.values(hazardLayers).filter(Boolean).length + Object.values(phivolcsLayers).filter(Boolean).length + (popMode !== 'off' ? 1 : 0) + PHASE1_OCEAN.filter(l => oceanLayers[l.key]).length + (showFlights ? 1 : 0) + (showShips ? 1 : 0) + Object.values(infraPOI).filter(Boolean).length;

  const anyIncidentsOn = Object.values(layers).some(Boolean);
  const anyInfraOn = showInfra && Object.values(infraStatuses).some(Boolean);

  // BangonGensan map markers — one always-on layer per kind. Coordinates are
  // approximated from the barangay polygon centroid (rows only carry a
  // barangay name + landmark). A tiny deterministic jitter prevents perfect
  // overlap when multiple submissions share a barangay.
  const bangonMarkersGeoJSON = useMemo<GeoJSON.FeatureCollection>(() => {
    const features: GeoJSON.Feature[] = [];
    const seen = new Map<string, number>();
    const place = (key: string, baseLng: number, baseLat: number): [number, number] => {
      const i = seen.get(key) ?? 0;
      seen.set(key, i + 1);
      if (i === 0) return [baseLng, baseLat];
      // Spiral jitter ~30–80 m per step.
      const angle = i * 2.39996;
      const radius = 0.0004 + i * 0.00025;
      return [baseLng + Math.cos(angle) * radius, baseLat + Math.sin(angle) * radius];
    };
    bangonRequests.forEach(r => {
      const c = BARANGAY_CENTROIDS[(r.barangay || '').toLowerCase()];
      if (!c) return;
      const [lng, lat] = place(`req-${r.barangay}`, c[0], c[1]);
      features.push({
        type: 'Feature',
        properties: {
          id: r.id,
          kind: 'request',
          color: NEED_COLOR[r.need_type],
          label: NEED_SHORT[r.need_type],
          barangay: r.barangay,
          landmark: r.landmark ?? '',
          name: r.full_name,
          status: r.status,
          createdAt: r.created_at,
        },
        geometry: { type: 'Point', coordinates: [lng, lat] },
      });
    });
    bangonIncidentRows.forEach(i => {
      const c = BARANGAY_CENTROIDS[(i.barangay || '').toLowerCase()];
      if (!c) return;
      const [lng, lat] = place(`rpt-${i.barangay}`, c[0], c[1]);
      features.push({
        type: 'Feature',
        properties: {
          id: i.id,
          kind: 'report',
          color: INCIDENT_COLOR[i.incident_type],
          label: INCIDENT_SHORT[i.incident_type],
          barangay: i.barangay,
          landmark: i.landmark ?? '',
          description: i.description,
          status: i.status,
          createdAt: i.created_at,
        },
        geometry: { type: 'Point', coordinates: [lng, lat] },
      });
    });
    // Social-media disaster reports — use the geocoded lat/lng directly
    // (from Nominatim / landmark / barangay centroid in the edge function).
    bangonSocialReports.forEach(s => {
      const color = SOCIAL_COLOR[s.category ?? ''] ?? SOCIAL_COLOR_DEFAULT;
      features.push({
        type: 'Feature',
        properties: {
          id: s.id,
          kind: 'social',
          color,
          label: s.category ?? 'Disaster',
          barangay: s.barangay ?? '',
          landmark: s.landmark ?? '',
          headline: s.headline ?? '',
          summary: s.summary ?? '',
          source_page_name: s.source_page_name ?? '',
          source_query: s.source_query ?? '',
          severity: s.severity ?? '',
          message_url: s.message_url ?? '',
          posted_at: s.posted_at,
          createdAt: s.posted_at,
        },
        geometry: { type: 'Point', coordinates: [s.longitude, s.latitude] },
      });
    });
    return { type: 'FeatureCollection', features };
  }, [bangonRequests, bangonIncidentRows, bangonSocialReports]);

  // Live Feed items — SCRAPED RESULTS ONLY (bangon_social_reports). The
  // user-submitted Requests + Reports surface in the right sidebar panel,
  // not here. This panel is a passive intelligence stream from the
  // bangon-social-sync edge function (Facebook → OpenAI → geocode pipeline).
  interface FeedItem {
    id: string;
    kind: 'social';
    title: string;
    subtitle: string;
    location: string;
    meta: string;
    dotColor: string;
    status: string;
    createdAt: string;
    url?: string;
  }

  const unifiedFeed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    bangonSocialReports.forEach(s => {
      const cat = s.category ?? 'Disaster';
      const loc = s.barangay
        ? (s.landmark ? `${s.barangay} · ${s.landmark}` : s.barangay)
        : (s.landmark ?? 'GenSan');
      items.push({
        id: `soc-${s.id}`,
        kind: 'social',
        title: cat,
        subtitle: s.headline ?? s.summary ?? (s.message ?? '').slice(0, 140),
        location: loc,
        meta: relativeTime(s.posted_at),
        dotColor: SOCIAL_COLOR[cat] ?? SOCIAL_COLOR_DEFAULT,
        status: s.verified ? 'verified' : (s.severity ?? 'unverified'),
        createdAt: s.posted_at,
        url: s.message_url ?? undefined,
      });
    });
    items.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    return items;
  }, [bangonSocialReports]);

  // ── Initialize MapLibre GL ─────────────────────────────────────────
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Register PMTiles protocol for NOAH hazard map streaming
    const protocol = new Protocol();
    maplibregl.addProtocol('pmtiles', protocol.tile);

    const map = new maplibregl.Map({
      container: mapContainerRef.current,
      style: MAP_STYLE_LIGHT,
      center: GENSAN_CENTER,
      zoom: DEFAULT_ZOOM,
      pitch: DEFAULT_PITCH,
      bearing: DEFAULT_BEARING,
      attributionControl: false,
    });

    map.addControl(new maplibregl.NavigationControl({ showCompass: true, showZoom: true, visualizePitch: true }), 'bottom-right');

    map.on('load', () => {
      // City boundary
      map.addSource('gensan-boundary', {
        type: 'geojson',
        data: GENSAN_BOUNDARY,
      });
      map.addLayer({
        id: 'boundary-fill',
        type: 'fill',
        source: 'gensan-boundary',
        paint: {
          'fill-color': '#0066eb',
          'fill-opacity': 0.03,
        },
      });
      map.addLayer({
        id: 'boundary-line',
        type: 'line',
        source: 'gensan-boundary',
        paint: {
          'line-color': '#0066eb',
          'line-width': 2,
          'line-dasharray': [3, 2],
          'line-opacity': 0.6,
        },
      });

      // Barangay boundaries layer
      map.addSource('barangays', {
        type: 'geojson',
        data: GENSAN_BARANGAYS as GeoJSON.FeatureCollection,
      });
      map.addLayer({
        id: 'barangay-fills',
        type: 'fill',
        source: 'barangays',
        paint: {
          'fill-color': '#0066eb',
          'fill-opacity': 0,
        },
      });
      map.addLayer({
        id: 'barangay-borders',
        type: 'line',
        source: 'barangays',
        paint: {
          'line-color': '#0066eb',
          'line-width': 1,
          'line-opacity': 0.4,
          'line-dasharray': [2, 1],
        },
      });
      map.addLayer({
        id: 'barangay-labels',
        type: 'symbol',
        source: 'barangays',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-font': ['Open Sans Semibold'],
          'text-anchor': 'center',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#0066eb',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
          'text-opacity': 0.7,
        },
        minzoom: 12,
      });

      // Barangay hover interaction
      let hoveredBarangay: string | null = null;
      map.on('mousemove', 'barangay-fills', (e) => {
        if (!e.features?.[0]) return;
        const name = e.features[0].properties?.name;
        if (name !== hoveredBarangay) {
          hoveredBarangay = name;
          map.getCanvas().style.cursor = 'pointer';
          // Highlight hovered barangay
          map.setPaintProperty('barangay-fills', 'fill-opacity', [
            'case', ['==', ['get', 'name'], name], 0.12, 0,
          ]);
        }
      });
      map.on('mouseleave', 'barangay-fills', () => {
        hoveredBarangay = null;
        map.getCanvas().style.cursor = '';
        map.setPaintProperty('barangay-fills', 'fill-opacity', 0);
      });

      // Click barangay to show rich dynamic popup
      map.on('click', 'barangay-fills', (e) => {
        if (!e.features?.[0]) return;
        const name = e.features[0].properties?.name;
        const center = e.lngLat;
        if (popupRef.current) popupRef.current.remove();

        // Read latest data from ref (closure-safe)
        const d = dataRef.current;
        const nameLower = (name || '').toLowerCase();

        // Population
        const pop = BARANGAY_POP[name] || null;

        // Incidents
        const incidents = d.filteredIncidents.filter(i => (i.barangay || '').toLowerCase() === nameLower);
        const highSev = incidents.filter(i => i.severity === 'high').length;
        const topCats: Record<string, number> = {};
        incidents.forEach(i => { topCats[i.category] = (topCats[i.category] || 0) + 1; });
        const topCat = Object.entries(topCats).sort((a, b) => b[1] - a[1])[0];

        // Infrastructure projects
        const infraProj = d.filteredInfraProjects.filter(p => (p.barangay || '').toLowerCase() === nameLower);
        const onGoing = infraProj.filter(p => normalizeInfraStatus(p.status) === 'On-Going').length;

        // Critical infra POIs
        const pois = d.infraPOIData.filter(p => {
          const addr = (p.tags['addr:street'] || p.tags.name || '').toLowerCase();
          return addr.includes(nameLower);
        });
        const poiPolice = pois.filter(p => p.category === 'police').length;
        const poiHospitals = pois.filter(p => p.category === 'hospitals').length;

        // Police stations from bundled data
        const policeInBrgy = POLICE_STATIONS.filter(s => s.address.toLowerCase().includes(nameLower));

        // Build popup sections
        let html = `<div style="font-size:11px;line-height:1.5;min-width:200px">`;
        html += `<div style="display:flex;align-items:center;gap:6px;margin-bottom:6px"><span style="font-size:14px">📍</span><strong style="font-size:14px">${name}</strong></div>`;

        // Population
        if (pop) {
          const growthPositive = pop.growthPct.startsWith('+');
          html += `<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:2px 8px;margin-bottom:6px;padding:6px;background:#f0f9ff;border-radius:4px;border:1px solid #bae6fd">`;
          html += `<div><span style="color:#6b7280;font-size:9px">2024 est.</span><div style="font-weight:700;font-size:13px;color:#0c4a6e">${pop.pop2024est.toLocaleString()}</div></div>`;
          html += `<div><span style="color:#6b7280;font-size:9px">2020 census</span><div style="font-weight:600;font-size:12px;color:#475569">${pop.pop2020.toLocaleString()}</div></div>`;
          html += `<div><span style="color:#6b7280;font-size:9px">Growth/yr</span><div style="font-weight:700;font-size:12px;color:${growthPositive ? '#059669' : '#dc2626'}">${pop.growthPct}</div></div>`;
          html += `</div>`;
        }

        // Incidents
        if (incidents.length > 0) {
          html += `<div style="margin-bottom:4px;padding:4px 6px;background:#fef2f2;border-radius:4px;border:1px solid #fecaca">`;
          html += `<div style="font-weight:700;color:#991b1b;font-size:10px;margin-bottom:2px">INCIDENTS: ${incidents.length}</div>`;
          if (highSev > 0) html += `<div style="color:#dc2626;font-size:10px">🔴 ${highSev} high severity</div>`;
          if (topCat) html += `<div style="color:#6b7280;font-size:10px">Top: ${topCat[0]} (${topCat[1]})</div>`;
          html += `</div>`;
        }

        // Infrastructure
        if (infraProj.length > 0) {
          html += `<div style="margin-bottom:4px;padding:4px 6px;background:#f0fdf4;border-radius:4px;border:1px solid #bbf7d0">`;
          html += `<div style="font-weight:700;color:#166534;font-size:10px">INFRA PROJECTS: ${infraProj.length}</div>`;
          if (onGoing > 0) html += `<div style="color:#6b7280;font-size:10px">${onGoing} on-going</div>`;
          html += `</div>`;
        }

        // Facilities
        const facilityLines: string[] = [];
        if (policeInBrgy.length > 0) facilityLines.push(`🚓 ${policeInBrgy.length} police station${policeInBrgy.length > 1 ? 's' : ''}`);
        if (poiHospitals > 0) facilityLines.push(`🏥 ${poiHospitals} hospital${poiHospitals > 1 ? 's' : ''}`);
        const poiOther = pois.length - poiPolice - poiHospitals;
        if (poiOther > 0) facilityLines.push(`🏛️ ${poiOther} other facilit${poiOther > 1 ? 'ies' : 'y'}`);

        if (facilityLines.length > 0) {
          html += `<div style="margin-bottom:4px;padding:4px 6px;background:#f5f3ff;border-radius:4px;border:1px solid #ddd6fe">`;
          html += `<div style="font-weight:700;color:#4c1d95;font-size:10px;margin-bottom:2px">FACILITIES</div>`;
          facilityLines.forEach(l => { html += `<div style="color:#6b7280;font-size:10px">${l}</div>`; });
          html += `</div>`;
        }

        // Empty state
        if (!pop && incidents.length === 0 && infraProj.length === 0 && facilityLines.length === 0) {
          html += `<div style="color:#9ca3af;font-size:10px;text-align:center;padding:8px 0">No active layer data for this barangay</div>`;
        }

        html += `<div style="color:#d1d5db;font-size:9px;margin-top:4px">${center.lat.toFixed(4)}°N, ${center.lng.toFixed(4)}°E</div>`;
        html += `</div>`;

        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '280px', className: 'cc-popup' })
          .setLngLat(center)
          .setHTML(html)
          .addTo(map);
      });

      // Heatmap mask: covers everything OUTSIDE GenSan boundary with white
      // so the heatmap only shows within city limits
      const bCoords = (GENSAN_BOUNDARY.geometry as GeoJSON.Polygon).coordinates[0];
      const maskGeoJSON: GeoJSON.Feature = {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'Polygon',
          coordinates: [
            // Outer ring: world bounds
            [[-180, -90], [180, -90], [180, 90], [-180, 90], [-180, -90]],
            // Inner ring (hole): GenSan boundary (reversed winding)
            [...bCoords].reverse(),
          ],
        },
      };
      map.addSource('heatmap-mask', { type: 'geojson', data: maskGeoJSON });
      // Layer added later, after heatmap

      // Incidents source (clustered)
      map.addSource('incidents', {
        type: 'geojson',
        data: geojsonData,
        cluster: true,
        clusterMaxZoom: 15,
        clusterRadius: 40,
      });

      // Combined heatmap source (incidents + infra merged)
      map.addSource('heatmap-data', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      // Heatmap layer
      map.addLayer({
        id: 'incidents-heat',
        type: 'heatmap',
        source: 'heatmap-data',
        paint: {
          'heatmap-weight': ['coalesce', ['get', 'weight'], 0.3],
          'heatmap-intensity': ['interpolate', ['linear'], ['zoom'], 10, 0.5, 15, 1.5],
          'heatmap-color': [
            'interpolate', ['linear'], ['heatmap-density'],
            0, 'rgba(0,102,235,0)',
            0.2, 'rgba(0,102,235,0.15)',
            0.4, 'rgba(0,175,95,0.3)',
            0.6, 'rgba(255,185,0,0.5)',
            0.8, 'rgba(245,137,0,0.7)',
            1, 'rgba(225,46,46,0.8)',
          ],
          'heatmap-radius': ['interpolate', ['linear'], ['zoom'], 10, 20, 15, 30],
          'heatmap-opacity': 0,
        },
      });

      // Heatmap mask — white fill outside GenSan boundary, clips heatmap visually
      map.addLayer({
        id: 'heatmap-mask-fill',
        type: 'fill',
        source: 'heatmap-mask',
        paint: {
          'fill-color': '#f3f4f6', // matches bg-gray-100 page background
          'fill-opacity': 0,       // starts hidden, toggled with heatmap
        },
      });

      // Cluster circles
      map.addLayer({
        id: 'clusters',
        type: 'circle',
        source: 'incidents',
        filter: ['has', 'point_count'],
        paint: {
          'circle-color': [
            'step', ['get', 'point_count'],
            '#0066eb', 3,
            '#f58900', 6,
            '#e12e2e',
          ],
          'circle-radius': ['step', ['get', 'point_count'], 16, 3, 22, 6, 28],
          'circle-opacity': 0.8,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#fff',
        },
      });

      // Cluster count labels
      map.addLayer({
        id: 'cluster-count',
        type: 'symbol',
        source: 'incidents',
        filter: ['has', 'point_count'],
        layout: {
          'text-field': '{point_count_abbreviated}',
          'text-size': 11,
          'text-font': ['Open Sans Semibold'],
        },
        paint: {
          'text-color': '#ffffff',
        },
      });

      // Individual markers
      map.addLayer({
        id: 'incident-points',
        type: 'circle',
        source: 'incidents',
        filter: ['!', ['has', 'point_count']],
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['get', 'radius'],
          'circle-opacity': 0.7,
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
        },
      });

      // Hover highlight
      map.on('mouseenter', 'incident-points', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'incident-points', () => {
        map.getCanvas().style.cursor = '';
      });

      // Click popup
      map.on('click', 'incident-points', (e) => {
        if (!e.features?.[0]) return;
        const f = e.features[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const p = f.properties;

        if (popupRef.current) popupRef.current.remove();

        const sevClass = p.severity === 'high' ? 'cc-sev-high' : p.severity === 'medium' ? 'cc-sev-med' : 'cc-sev-low';

        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '220px', className: 'cc-popup' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-size:12px;line-height:1.4">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0"></span>
                <strong>${p.category}</strong>
                <span class="${sevClass}" style="margin-left:auto;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:600">${(p.severity as string).toUpperCase()}</span>
              </div>
              <div style="color:#6b7280;margin-bottom:4px">${p.summary}</div>
              ${p.imageUrl ? `<img src="${p.imageUrl}" style="width:100%;border-radius:4px;margin-bottom:4px;max-height:120px;object-fit:cover" onerror="this.style.display='none'" />` : ''}
              <div style="color:#9ca3af;font-size:10px">${p.barangay} · ${p.timestamp}</div>
              ${p.url ? `<a href="${p.url}" target="_blank" rel="noopener" style="display:inline-block;margin-top:4px;font-size:10px;color:#0066eb;text-decoration:none;font-weight:600">View source ↗</a>` : ''}
            </div>
          `)
          .addTo(map);
      });

      // Click cluster to zoom
      map.on('click', 'clusters', (e) => {
        const features = map.queryRenderedFeatures(e.point, { layers: ['clusters'] });
        if (!features.length) return;
        const clusterId = features[0].properties.cluster_id;
        (map.getSource('incidents') as maplibregl.GeoJSONSource).getClusterExpansionZoom(clusterId).then(zoom => {
          map.easeTo({
            center: (features[0].geometry as GeoJSON.Point).coordinates as [number, number],
            zoom,
          });
        });
      });

      map.on('mouseenter', 'clusters', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'clusters', () => { map.getCanvas().style.cursor = ''; });

      // ── Infrastructure layer ──
      map.addSource('infra', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });

      map.addLayer({
        id: 'infra-points',
        type: 'circle',
        source: 'infra',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': 5,
          'circle-opacity': 0.75,
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
        },
      });

      map.on('mouseenter', 'infra-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'infra-points', () => {
        map.getCanvas().style.cursor = '';
      });

      map.on('click', 'infra-points', (e) => {
        if (!e.features?.[0]) return;
        const f = e.features[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const p = f.properties;
        if (popupRef.current) popupRef.current.remove();
        const budget = p.budget ? `₱${Number(p.budget).toLocaleString()}` : 'N/A';
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '240px', className: 'cc-popup' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-size:11px;line-height:1.4">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="width:8px;height:8px;border-radius:50%;background:${p.color};flex-shrink:0"></span>
                <strong style="font-size:12px">${p.status}</strong>
              </div>
              <div style="color:#374151;margin-bottom:4px;font-weight:500">${p.title}</div>
              <div style="color:#6b7280;font-size:10px">${p.category} · ${budget}</div>
              <div style="color:#9ca3af;font-size:10px;margin-top:2px">Contractor: ${p.contractor}</div>
            </div>
          `)
          .addTo(map);
      });

      // ── Project NOAH hazard layers (PMTiles) ──
      for (const h of HAZARD_LAYERS) {
        const sourceId = `noah-${h.key}`;
        map.addSource(sourceId, {
          type: 'vector',
          url: `${NOAH_PMTILES_BASE}/${h.file}`,
          bounds: GENSAN_BOUNDS,
        });
        map.addLayer(
          {
            id: `noah-${h.key}-fill`,
            type: 'fill',
            source: sourceId,
            'source-layer': h.sourceLayer,
            paint: {
              'fill-color': [
                'match', ['get', h.field],
                1, h.colors[0],
                2, h.colors[1],
                3, h.colors[2],
                'transparent',
              ],
              'fill-opacity': 0.55,
            },
            layout: { visibility: 'none' },
          },
          'barangay-fills', // insert below barangay interaction layer
        );
      }

      // Hazard clip mask — fades out hazard outside GenSan while
      // keeping the base map visible through semi-transparency
      map.addLayer(
        {
          id: 'noah-clip-mask',
          type: 'fill',
          source: 'heatmap-mask',
          paint: { 'fill-color': '#ffffff', 'fill-opacity': 0 },
        },
        'barangay-fills',
      );

      // ── PHIVOLCS ground overlays (image sources, one per L4 tile) ──
      for (const layer of PHIVOLCS_LAYERS) {
        layer.tiles.forEach((tile, i) => {
          const srcId = `phivolcs-${layer.key}-${i}`;
          map.addSource(srcId, {
            type: 'image',
            url: `${layer.basePath}/${tile.file}`,
            // MapLibre image source coordinates: TL, TR, BR, BL (lng, lat)
            coordinates: [
              [tile.west, tile.north],
              [tile.east, tile.north],
              [tile.east, tile.south],
              [tile.west, tile.south],
            ],
          });
          map.addLayer(
            {
              id: `phivolcs-${layer.key}-${i}-raster`,
              type: 'raster',
              source: srcId,
              paint: { 'raster-opacity': 0, 'raster-fade-duration': 0 },
              layout: { visibility: 'none' },
            },
            'barangay-fills',
          );
        });
      }


      // ── Population density layer (Meta HRSL via HDX) ──
      // Grid cell ≈ 0.001° × 0.001° ≈ 111m × 111m at equator ≈ 0.0123 km²
      // Convert raw pop to density (ppl/km²), clamp to [0, 5000]
      const CELL_AREA_KM2 = 0.0123;
      const DENSITY_CAP = 5000; // ppl/km²
      const popFeatures: GeoJSON.Feature[] = (GENSAN_POPULATION as [number, number, number][])
        .filter(([lng, lat]) => isInsideGensan(lat, lng))
        .map(([lng, lat, pop]) => {
          const density = Math.min(pop / CELL_AREA_KM2, DENSITY_CAP);
          return {
            type: 'Feature' as const,
            geometry: { type: 'Point' as const, coordinates: [lng, lat] },
            properties: { density },
          };
        });
      map.addSource('population', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: popFeatures },
      });
      // ── Visual mode: smooth heatmap with zoom compensation ──
      // Intensity increases with zoom to offset reduced point overlap,
      // keeping dense zones visually hot at all zoom levels.
      map.addLayer(
        {
          id: 'population-heat',
          type: 'heatmap',
          source: 'population',
          paint: {
            'heatmap-weight': ['interpolate', ['linear'], ['get', 'density'],
              0, 0, 500, 0.2, 2000, 0.6, 5000, 1,
            ],
            // Zoom compensation: boost intensity as zoom increases
            // to offset the natural drop in kernel overlap
            'heatmap-intensity': ['interpolate', ['exponential', 1.5], ['zoom'],
              10, 0.8, 13, 1.5, 15, 3, 17, 6,
            ],
            'heatmap-color': [
              'interpolate', ['linear'], ['heatmap-density'],
              0, 'rgba(0,0,0,0)',
              0.05, '#d9f99d',
              0.2, '#4ade80',
              0.4, '#facc15',
              0.6, '#f97316',
              0.8, '#ef4444',
              1, '#7f1d1d',
            ],
            // Radius tuned so adjacent dense cells reinforce each other
            'heatmap-radius': ['interpolate', ['exponential', 2], ['zoom'],
              10, 8, 12, 14, 14, 28, 16, 55, 18, 110,
            ],
            'heatmap-opacity': 0,
          },
        },
        'barangay-fills',
      );

      // ── Analyst mode: grid squares with fixed density color buckets ──
      map.addLayer(
        {
          id: 'population-grid',
          type: 'circle',
          source: 'population',
          paint: {
            'circle-color': ['step', ['get', 'density'],
              '#d9f99d',       // 0–500: light green
              500, '#4ade80',  // 500–2000: green
              2000, '#facc15', // 2000–3500: yellow
              3500, '#f97316', // 3500–4500: orange
              4500, '#ef4444', // 4500–5000: red
              5000, '#7f1d1d', // 5000+: dark red
            ],
            // Square-ish cells that tile seamlessly
            'circle-radius': ['interpolate', ['exponential', 2], ['zoom'],
              10, 1.5, 12, 3, 14, 7, 16, 16, 18, 40,
            ],
            'circle-opacity': 0.85,
            'circle-stroke-width': 0,
          },
          layout: { visibility: 'none' },
        },
        'barangay-fills',
      );

      // ── Marine Analytics layers (WMTS XYZ raster) ──
      // Each layer has its own processing lag (dateLagDays, default 2).
      for (const ol of PHASE1_OCEAN) {
        const sourceId = `ocean-${ol.key}`;
        let url = ol.tileUrl;
        if (ol.needsDate) {
          const d = new Date();
          d.setDate(d.getDate() - (ol.dateLagDays ?? 2));
          url = ol.tileUrl.replace('{date}', d.toISOString().split('T')[0]);
        }
        map.addSource(sourceId, {
          type: 'raster',
          tiles: [url],
          tileSize: 256,
          maxzoom: ol.maxzoom, // MapLibre upscales beyond this zoom
          // No 'bounds' — ocean layers are global data. At maxzoom 7 the
          // entire view is only ~4 tiles so there's no perf concern, and
          // setting bounds causes frustum culling when tile edges don't
          // align with the narrow marine bounding box.
          attribution: ol.attribution,
        });
        // Bathymetry: desaturate to grayscale, dim brightness, low opacity
        // so it reads as subtle depth shading, not a loud blue overlay.
        const isBathy = ol.key === 'bathymetry';
        map.addLayer(
          {
            id: `ocean-${ol.key}-raster`,
            type: 'raster',
            source: sourceId,
            paint: {
              'raster-opacity': 0,
              ...(isBathy && {
                'raster-saturation': -0.85,
                'raster-brightness-max': 0.45,
                'raster-contrast': 0.15,
              }),
            },
            layout: { visibility: 'none' },
          },
          'boundary-fill', // below city boundary so vector layers stay on top
        );
      }

      // ── Live flight tracking layer ──
      map.addSource('aircraft', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'aircraft-points',
        type: 'circle',
        source: 'aircraft',
        paint: {
          'circle-color': ['case', ['get', 'isGround'], '#9ca3af', '#f59e0b'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 3, 10, 5, 14, 8],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
        layout: { visibility: 'none' },
      });
      // Callsign labels at higher zoom
      map.addLayer({
        id: 'aircraft-labels',
        type: 'symbol',
        source: 'aircraft',
        layout: {
          'text-field': ['coalesce', ['get', 'flight'], ['get', 'hex']],
          'text-size': 9,
          'text-font': ['Open Sans Semibold'],
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          visibility: 'none',
        },
        paint: {
          'text-color': '#f59e0b',
          'text-halo-color': '#000000',
          'text-halo-width': 1,
        },
        minzoom: 8,
      });
      // Aircraft click popup
      map.on('click', 'aircraft-points', (e) => {
        if (!e.features?.[0]) return;
        const f = e.features[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const p = f.properties;
        if (popupRef.current) popupRef.current.remove();
        const vertDir = Number(p.vertRate) > 100 ? '↑' : Number(p.vertRate) < -100 ? '↓' : '→';
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '260px', className: 'cc-popup' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-size:11px;line-height:1.5">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="font-size:14px">✈️</span>
                <strong style="font-size:13px">${p.flight || p.hex}</strong>
                ${p.squawk === '7700' ? '<span style="background:#ef4444;color:white;font-size:9px;padding:1px 4px;border-radius:3px;font-weight:700">EMERGENCY</span>' : ''}
              </div>
              ${p.desc ? `<div style="color:#6b7280;font-size:10px;margin-bottom:4px">${p.desc}</div>` : ''}
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;color:#374151">
                <div><span style="color:#9ca3af">Reg:</span> ${p.registration || '—'}</div>
                <div><span style="color:#9ca3af">Type:</span> ${p.type || '—'}</div>
                <div><span style="color:#9ca3af">Alt:</span> ${p.altLabel}</div>
                <div><span style="color:#9ca3af">Speed:</span> ${p.gs} kts</div>
                <div><span style="color:#9ca3af">Hdg:</span> ${Math.round(Number(p.heading))}°</div>
                <div><span style="color:#9ca3af">V/S:</span> ${vertDir} ${Math.abs(Number(p.vertRate))} fpm</div>
              </div>
              <div style="color:#9ca3af;font-size:9px;margin-top:4px">ICAO: ${p.hex} · Squawk: ${p.squawk || '—'}</div>
            </div>
          `)
          .addTo(map);
      });
      map.on('mouseenter', 'aircraft-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'aircraft-points', () => { map.getCanvas().style.cursor = ''; });

      // ── Nautical features layer (interactive GeoJSON from OSM) ──
      map.addSource('nautical', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'nautical-points',
        type: 'circle',
        source: 'nautical',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 6, 4, 10, 7, 14, 10],
          'circle-stroke-width': 2,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'nautical-labels',
        type: 'symbol',
        source: 'nautical',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 10,
          'text-font': ['Open Sans Semibold'],
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          visibility: 'none',
        },
        paint: {
          'text-color': '#6366f1',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
        minzoom: 8,
      });
      // Nautical click popup
      map.on('click', 'nautical-points', (e) => {
        if (!e.features?.[0]) return;
        const f = e.features[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const p = f.properties;
        if (popupRef.current) popupRef.current.remove();
        const typeLabel = String(p.featureType).replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '240px', className: 'cc-popup' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-size:11px;line-height:1.5">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="font-size:14px">${p.icon}</span>
                <strong style="font-size:13px">${p.name || typeLabel}</strong>
              </div>
              <div style="color:#6b7280;font-size:10px;margin-bottom:2px">${typeLabel}</div>
              ${p.operator ? `<div style="color:#9ca3af;font-size:10px">Operator: ${p.operator}</div>` : ''}
              ${p.description ? `<div style="color:#9ca3af;font-size:10px;margin-top:2px">${p.description}</div>` : ''}
              <div style="color:#d1d5db;font-size:9px;margin-top:4px">${coords[1].toFixed(4)}°N, ${coords[0].toFixed(4)}°E</div>
            </div>
          `)
          .addTo(map);
      });
      map.on('mouseenter', 'nautical-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'nautical-points', () => { map.getCanvas().style.cursor = ''; });

      // ── AIS vessel tracking layer ──
      map.addSource('vessels', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      // Fishing vessels get a larger, more prominent dot
      map.addLayer({
        id: 'vessel-points',
        type: 'circle',
        source: 'vessels',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['case', ['get', 'isFishing'], 7, 5],
          'circle-stroke-width': ['case', ['get', 'isFishing'], 2.5, 1.5],
          'circle-stroke-color': ['case', ['get', 'isFishing'], '#16a34a', '#ffffff'],
          'circle-opacity': 0.9,
        },
        layout: { visibility: 'none' },
      });
      map.addLayer({
        id: 'vessel-labels',
        type: 'symbol',
        source: 'vessels',
        layout: {
          'text-field': ['coalesce', ['get', 'name'], ['to-string', ['get', 'mmsi']]],
          'text-size': 9,
          'text-font': ['Open Sans Semibold'],
          'text-offset': [0, 1.4],
          'text-anchor': 'top',
          'text-allow-overlap': false,
          visibility: 'none',
        },
        paint: {
          'text-color': '#6366f1',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.2,
        },
        minzoom: 9,
      });
      // Vessel click popup
      map.on('click', 'vessel-points', (e) => {
        if (!e.features?.[0]) return;
        const f = e.features[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const p = f.properties;
        if (popupRef.current) popupRef.current.remove();
        const isFishing = p.isFishing === true || p.isFishing === 'true';
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '260px', className: 'cc-popup' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-size:11px;line-height:1.5">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="font-size:14px">${isFishing ? '🐟' : '🚢'}</span>
                <strong style="font-size:13px">${p.name || 'MMSI ' + p.mmsi}</strong>
                ${isFishing ? '<span style="background:#22c55e;color:white;font-size:9px;padding:1px 5px;border-radius:3px;font-weight:700">FISHING</span>' : ''}
              </div>
              <div style="color:#6b7280;font-size:10px;margin-bottom:4px">${p.typeLabel}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:2px 12px;color:#374151">
                <div><span style="color:#9ca3af">MMSI:</span> ${p.mmsi}</div>
                <div><span style="color:#9ca3af">Speed:</span> ${Number(p.sog).toFixed(1)} kts</div>
                <div><span style="color:#9ca3af">Course:</span> ${Math.round(Number(p.cog))}°</div>
                <div><span style="color:#9ca3af">Heading:</span> ${Number(p.heading) === 511 ? 'N/A' : Math.round(Number(p.heading)) + '°'}</div>
              </div>
              ${p.destination ? `<div style="color:#6b7280;font-size:10px;margin-top:4px">→ ${p.destination}${p.eta ? ' (ETA: ' + p.eta + ')' : ''}</div>` : ''}
              <div style="color:#d1d5db;font-size:9px;margin-top:4px">${coords[1].toFixed(4)}°N, ${coords[0].toFixed(4)}°E</div>
            </div>
          `)
          .addTo(map);
      });
      map.on('mouseenter', 'vessel-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'vessel-points', () => { map.getCanvas().style.cursor = ''; });

      // ── Critical Infrastructure POI layer ──
      map.addSource('infra-poi', {
        type: 'geojson',
        data: { type: 'FeatureCollection', features: [] },
      });
      map.addLayer({
        id: 'infra-poi-points',
        type: 'circle',
        source: 'infra-poi',
        paint: {
          'circle-color': ['get', 'color'],
          'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 7, 17, 10],
          'circle-stroke-width': 1.5,
          'circle-stroke-color': '#ffffff',
          'circle-opacity': 0.9,
        },
      });
      map.addLayer({
        id: 'infra-poi-labels',
        type: 'symbol',
        source: 'infra-poi',
        layout: {
          'text-field': ['get', 'name'],
          'text-size': 9,
          'text-font': ['Open Sans Semibold'],
          'text-offset': [0, 1.3],
          'text-anchor': 'top',
          'text-allow-overlap': false,
        },
        paint: {
          'text-color': '#374151',
          'text-halo-color': '#ffffff',
          'text-halo-width': 1.5,
        },
        minzoom: 13,
      });
      // Infra POI click popup
      map.on('click', 'infra-poi-points', (e) => {
        if (!e.features?.[0]) return;
        const f = e.features[0];
        const coords = (f.geometry as GeoJSON.Point).coordinates.slice() as [number, number];
        const p = f.properties;
        if (popupRef.current) popupRef.current.remove();
        popupRef.current = new maplibregl.Popup({ closeButton: true, maxWidth: '260px', className: 'cc-popup' })
          .setLngLat(coords)
          .setHTML(`
            <div style="font-size:11px;line-height:1.5">
              <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
                <span style="font-size:14px">${p.icon}</span>
                <strong style="font-size:13px">${p.name || p.categoryLabel}</strong>
              </div>
              <div style="color:#6b7280;font-size:10px;margin-bottom:2px">${p.categoryLabel}</div>
              ${p.address ? `<div style="color:#6b7280;font-size:10px">📍 ${p.address}</div>` : ''}
              ${p.phone ? `<div style="color:#6b7280;font-size:10px">📞 ${p.phone}</div>` : ''}
              ${p.operator ? `<div style="color:#9ca3af;font-size:10px">Operator: ${p.operator}</div>` : ''}
              ${p.openingHours ? `<div style="color:#9ca3af;font-size:10px">Hours: ${p.openingHours}</div>` : ''}
              ${p.website ? `<a href="${p.website}" target="_blank" rel="noopener" style="display:inline-block;margin-top:4px;font-size:10px;color:#0066eb;text-decoration:none;font-weight:600">Website ↗</a>` : ''}
            </div>
          `)
          .addTo(map);
      });
      map.on('mouseenter', 'infra-poi-points', () => { map.getCanvas().style.cursor = 'pointer'; });
      map.on('mouseleave', 'infra-poi-points', () => { map.getCanvas().style.cursor = ''; });

      setMapReady(true);
    });

    mapRef.current = map;

    // Ensure map picks up container size after flex layout settles
    const resizeTimer = setTimeout(() => map.resize(), 200);

    return () => {
      clearTimeout(resizeTimer);
      maplibregl.removeProtocol('pmtiles');
      map.remove();
      mapRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Update GeoJSON data when filters change ────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const src = mapRef.current.getSource('incidents') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(geojsonData);
  }, [geojsonData, mapReady]);

  // ── BangonGensan: register the bangon-markers source + layers once map is ready ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (map.getSource('bangon-markers')) return;
    map.addSource('bangon-markers', { type: 'geojson', data: bangonMarkersGeoJSON });
    // Requests: filled colored circle with white halo
    map.addLayer({
      id: 'bangon-request-points',
      type: 'circle',
      source: 'bangon-markers',
      filter: ['==', ['get', 'kind'], 'request'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 9],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2,
        'circle-opacity': 0.95,
      },
    });
    // Reports: square-ish marker using a thicker dark ring to distinguish from requests
    map.addLayer({
      id: 'bangon-report-points',
      type: 'circle',
      source: 'bangon-markers',
      filter: ['==', ['get', 'kind'], 'report'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 5, 14, 9],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#111827',
        'circle-stroke-width': 2.5,
        'circle-opacity': 0.95,
      },
    });
    // Social media: distinguishing white halo + dashed-feel via slightly smaller
    // radius. Color comes from the disaster category palette.
    map.addLayer({
      id: 'bangon-social-points',
      type: 'circle',
      source: 'bangon-markers',
      filter: ['==', ['get', 'kind'], 'social'],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 4, 14, 8],
        'circle-color': ['get', 'color'],
        'circle-stroke-color': '#0ea5e9',
        'circle-stroke-width': 2,
        'circle-opacity': 0.9,
      },
    });
    // Highlight ring layer — only renders the feature whose properties.id
    // matches the right-panel row the user just clicked. Filter starts empty
    // (matches nothing); a separate effect updates the filter when
    // highlightedMarkerId changes.
    map.addLayer({
      id: 'bangon-marker-highlight',
      type: 'circle',
      source: 'bangon-markers',
      filter: ['==', ['get', 'id'], ''],
      paint: {
        'circle-radius': ['interpolate', ['linear'], ['zoom'], 10, 16, 14, 26],
        'circle-color': 'rgba(0,0,0,0)',
        'circle-stroke-color': '#facc15',
        'circle-stroke-width': 3,
        'circle-opacity': 1,
      },
    });

    const popupRef = new maplibregl.Popup({ closeButton: true, closeOnClick: true, maxWidth: '280px' });
    const onClick = () => (e: maplibregl.MapMouseEvent) => {
      const f = (e as unknown as { features?: GeoJSON.Feature[] }).features?.[0];
      if (!f) return;
      const p = (f.properties ?? {}) as Record<string, string>;
      const kind = p.kind;
      const titleLabel = kind === 'request' ? 'Relief Request' : kind === 'report' ? 'Incident Report' : 'Social Media';
      let body = '';
      if (kind === 'request') {
        body = `<div style="font-size:11px;color:#374151">${p.name ?? ''}</div>`;
      } else if (kind === 'report') {
        const desc = p.description ?? '';
        body = `<div style="font-size:11px;color:#374151;line-height:1.35">${desc.slice(0, 220)}${desc.length > 220 ? '…' : ''}</div>`;
      } else {
        const head = p.headline ?? '';
        const sum = p.summary ?? '';
        body = `
          ${head ? `<div style="font-size:11px;color:#111827;font-weight:600;line-height:1.35;margin-bottom:3px">${head}</div>` : ''}
          ${sum ? `<div style="font-size:10px;color:#374151;line-height:1.35">${sum.slice(0, 220)}${sum.length > 220 ? '…' : ''}</div>` : ''}
          ${p.source_page_name ? `<div style="font-size:9px;color:#6b7280;margin-top:4px">via ${p.source_page_name}</div>` : ''}
          ${p.message_url ? `<a href="${p.message_url}" target="_blank" rel="noopener" style="display:inline-block;margin-top:4px;font-size:10px;color:#0ea5e9;text-decoration:none;font-weight:600">View on Facebook ↗</a>` : ''}
        `;
      }
      const loc = p.landmark && p.barangay ? `${p.barangay} · ${p.landmark}` : (p.barangay || p.landmark || 'GenSan');
      const coords = (f.geometry as GeoJSON.Point).coordinates as [number, number];
      popupRef
        .setLngLat(coords)
        .setHTML(`
          <div style="font-family:system-ui,-apple-system,sans-serif;min-width:200px">
            <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px">
              <span style="display:inline-block;width:8px;height:8px;border-radius:9999px;background:${p.color}"></span>
              <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#6b7280">${titleLabel}</span>
              <span style="margin-left:auto;font-size:9px;color:#9ca3af;text-transform:capitalize">${p.status ?? ''}</span>
            </div>
            <div style="font-size:13px;font-weight:700;color:#111827;margin-bottom:2px">${p.label}</div>
            ${body}
            <div style="font-size:10px;color:#9ca3af;margin-top:6px">📍 ${loc}</div>
          </div>
        `)
        .addTo(map);
    };
    const handler = onClick();
    map.on('click', 'bangon-request-points', handler);
    map.on('click', 'bangon-report-points', handler);
    map.on('click', 'bangon-social-points', handler);
    const enter = () => { map.getCanvas().style.cursor = 'pointer'; };
    const leave = () => { map.getCanvas().style.cursor = ''; };
    map.on('mouseenter', 'bangon-request-points', enter);
    map.on('mouseleave', 'bangon-request-points', leave);
    map.on('mouseenter', 'bangon-report-points', enter);
    map.on('mouseleave', 'bangon-report-points', leave);
    map.on('mouseenter', 'bangon-social-points', enter);
    map.on('mouseleave', 'bangon-social-points', leave);
  }, [mapReady, bangonMarkersGeoJSON]);

  // ── BangonGensan: push fresh data into the bangon-markers source on every load ──
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const src = mapRef.current.getSource('bangon-markers') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(bangonMarkersGeoJSON);
  }, [bangonMarkersGeoJSON, mapReady]);

  // ── Highlight filter — rerun whenever the user clicks a Reports/Requests row ──
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    if (!map.getLayer('bangon-marker-highlight')) return;
    map.setFilter('bangon-marker-highlight', ['==', ['get', 'id'], highlightedMarkerId ?? '']);
  }, [highlightedMarkerId, mapReady]);

  // ── Toggle marker layer visibility (always on when any incident category is active) ──
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const vis = anyIncidentsOn ? 'visible' : 'none';
    ['incident-points', 'clusters', 'cluster-count'].forEach(id => {
      if (mapRef.current!.getLayer(id)) mapRef.current!.setLayoutProperty(id, 'visibility', vis);
    });
  }, [anyIncidentsOn, mapReady]);

  // ── Update combined heatmap data ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const features: GeoJSON.Feature[] = [];
    // Add incident points
    if (anyIncidentsOn) {
      mappableIncidents.forEach(i => {
        features.push({
          type: 'Feature',
          properties: { severity: i.severity, weight: i.severity === 'high' ? 1 : i.severity === 'medium' ? 0.6 : 0.3 },
          geometry: { type: 'Point', coordinates: [i.lng, i.lat] },
        });
      });
    }
    // Add infra points
    if (anyInfraOn) {
      filteredInfraProjects.forEach(p => {
        if (p.latitude && p.longitude) {
          features.push({
            type: 'Feature',
            properties: { severity: 'low', weight: 0.2 },
            geometry: { type: 'Point', coordinates: [p.longitude, p.latitude] },
          });
        }
      });
    }
    const src = mapRef.current.getSource('heatmap-data') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData({ type: 'FeatureCollection', features });
  }, [mappableIncidents, filteredInfraProjects, anyIncidentsOn, anyInfraOn, mapReady]);

  // ── Update infrastructure GeoJSON ───────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const src = mapRef.current.getSource('infra') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(infraGeoJSON);
  }, [infraGeoJSON, mapReady]);

  // ── Toggle infrastructure layer visibility ─────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (mapRef.current.getLayer('infra-points')) {
      mapRef.current.setLayoutProperty('infra-points', 'visibility', showInfra ? 'visible' : 'none');
    }
  }, [showInfra, mapReady]);

  // ── Toggle population density layer (visual / analyst / off) ────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    if (mapRef.current.getLayer('population-heat')) {
      mapRef.current.setPaintProperty('population-heat', 'heatmap-opacity', popMode === 'visual' ? 0.75 : 0);
    }
    if (mapRef.current.getLayer('population-grid')) {
      mapRef.current.setLayoutProperty('population-grid', 'visibility', popMode === 'analyst' ? 'visible' : 'none');
    }
  }, [popMode, mapReady]);

  // ── Toggle barangay borders ─────────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const vis = showBarangays ? 'visible' : 'none';
    ['barangay-fills', 'barangay-borders', 'barangay-labels'].forEach(id => {
      if (mapRef.current!.getLayer(id)) mapRef.current!.setLayoutProperty(id, 'visibility', vis);
    });
  }, [showBarangays, mapReady]);

  // ── Toggle NOAH hazard layer visibility ─────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const anyHazardOn = HAZARD_LAYERS.some(h => hazardLayers[h.key]);
    for (const h of HAZARD_LAYERS) {
      const layerId = `noah-${h.key}-fill`;
      if (mapRef.current.getLayer(layerId)) {
        mapRef.current.setLayoutProperty(
          layerId, 'visibility', hazardLayers[h.key] ? 'visible' : 'none',
        );
      }
    }
    // Semi-transparent mask fades hazard outside GenSan while keeping base map visible
    if (mapRef.current.getLayer('noah-clip-mask')) {
      mapRef.current.setPaintProperty('noah-clip-mask', 'fill-opacity', anyHazardOn ? 0.88 : 0);
    }
  }, [hazardLayers, mapReady]);

  // ── Toggle PHIVOLCS L4 tile visibility ──────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    for (const layer of PHIVOLCS_LAYERS) {
      const on = phivolcsLayers[layer.key];
      const opacity = phivolcsOpacity[layer.key];
      layer.tiles.forEach((_, i) => {
        const layerId = `phivolcs-${layer.key}-${i}-raster`;
        if (mapRef.current?.getLayer(layerId)) {
          mapRef.current.setLayoutProperty(layerId, 'visibility', on ? 'visible' : 'none');
          mapRef.current.setPaintProperty(layerId, 'raster-opacity', on ? opacity : 0);
        }
      });
    }
  }, [phivolcsLayers, phivolcsOpacity, mapReady]);

  // ── Toggle ocean layer visibility ──────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    for (const ol of PHASE1_OCEAN) {
      const layerId = `ocean-${ol.key}-raster`;
      if (mapRef.current.getLayer(layerId)) {
        mapRef.current.setLayoutProperty(
          layerId, 'visibility', oceanLayers[ol.key] ? 'visible' : 'none',
        );
        mapRef.current.setPaintProperty(
          layerId, 'raster-opacity', oceanLayers[ol.key] ? oceanOpacity[ol.key] : 0,
        );
      }
    }
  }, [oceanLayers, oceanOpacity, mapReady]);

  // ── Update aircraft positions on map ───────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const src = mapRef.current.getSource('aircraft') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(aircraftGeoJSON);
  }, [aircraftGeoJSON, mapReady]);

  // ── Toggle flight layer visibility ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const vis = showFlights ? 'visible' : 'none';
    if (mapRef.current.getLayer('aircraft-points')) {
      mapRef.current.setLayoutProperty('aircraft-points', 'visibility', vis);
    }
    if (mapRef.current.getLayer('aircraft-labels')) {
      mapRef.current.setLayoutProperty('aircraft-labels', 'visibility', vis);
    }
  }, [showFlights, mapReady]);

  // ── Update nautical features on map ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const src = mapRef.current.getSource('nautical') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(nauticalGeoJSON);
  }, [nauticalGeoJSON, mapReady]);

  // ── Toggle nautical + vessel layer visibility ───────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const vis = showShips ? 'visible' : 'none';
    for (const id of ['nautical-points', 'nautical-labels', 'vessel-points', 'vessel-labels']) {
      if (mapRef.current.getLayer(id)) {
        mapRef.current.setLayoutProperty(id, 'visibility', vis);
      }
    }
  }, [showShips, mapReady]);

  // ── Update vessel positions on map ─────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const src = mapRef.current.getSource('vessels') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(vesselGeoJSON);
  }, [vesselGeoJSON, mapReady]);

  // ── Update infra POI data on map ────────────────────────────────────
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const src = mapRef.current.getSource('infra-poi') as maplibregl.GeoJSONSource | undefined;
    if (src) src.setData(infraPOIGeoJSON);
  }, [infraPOIGeoJSON, mapReady]);

  // ── Dark mode: swap raster tiles + update paint properties ─────────���
  useEffect(() => {
    if (!mapRef.current || !mapReady) return;
    const map = mapRef.current;
    const rasterSrc = map.getSource('osm') as maplibregl.RasterTileSource | undefined;
    if (rasterSrc) {
      // Swap tile URLs without destroying layers
      const tiles = darkMode
        ? ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png', 'https://b.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png']
        : ['https://a.tile.openstreetmap.org/{z}/{x}/{y}.png', 'https://b.tile.openstreetmap.org/{z}/{x}/{y}.png'];
      // setTiles is available on RasterTileSource
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (rasterSrc as any).setTiles(tiles);
    }
    if (map.getLayer('noah-clip-mask')) map.setPaintProperty('noah-clip-mask', 'fill-color', darkMode ? '#0d1117' : '#ffffff');
    // Update stroke colors
    const stroke = darkMode ? '#1a2030' : '#ffffff';
    if (map.getLayer('incident-points')) map.setPaintProperty('incident-points', 'circle-stroke-color', stroke);
    if (map.getLayer('clusters')) map.setPaintProperty('clusters', 'circle-stroke-color', stroke);
    if (map.getLayer('infra-points')) map.setPaintProperty('infra-points', 'circle-stroke-color', stroke);
    // Update boundary
    if (map.getLayer('boundary-line')) map.setPaintProperty('boundary-line', 'line-color', darkMode ? '#3b82f6' : '#0066eb');
    // Update heatmap mask
    if (map.getLayer('heatmap-mask-fill')) map.setPaintProperty('heatmap-mask-fill', 'fill-color', darkMode ? '#0a0e14' : '#f3f4f6');
    // Update barangay styling
    if (map.getLayer('barangay-borders')) map.setPaintProperty('barangay-borders', 'line-color', darkMode ? '#3b82f6' : '#0066eb');
    if (map.getLayer('barangay-labels')) {
      map.setPaintProperty('barangay-labels', 'text-color', darkMode ? '#60a5fa' : '#0066eb');
      map.setPaintProperty('barangay-labels', 'text-halo-color', darkMode ? '#0a0e14' : '#ffffff');
    }
    // Boost ocean raster opacity slightly on dark backgrounds
    for (const ol of PHASE1_OCEAN) {
      const layerId = `ocean-${ol.key}-raster`;
      if (map.getLayer(layerId) && oceanLayers[ol.key]) {
        map.setPaintProperty(layerId, 'raster-opacity',
          darkMode ? Math.min(oceanOpacity[ol.key] + 0.1, 1) : oceanOpacity[ol.key],
        );
      }
    }
  }, [darkMode, mapReady, oceanLayers, oceanOpacity]);

  // Resize map when switching mobile views
  useEffect(() => {
    if (mobileView === 'map' && mapRef.current) {
      setTimeout(() => mapRef.current?.resize(), 100);
    }
  }, [mobileView]);

  return (
    <>
      <PrivacyGate />
      <Helmet>
        <title>BangonGensan — Emergency Response</title>
        <meta name="description" content="BangonGensan — emergency response operational surface for General Santos City. Live situational overlay for ongoing incidents and recovery work." />
      </Helmet>

      {/* Theme styles */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .cc-popup .maplibregl-popup-content { border-radius: 8px; padding: 10px 12px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); }
        .cc-popup .maplibregl-popup-close-button { font-size: 16px; padding: 2px 6px; color: #9ca3af; }
        .cc-sev-high { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }
        .cc-sev-med { background: #fffbeb; color: #92400e; border: 1px solid #fde68a; }
        .cc-sev-low { background: #eff6ff; color: #1e40af; border: 1px solid #bfdbfe; }

        /* ── Palantir Dark Mode ── */
        .cc-dark { background: #0a0e14 !important; color: #c5cdd8; }
        .cc-dark .cc-surface { background: #111720 !important; border-color: #1e2a3a !important; }
        .cc-dark .cc-surface-raised { background: #141c28 !important; border-color: #1e2a3a !important; }
        .cc-dark .cc-panel-header { background: #0d1520 !important; border-bottom: 1px solid #1e2a3a !important; }
        .cc-dark .bg-primary-700 { background: #0d1520 !important; }
        .cc-dark .cc-text-primary { color: #e4e8ee !important; }
        .cc-dark .cc-text-secondary { color: #8899aa !important; }
        .cc-dark .cc-text-muted { color: #556677 !important; }
        .cc-dark .cc-border { border-color: #1e2a3a !important; }
        .cc-dark .cc-divider { background: #1e2a3a !important; }
        .cc-dark .cc-hover:hover { background: #1a2435 !important; }
        .cc-dark .cc-input { background: #0d1520 !important; border-color: #1e2a3a !important; color: #c5cdd8 !important; }
        .cc-dark .cc-sidebar { background: #0d1117 !important; border-color: #1e2a3a !important; }
        .cc-dark .cc-feed-active { background: rgba(0,102,235,0.08) !important; border-left-color: #0066eb !important; }
        .cc-dark .cc-feed-item:hover { background: rgba(255,255,255,0.03) !important; }
        .cc-dark .cc-alert-amber { background: rgba(245,137,0,0.08) !important; border-color: rgba(245,137,0,0.2) !important; }
        .cc-dark .cc-alert-amber * { color: #f58900 !important; }
        .cc-dark .cc-alert-red { background: rgba(225,46,46,0.08) !important; border-color: rgba(225,46,46,0.2) !important; }
        .cc-dark .cc-alert-red * { color: #ef4444 !important; }
        .cc-dark .cc-alert-blue { background: rgba(0,102,235,0.08) !important; border-color: rgba(0,102,235,0.2) !important; }
        .cc-dark .cc-alert-blue * { color: #4d9fff !important; }
        .cc-dark .cc-alert-green { background: rgba(0,175,95,0.08) !important; border-color: rgba(0,175,95,0.2) !important; }
        .cc-dark .cc-alert-green * { color: #00d97e !important; }
        .cc-dark .cc-bar-track { background: #1a2435 !important; }
        .cc-dark .cc-risk-high { background: rgba(225,46,46,0.12) !important; color: #ef4444 !important; border-color: rgba(225,46,46,0.25) !important; }
        .cc-dark .cc-risk-medium { background: rgba(245,137,0,0.12) !important; color: #f58900 !important; border-color: rgba(245,137,0,0.25) !important; }
        .cc-dark .cc-risk-low { background: rgba(0,175,95,0.12) !important; color: #00d97e !important; border-color: rgba(0,175,95,0.25) !important; }
        .cc-dark .maplibregl-popup-content { background: #111720 !important; color: #c5cdd8 !important; border: 1px solid #1e2a3a !important; }
        .cc-dark .maplibregl-popup-tip { border-top-color: #111720 !important; }
        .cc-dark .cc-popup .maplibregl-popup-close-button { color: #556677 !important; }

        /* Sidebar items */
        .cc-dark .border-gray-200, .cc-dark .border-gray-100, .cc-dark .border-gray-50 { border-color: #1e2a3a !important; }
        .cc-dark .border-gray-300 { border-color: #1e2a3a !important; }
        .cc-dark .bg-gray-50, .cc-dark .bg-gray-100 { background: #0d1520 !important; }
        .cc-dark .bg-white { background: #111720 !important; }
        .cc-dark .text-gray-900 { color: #e4e8ee !important; }
        .cc-dark .text-gray-800 { color: #c5cdd8 !important; }
        .cc-dark .text-gray-700 { color: #a0aec0 !important; }
        .cc-dark .text-gray-600 { color: #8899aa !important; }
        .cc-dark .text-gray-500 { color: #6b7d8f !important; }
        .cc-dark .text-gray-400 { color: #556677 !important; }
        .cc-dark .hover\\:bg-white:hover { background: #1a2435 !important; }
        .cc-dark .hover\\:bg-gray-50:hover { background: #1a2435 !important; }
        .cc-dark .hover\\:bg-primary-50\\/30:hover { background: rgba(0,102,235,0.08) !important; }
        .cc-dark .bg-primary-50\\/50 { background: rgba(0,102,235,0.1) !important; }
        .cc-dark .bg-primary-50 { background: rgba(0,102,235,0.08) !important; }
        .cc-dark .border-primary-200 { border-color: rgba(0,102,235,0.2) !important; }
        .cc-dark .text-primary-800, .cc-dark .text-primary-700 { color: #4d9fff !important; }
        .cc-dark .bg-amber-50 { background: rgba(245,137,0,0.08) !important; }
        .cc-dark .border-amber-200 { border-color: rgba(245,137,0,0.2) !important; }
        .cc-dark .text-amber-800, .cc-dark .text-amber-700 { color: #f5a623 !important; }
        .cc-dark .bg-red-50 { background: rgba(225,46,46,0.08) !important; }
        .cc-dark .border-red-200 { border-color: rgba(225,46,46,0.2) !important; }
        .cc-dark .text-red-800, .cc-dark .text-red-700 { color: #ef4444 !important; }
        .cc-dark .bg-emerald-50 { background: rgba(0,175,95,0.08) !important; }
        .cc-dark .border-emerald-200 { border-color: rgba(0,175,95,0.2) !important; }
        .cc-dark .text-emerald-800, .cc-dark .text-emerald-700, .cc-dark .text-emerald-600 { color: #00d97e !important; }
        .cc-dark .bg-white\\/90 { background: rgba(17,23,32,0.9) !important; }

        /* MapLibre zoom controls */
        .cc-dark .maplibregl-ctrl-group { background: #111720 !important; border-color: #1e2a3a !important; }
        .cc-dark .maplibregl-ctrl-group button { color: #8899aa !important; }
        .cc-dark .maplibregl-ctrl-group button:hover { background: #1a2435 !important; }
        .cc-dark .maplibregl-ctrl-group button+button { border-top-color: #1e2a3a !important; }
        .cc-dark .maplibregl-ctrl-compass .maplibregl-ctrl-icon { filter: invert(0.7); }

        /* Legend strip in dark mode */
        .cc-dark .bg-white\\/90 .font-medium { color: #c5cdd8 !important; }

        /* Feed tags */
        .cc-dark .bg-red-50.text-red-700 { background: rgba(225,46,46,0.12) !important; color: #ef4444 !important; }
        .cc-dark .bg-emerald-50.text-emerald-700 { background: rgba(0,175,95,0.12) !important; color: #00d97e !important; }

        /* Filter summary */
        .cc-dark input[type="checkbox"] { background: #0d1520 !important; border-color: #2a3a4a !important; }

        /* Map floating widgets + status bar in dark mode */
        .cc-dark .bg-gray-900\\/85 { background: rgba(10,14,20,0.92) !important; border-color: #1e2a3a !important; }
        .cc-dark .bg-gray-900\\/90 { background: rgba(10,14,20,0.95) !important; border-color: #1e2a3a !important; }
        .cc-dark .border-gray-700\\/50 { border-color: #1e2a3a !important; }
        .cc-dark .border-gray-800\\/50 { border-color: #1a2435 !important; }
        .cc-dark header.bg-gray-900, .cc-dark .bg-gray-900 { background: #080c12 !important; }
        .cc-dark .bg-gray-800 { background: #0d1520 !important; }

        /* Intelligence stat grid dividers */
        .cc-dark .gap-px.bg-gray-200 { background: #1e2a3a !important; }
        .cc-dark .border-b.border-gray-200 { border-color: #1e2a3a !important; }
        .cc-dark .border-l.border-gray-200 { border-color: #1e2a3a !important; }

        /* Custom scrollbars */
        .cc-scroll::-webkit-scrollbar { width: 4px; }
        .cc-scroll::-webkit-scrollbar-track { background: transparent; }
        .cc-scroll::-webkit-scrollbar-thumb { background: #d1d5db; border-radius: 4px; }
        .cc-scroll::-webkit-scrollbar-thumb:hover { background: #9ca3af; }
        .cc-dark .cc-scroll::-webkit-scrollbar-thumb { background: #2a3a4a; }
        .cc-dark .cc-scroll::-webkit-scrollbar-thumb:hover { background: #3a4a5a; }
        .cc-scroll { scrollbar-width: thin; scrollbar-color: #d1d5db transparent; }
        .cc-dark .cc-scroll { scrollbar-color: #2a3a4a transparent; }
      `}</style>

      <div className={`h-screen flex flex-col overflow-hidden transition-colors duration-300 ${darkMode ? 'cc-dark bg-[#0a0e14]' : 'bg-gray-100'}`}>

        {/* ═══ STATUS BAR (hidden on mobile) ════════════════════════ */}
        <header className="hidden lg:flex bg-gray-900 text-white px-3 py-1.5 items-center gap-3 flex-shrink-0 z-30 text-[11px]">
          <button onClick={() => navigate('/')} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors font-medium">
            <ArrowLeft size={12} />
            <span className="hidden sm:inline">Home</span>
          </button>
          <div className="h-3 w-px bg-gray-700" />
          <div className="flex items-center gap-1.5 font-bold text-xs tracking-tight">
            <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
            BANGONGENSAN
            <span className="ml-1.5 px-1.5 py-px text-[9px] font-bold uppercase tracking-widest rounded bg-red-600 text-white">Emergency</span>
          </div>
          <div className="h-3 w-px bg-gray-700" />
          <div className="flex-1 flex items-center gap-2 min-w-0 overflow-hidden mx-3">
            <span className="flex-shrink-0 text-[10px] font-bold text-white uppercase tracking-wider">NEWS:</span>
            <div className="flex-1 overflow-hidden relative">
              <div className="whitespace-nowrap animate-[marquee_45s_linear_infinite] text-[11px] font-medium" style={{ color: '#f58900' }}>
                {filteredIncidents.length > 0
                  ? filteredIncidents
                      .filter(i => i.summary)
                      .slice(0, 15)
                      .map(i => i.summary.length > 100 ? i.summary.slice(0, 100) + '…' : i.summary)
                      .join(' — ')
                  : 'No active reports — monitoring General Santos City safety signals'
                }
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-900/40 text-amber-400 rounded border border-amber-800/50 font-medium">
              <CircleDot size={9} />
              APPROX. MAPPING
            </span>
            <span className="flex items-center gap-1 text-gray-500">
              <Users size={10} />
              Community-Powered
            </span>
            <div className="h-3 w-px bg-gray-700" />
            <span className="font-mono text-gray-400 tabular-nums">
              {clock.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
            </span>
          </div>
        </header>

        {/* ═══ MAIN WORKSPACE ═══════════════════════════════════════ */}
        <div className="flex-1 flex min-h-0">

          {/* ── LEFT: Chat (full-screen overlay on mobile when active) ─── */}
          <aside className={`${mobileView === 'chat' ? 'fixed inset-0 z-30 flex w-full pb-20' : 'hidden lg:flex'} lg:relative lg:inset-auto lg:z-10 lg:flex flex-shrink-0 border-r flex-col transition-all cc-sidebar lg:${layerPanelOpen ? 'w-64' : 'w-10'} ${darkMode ? 'bg-[#0d1117] border-[#1e2a3a]' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={() => setLayerPanelOpen(!layerPanelOpen)}
              className="bg-primary-700 px-2.5 py-2 flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-widest flex-shrink-0 hover:bg-primary-600 transition-colors"
            >
              <Users size={12} />
              {layerPanelOpen && <span className="flex-1 text-left">Community</span>}
              {layerPanelOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {layerPanelOpen && (
                  <div className="flex-1 flex flex-col min-h-0 bg-[#0a0e14]">
                    <div className="px-2.5 py-1.5 border-b border-[#1e2a3a] text-[9px] text-gray-400 flex items-center gap-1.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      </span>
                      <span>Anonymous · you are <span className="text-gray-200 font-bold">{chatHandle?.displayName ?? '…'}</span></span>
                    </div>
                    <div ref={chatScrollRef} className="flex-1 overflow-y-auto cc-scroll px-2 py-2 space-y-1.5">
                      {chatError && (
                        <div className="p-3 sm:p-2 rounded-md bg-red-900/40 border border-red-700/60 text-sm sm:text-[10px] text-red-100 sm:text-red-200 shadow-lg sm:shadow-none">{chatError}</div>
                      )}
                      {chatMessages.length === 0 && !chatError && (
                        <div className="text-[10px] text-gray-500 italic text-center py-4">
                          No messages yet. Say something.
                        </div>
                      )}
                      {chatMessages.map(m => {
                        const mine = m.session_id === chatHandle?.sessionId;
                        return (
                          <div key={m.id} className={`flex flex-col bg-anim-slide-x ${mine ? 'items-end' : 'items-start'}`}>
                            <div className="text-[8px] uppercase tracking-widest text-gray-500 mb-0.5">
                              {mine ? 'you' : m.display_name} · {new Date(m.created_at).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                            <div className={`max-w-[85%] px-2 py-1 rounded-md text-[11px] leading-snug ${mine ? 'bg-red-600 text-white' : 'bg-[#111720] text-gray-100 border border-gray-700'}`}>
                              {m.content}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    <form
                      onSubmit={e => { e.preventDefault(); void sendChatMessage(); }}
                      className="flex items-stretch border-t border-[#1e2a3a] bg-[#0d1117] flex-shrink-0"
                    >
                      <input
                        type="text"
                        value={chatDraft}
                        onChange={e => setChatDraft(e.target.value)}
                        placeholder={chatHandle ? 'Type a message…' : 'Connecting…'}
                        maxLength={1000}
                        disabled={!chatHandle}
                        className="flex-1 bg-transparent px-2.5 py-2 text-[11px] text-white placeholder:text-gray-500 focus:outline-none disabled:opacity-50"
                      />
                      <button
                        type="submit"
                        disabled={chatSending || !chatHandle || !chatDraft.trim()}
                        className="px-3 bg-primary-700 hover:bg-primary-600 disabled:bg-gray-700 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1"
                      >
                        <Send size={11} />
                      </button>
                    </form>

                    {/* ── LEGEND (bottom of Community sidebar, desktop only) ─────── */}
                    {/* Compact color key for the three map layers. Social Media
                        renders as a single chip — disaster sub-categories are
                        not enumerated here (the map markers still color per
                        category; this strip just signals the layer exists).
                        Hidden on mobile so the chat panel has full screen real
                        estate when it's the active mobile view. */}
                    <div className="hidden lg:flex flex-col border-t border-[#1e2a3a] bg-[#0a0e14] flex-shrink-0">
                      <div className="px-2.5 py-1 flex items-center gap-1.5 border-b border-[#1e2a3a]">
                        <Layers size={9} className="text-gray-400" />
                        <span className="text-[9px] font-bold text-gray-300 uppercase tracking-widest">Legend</span>
                      </div>
                      <div className="px-2 py-1.5 space-y-1.5">
                        <div>
                          <div className="text-[8px] font-bold uppercase tracking-widest text-red-300 mb-0.5">Requests</div>
                          <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                            {(Object.keys(NEED_COLOR) as BangonNeedType[]).map(k => (
                              <span key={`leg-req-${k}`} className="flex items-center gap-1 text-[9px] text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: NEED_COLOR[k] }} />
                                {NEED_SHORT[k]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[8px] font-bold uppercase tracking-widest text-orange-300 mb-0.5">Reports</div>
                          <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                            {(Object.keys(INCIDENT_COLOR) as IncidentType[]).map(k => (
                              <span key={`leg-rpt-${k}`} className="flex items-center gap-1 text-[9px] text-gray-300">
                                <span className="w-1.5 h-1.5 rounded-sm" style={{ backgroundColor: INCIDENT_COLOR[k] }} />
                                {INCIDENT_SHORT[k]}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[8px] font-bold uppercase tracking-widest text-sky-300 mb-0.5">Social Media</div>
                          <span className="flex items-center gap-1 text-[9px] text-gray-300">
                            <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: '#0ea5e9' }} />
                            Disaster posts
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
            )}
          </aside>

          {/* ── CENTER + RIGHT WORKSPACE ──────────────────────────── */}
          <div className="flex-1 flex flex-col min-w-0">

            {/* ══ MAP ZONE ═══════════════════════════════════════ */}
            <div className={`relative flex-1 min-h-0 ${mobileView !== 'map' ? 'hidden lg:block' : ''}`} style={{ minHeight: '55vh' }}>
              <div ref={mapContainerRef} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} />

              {/* Mobile: floating back button */}
              <button
                onClick={() => navigate('/')}
                className="lg:hidden absolute top-3 left-3 z-[10] bg-white/90 backdrop-blur rounded-full shadow-lg border border-gray-200 w-10 h-10 flex items-center justify-center"
              >
                <ArrowLeft size={18} className="text-gray-700" />
              </button>


              {/* ── Floating overlays ─────────────────────────────── */}

              {/* Heatmap legend */}

              {/* Timeline scrubber bar — above legend strip, toggleable */}
              <div className={`hidden lg:block absolute bottom-10 left-3 right-20 z-[10] transition-all duration-300 ease-in-out ${timelineOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'}`}>
                <div className="bg-gray-900/90 backdrop-blur rounded-lg border border-gray-700/50 shadow-xl px-3 pt-2 pb-3">
                  {/* Window selector + date labels */}
                  <div className="flex items-center gap-2 mb-1.5">
                    <div className="flex gap-0.5">
                      {(['24h', '7d', '30d', '90d'] as const).map(w => (
                        <button
                          key={w}
                          onClick={() => { setTimelineWindow(w); setTimelineRange([0, 1]); }}
                          className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${timelineWindow === w ? 'bg-primary-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                          {w.toUpperCase()}
                        </button>
                      ))}
                    </div>
                    <div className="flex-1" />
                    <span className="text-[9px] text-gray-400 font-mono">
                      {timelineDates.from.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                      {' — '}
                      {timelineDates.to.toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                    </span>
                    {(timelineRange[0] !== 0 || timelineRange[1] !== 1) && (
                      <button onClick={() => setTimelineRange([0, 1])} className="text-[9px] text-primary-400 font-medium">Reset</button>
                    )}
                  </div>
                  {/* Dual-handle slider track */}
                  <div className="relative h-5 flex items-center group">
                    {/* Track background */}
                    <div className="absolute inset-x-0 h-1.5 bg-gray-700 rounded-full" />
                    {/* Active range */}
                    <div
                      className="absolute h-1.5 bg-primary-500 rounded-full"
                      style={{ left: `${timelineRange[0] * 100}%`, right: `${(1 - timelineRange[1]) * 100}%` }}
                    />
                    {/* Left handle */}
                    <input
                      type="range"
                      min={0} max={1000} step={1}
                      value={timelineRange[0] * 1000}
                      onChange={e => {
                        const v = Number(e.target.value) / 1000;
                        setTimelineRange(([, to]) => [Math.min(v, to - 0.02), to]);
                      }}
                      className="absolute inset-x-0 h-5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-500 [&::-moz-range-thumb]:cursor-grab"
                      style={{ zIndex: timelineRange[0] > 0.5 ? 2 : 1 }}
                    />
                    {/* Right handle */}
                    <input
                      type="range"
                      min={0} max={1000} step={1}
                      value={timelineRange[1] * 1000}
                      onChange={e => {
                        const v = Number(e.target.value) / 1000;
                        setTimelineRange(([from]) => [from, Math.max(v, from + 0.02)]);
                      }}
                      className="absolute inset-x-0 h-5 appearance-none bg-transparent pointer-events-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-primary-500 [&::-webkit-slider-thumb]:cursor-grab [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-white [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-primary-500 [&::-moz-range-thumb]:cursor-grab"
                      style={{ zIndex: timelineRange[1] < 0.5 ? 2 : 1 }}
                    />
                  </div>
                  {/* Tick marks */}
                  <div className="flex justify-between mt-0.5">
                    {(() => {
                      const ticks = timelineWindow === '24h' ? ['0h', '6h', '12h', '18h', 'Now']
                        : timelineWindow === '7d' ? ['7d ago', '5d', '3d', '1d', 'Now']
                        : timelineWindow === '30d' ? ['30d ago', '22d', '15d', '7d', 'Now']
                        : ['90d ago', '67d', '45d', '22d', 'Now'];
                      return ticks.map(t => <span key={t} className="text-[8px] text-gray-600">{t}</span>);
                    })()}
                  </div>
                </div>
              </div>

              {/* Legend moved into the Intelligence Deck (bottom row) so it sits inline
                  with Controls + Live Feed at the same height. See LEGEND panel below. */}

            </div>


            {/* ══ INTELLIGENCE DECK (Controls + Live Feed) ════════ */}
            <div className={`border-t ${mobileView === 'controls' ? 'flex-1 pb-20' : 'hidden lg:block'} lg:flex-shrink-0 ${darkMode ? 'bg-[#0a0e14] border-[#1e2a3a]' : 'bg-gray-100 border-gray-300'}`} style={{ height: mobileView === 'controls' ? undefined : '33vh' }}>
              <div className={`h-full flex flex-col lg:flex-row gap-px overflow-y-auto cc-scroll lg:overflow-hidden ${darkMode ? 'bg-[#1e2a3a]' : 'bg-gray-300'}`}>

                {/* ── LIVE FEED ─────────────────────────────────── */}
                <div className={`w-full lg:w-1/2 lg:order-2 flex flex-col ${darkMode ? 'bg-[#111720]' : 'bg-white'}`}>
                  <div className="cc-panel-header bg-primary-700 px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0">
                    <Activity size={11} className="text-primary-200" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Live Feed</span>
                    <span className="ml-auto relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
                    </span>
                  </div>
                  <div ref={feedRef} className="flex-1 overflow-y-auto cc-scroll">
                    {unifiedFeed.length === 0 && (
                      <div className="px-3 py-6 text-center text-[10px] text-gray-400">No social-media disaster reports in the last 5 days.</div>
                    )}
                    {unifiedFeed.map((item, idx) => {
                      const RowTag = item.url ? 'a' : 'div';
                      const rowProps = item.url
                        ? { href: item.url, target: '_blank' as const, rel: 'noopener noreferrer' }
                        : {};
                      return (
                        <RowTag
                          key={item.id}
                          {...rowProps}
                          className={`block px-3 py-2 border-b border-gray-100 hover:bg-primary-50/30 transition-colors ${item.url ? 'cursor-pointer' : ''} ${idx === 0 ? 'bg-primary-50/50 border-l-2 border-l-primary-500' : ''}`}
                        >
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.dotColor }} />
                            <span className="text-[11px] font-bold text-gray-900">{item.title}</span>
                            <span className="text-[8px] px-1 py-0 rounded font-medium bg-sky-50 text-sky-700">
                              SOCIAL MEDIA
                            </span>
                            <span className="text-[8px] px-1 py-0 rounded font-medium bg-gray-100 text-gray-600 capitalize">
                              {item.status}
                            </span>
                            <span className="text-[9px] text-gray-400 ml-auto font-mono">{item.meta}</span>
                          </div>
                          <p className="text-[10px] text-gray-600 leading-snug line-clamp-1 pl-3">{item.subtitle}</p>
                          <div className="flex items-center gap-2 mt-0.5 pl-3 text-[9px] text-gray-400">
                            <span className="flex items-center gap-0.5"><MapPin size={8} />{item.location}</span>
                            {item.url && <span className="text-primary-500 ml-auto">↗</span>}
                          </div>
                        </RowTag>
                      );
                    })}
                  </div>
                </div>

                {/* ── CONTROLS: Multi-step relief request ───────── */}
                <div className={`w-full lg:w-1/2 lg:order-1 flex flex-col ${darkMode ? 'bg-[#111720]' : 'bg-white'}`}>
                  <div className="cc-panel-header bg-red-700 px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0">
                    {controlsTab && (
                      <button
                        type="button"
                        onClick={backToConcerns}
                        className="flex items-center gap-1 text-red-100 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors"
                      >
                        <ArrowLeft size={10} /> Back
                      </button>
                    )}
                    <Send size={11} className="text-red-200" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">
                      Controls{controlsTab === 'help' ? ' — Request Help' : controlsTab === 'incident' ? ' — Report Incident' : controlsTab === 'fundraiser' ? ' — Add Fundraiser' : controlsTab === 'offer' ? ' — Offer Help' : ''}
                    </span>
                  </div>
                  <div className={`flex-1 bg-[#0a0e14] min-h-0 ${controlsTab === null ? 'overflow-hidden flex flex-col' : 'overflow-y-auto cc-scroll'}`}>
                    {/* ── STEP 0: What do you want to do? ───────────── */}
                    {controlsTab === null && (
                      <div className="flex-1 min-h-0 flex flex-col p-2 gap-2">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Step 1 · Choose Action</div>
                        <div className="grid grid-cols-2 gap-1.5 flex-1 min-h-0">
                          {([
                            { key: 'help',       label: 'Request Help', tone: 'bg-red-600/15 border-red-500/40 text-red-200 hover:bg-red-600/25',         icon: <HandHelping size={18} /> },
                            { key: 'incident',   label: 'Report',       tone: 'bg-orange-600/15 border-orange-500/40 text-orange-200 hover:bg-orange-600/25', icon: <AlertTriangle size={18} /> },
                            { key: 'fundraiser', label: 'Fundraiser',   tone: 'bg-amber-600/15 border-amber-500/40 text-amber-200 hover:bg-amber-600/25',     icon: <BadgeAlert size={18} /> },
                            { key: 'offer',      label: 'Offer Help',   tone: 'bg-emerald-600/15 border-emerald-500/40 text-emerald-200 hover:bg-emerald-600/25', icon: <Shield size={18} /> },
                          ] as const).map(c => (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => setControlsTab(c.key)}
                              className={`px-2 py-1.5 rounded-md border flex items-center justify-center gap-1.5 transition-colors min-h-0 ${c.tone}`}
                            >
                              {c.icon}
                              <span className="font-bold uppercase tracking-widest text-[10px]">{c.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {controlsTab === 'help' && (submitSuccess ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 gap-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
                          <CheckCircle2 size={28} className="text-emerald-400" />
                        </div>
                        <div className="text-emerald-200 font-bold uppercase tracking-widest text-sm">Request submitted</div>
                        <p className="text-[12px] text-gray-300 leading-relaxed max-w-sm">
                          Your relief request is now in the BangonGensan triage queue.
                          A volunteer will reach out as soon as a responder is assigned.
                        </p>
                        <button
                          type="button"
                          onClick={resetRequestForm}
                          className="mt-3 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold uppercase tracking-widest"
                        >
                          Submit another request
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5">
                        {/* Step indicator */}
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3].map(n => (
                            <div
                              key={n}
                              className={`flex-1 h-0.5 rounded-full transition-colors ${n <= requestStep ? 'bg-red-500' : 'bg-gray-700'}`}
                            />
                          ))}
                        </div>

                        {requestStep === 1 && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Step 1 / 3 · Need Type</div>
                            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 sm:gap-1.5">
                              {NEED_TYPES.map(t => {
                                const compactIcon = (() => {
                                  switch (t.key) {
                                    case 'food': return <Utensils size={14} />;
                                    case 'water': return <Droplet size={14} />;
                                    case 'medicine': return <Pill size={14} />;
                                    case 'shelter': return <HomeIcon size={14} />;
                                    case 'rescue': return <LifeBuoy size={14} />;
                                  }
                                })();
                                return (
                                  <button
                                    key={t.key}
                                    type="button"
                                    onClick={() => { setFormNeedType(t.key); setRequestStep(2); }}
                                    className={`px-2 py-3 sm:px-1 sm:py-2 min-h-[64px] sm:min-h-0 rounded-md border flex flex-col items-center justify-center gap-1.5 sm:gap-1 transition-colors ${formNeedType === t.key ? 'ring-1 ring-red-400 ' : ''}${t.tone}`}
                                  >
                                    {compactIcon}
                                    <span className="font-bold uppercase tracking-wider text-xs sm:text-[9px]">{t.label}</span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {requestStep === 2 && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Step 2 / 3 · Location</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Barangay</span>
                                <select
                                  value={formBarangay}
                                  onChange={e => setFormBarangay(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                >
                                  <option value="">— Select —</option>
                                  {BARANGAY_NAMES.map(b => (
                                    <option key={b} value={b}>{b}</option>
                                  ))}
                                </select>
                              </label>
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Landmark <span className="text-gray-500 font-normal normal-case">(optional)</span></span>
                                <input
                                  type="text"
                                  value={formLandmark}
                                  onChange={e => setFormLandmark(e.target.value)}
                                  placeholder="e.g. beside Gaisano Mall"
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                              </label>
                            </div>
                          </div>
                        )}

                        {requestStep === 3 && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Step 3 / 3 · Contact</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Full name</span>
                                <input
                                  type="text"
                                  value={formFullName}
                                  onChange={e => setFormFullName(e.target.value)}
                                  placeholder="Juan Dela Cruz"
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                              </label>
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Contact number</span>
                                <input
                                  type="tel"
                                  value={formContact}
                                  onChange={e => setFormContact(e.target.value)}
                                  placeholder="09XX XXX XXXX"
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500"
                                />
                              </label>
                            </div>
                            {formNeedType && formBarangay && (
                              <div className="mt-2 p-2 rounded-md bg-[#0d1117] border border-gray-700 text-[10px] text-gray-300 flex items-center gap-3 flex-wrap">
                                <span><span className="text-gray-500 uppercase tracking-wider text-[9px] mr-1">Need</span>{NEED_META[formNeedType].label}</span>
                                <span className="text-gray-700">·</span>
                                <span><span className="text-gray-500 uppercase tracking-wider text-[9px] mr-1">Where</span>{formBarangay}{formLandmark ? ` — ${formLandmark}` : ''}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {submitError && (
                          <div className="mt-2 p-3 sm:p-2 rounded-md bg-red-900/40 border border-red-700/60 text-sm sm:text-[11px] text-red-100 sm:text-red-200 flex items-start gap-2 sm:gap-1.5 shadow-lg sm:shadow-none">
                            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" />
                            <span>{submitError}</span>
                          </div>
                        )}

                        {/* Navigation */}
                        <div className="mt-2.5 flex items-center gap-1.5">
                          {requestStep > 1 && (
                            <button
                              type="button"
                              onClick={() => { setSubmitError(null); setRequestStep((requestStep - 1) as 1 | 2 | 3); }}
                              className="px-4 py-2.5 sm:px-2.5 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest"
                            >
                              Back
                            </button>
                          )}
                          {requestStep === 2 && (
                            <button
                              type="button"
                              onClick={() => {
                                if (!formBarangay) { setSubmitError('Please select your barangay.'); return; }
                                setSubmitError(null);
                                setRequestStep(3);
                              }}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1"
                            >
                              Continue
                              <ArrowRight size={12} />
                            </button>
                          )}
                          {requestStep === 3 && (
                            <button
                              type="button"
                              disabled={submitting}
                              onClick={() => void submitBangonRequest()}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1"
                            >
                              {submitting ? 'Submitting…' : 'Submit Request'}
                              {!submitting && <Send size={14} />}
                            </button>
                          )}
                        </div>

                        <p className="mt-1.5 text-[9px] text-gray-500 leading-snug">
                          Contact details are visible only to BangonGensan volunteers handling triage.
                        </p>
                      </div>
                    ))}

                    {/* ── REPORT INCIDENT ────────────────────────── */}
                    {controlsTab === 'incident' && (incidentSuccess ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 gap-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
                          <CheckCircle2 size={28} className="text-emerald-400" />
                        </div>
                        <div className="text-emerald-200 font-bold uppercase tracking-widest text-sm">Incident reported</div>
                        <p className="text-[12px] text-gray-300 leading-relaxed max-w-sm">
                          Thank you. The BangonGensan team will review and verify before adding to the public map.
                        </p>
                        <button type="button" onClick={resetIncidentForm}
                          className="mt-3 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold uppercase tracking-widest">
                          Report another incident
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5">
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3].map(n => (
                            <div key={n} className={`flex-1 h-0.5 rounded-full transition-colors ${n <= incidentStep ? 'bg-red-500' : 'bg-gray-700'}`} />
                          ))}
                        </div>
                        {incidentStep === 1 && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Step 1 / 3 · Incident Type</div>
                            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-1.5">
                              {INCIDENT_TYPES.map(t => (
                                <button key={t.key} type="button"
                                  onClick={() => { setIncidentType(t.key); setIncidentStep(2); }}
                                  className={`px-2 py-3 sm:px-1 sm:py-2 min-h-[56px] sm:min-h-0 rounded-md border flex items-center justify-center gap-1 transition-colors ${incidentType === t.key ? 'ring-1 ring-red-400 ' : ''}${t.tone}`}>
                                  <span className="font-bold uppercase tracking-wider text-sm sm:text-[10px]">{t.label}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {incidentStep === 2 && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Step 2 / 3 · Where + What</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-2">
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Barangay</span>
                                <select value={incidentBarangay} onChange={e => setIncidentBarangay(e.target.value)}
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500">
                                  <option value="">— Select —</option>
                                  {BARANGAY_NAMES.map(b => <option key={b} value={b}>{b}</option>)}
                                </select>
                              </label>
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Landmark <span className="text-gray-500 font-normal normal-case">(optional)</span></span>
                                <input type="text" value={incidentLandmark} onChange={e => setIncidentLandmark(e.target.value)}
                                  placeholder="e.g. near Robinsons" className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                              </label>
                            </div>
                            <label className="block">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Description</span>
                              <textarea value={incidentDescription} onChange={e => setIncidentDescription(e.target.value)} rows={3}
                                placeholder="What happened? Who is affected?"
                                className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none" />
                            </label>
                          </div>
                        )}
                        {incidentStep === 3 && (
                          <div>
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Step 3 / 3 · Photo + Contact</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Photo <span className="text-gray-500 font-normal normal-case">(optional)</span></span>
                                <input type="file" accept="image/*"
                                  onChange={e => setIncidentPhoto(e.target.files?.[0] ?? null)}
                                  className="w-full text-[11px] text-gray-300 file:mr-2 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:bg-gray-700 file:text-white hover:file:bg-gray-600" />
                                {incidentPhoto && (
                                  <span className="block text-[10px] text-gray-500 mt-0.5 truncate">{incidentPhoto.name}</span>
                                )}
                              </label>
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Contact number</span>
                                <input type="tel" value={incidentContact} onChange={e => setIncidentContact(e.target.value)}
                                  placeholder="09XX XXX XXXX"
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                              </label>
                            </div>
                          </div>
                        )}
                        {incidentError && (
                          <div className="mt-2 p-3 sm:p-2 rounded-md bg-red-900/40 border border-red-700/60 text-sm sm:text-[11px] text-red-100 sm:text-red-200 flex items-start gap-2 sm:gap-1.5 shadow-lg sm:shadow-none">
                            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" /><span>{incidentError}</span>
                          </div>
                        )}
                        <div className="mt-2.5 flex items-center gap-1.5">
                          {incidentStep > 1 && (
                            <button type="button" onClick={() => { setIncidentError(null); setIncidentStep((incidentStep - 1) as 1 | 2 | 3); }}
                              className="px-4 py-2.5 sm:px-2.5 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest">Back</button>
                          )}
                          {incidentStep === 2 && (
                            <button type="button"
                              onClick={() => {
                                if (!incidentBarangay) { setIncidentError('Please select a barangay.'); return; }
                                if (!incidentDescription.trim()) { setIncidentError('Please describe what happened.'); return; }
                                setIncidentError(null); setIncidentStep(3);
                              }}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1">
                              Continue <ArrowRight size={12} />
                            </button>
                          )}
                          {incidentStep === 3 && (
                            <button type="button" disabled={incidentSubmitting} onClick={() => void submitIncident()}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1">
                              {incidentSubmitting ? 'Submitting…' : 'Submit Report'} {!incidentSubmitting && <Send size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* ── ADD FUNDRAISER ─────────────────────────── */}
                    {controlsTab === 'fundraiser' && (fundSuccess ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 gap-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
                          <CheckCircle2 size={28} className="text-emerald-400" />
                        </div>
                        <div className="text-emerald-200 font-bold uppercase tracking-widest text-sm">Pending Review</div>
                        <p className="text-[12px] text-gray-300 leading-relaxed max-w-sm">
                          Your fundraiser has been submitted for admin review.
                          It will appear publicly once approved.
                        </p>
                        <button type="button" onClick={resetFundForm}
                          className="mt-3 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold uppercase tracking-widest">
                          Submit another
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 space-y-2">
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3].map(n => (
                            <div key={n} className={`flex-1 h-0.5 rounded-full transition-colors ${n <= fundStep ? 'bg-red-500' : 'bg-gray-700'}`} />
                          ))}
                        </div>
                        {fundStep === 1 && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 1 / 3 · About</div>
                            <label className="block">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Title</span>
                              <input type="text" value={fundTitle} onChange={e => setFundTitle(e.target.value)}
                                placeholder="e.g. Help families in Brgy Calumpang"
                                className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            </label>
                            <label className="block">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Description</span>
                              <textarea value={fundDescription} onChange={e => setFundDescription(e.target.value)} rows={3}
                                placeholder="What is the money for? Who benefits?"
                                className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none" />
                            </label>
                          </div>
                        )}
                        {fundStep === 2 && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 2 / 3 · Goal & Payment</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Goal amount (₱)</span>
                                <input type="number" min="0" step="100" value={fundGoal} onChange={e => setFundGoal(e.target.value)} placeholder="50000"
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                              </label>
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">GCash / Bank</span>
                                <input type="text" value={fundPayment} onChange={e => setFundPayment(e.target.value)} placeholder="GCash 09XX XXX XXXX / BPI 1234..."
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                              </label>
                            </div>
                            <div className="text-[9px] text-amber-300/80 leading-snug">
                              The account name on the GCash / bank account <strong>must match the contact name</strong> you'll provide in the next step. Mismatched accounts will be rejected.
                            </div>
                          </div>
                        )}
                        {fundStep === 3 && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 3 / 3 · Verify</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Full name <span className="text-amber-300 normal-case font-normal">· must match GCash / bank</span></span>
                                <input type="text" value={fundContactName} onChange={e => setFundContactName(e.target.value)} placeholder="Juan Dela Cruz"
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                              </label>
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Contact number</span>
                                <input type="tel" value={fundContact} onChange={e => setFundContact(e.target.value)} placeholder="09XX XXX XXXX"
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                              </label>
                            </div>
                            <label className="block">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Facebook profile or post link</span>
                              <input type="url" value={fundFacebook} onChange={e => setFundFacebook(e.target.value)}
                                placeholder="https://facebook.com/juan.delacruz or https://facebook.com/.../posts/..."
                                className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                            </label>
                            <div className="text-[9px] text-amber-300/80 leading-snug">
                              Fundraiser will be queued for admin review. Approval requires the contact name, GCash / bank account name, and Facebook identity to match.
                            </div>
                          </div>
                        )}
                        {fundError && (
                          <div className="p-3 sm:p-2 rounded-md bg-red-900/40 border border-red-700/60 text-sm sm:text-[11px] text-red-100 sm:text-red-200 flex items-start gap-2 sm:gap-1.5 shadow-lg sm:shadow-none">
                            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" /><span>{fundError}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          {fundStep > 1 && (
                            <button type="button" onClick={() => { setFundError(null); setFundStep((fundStep - 1) as 1 | 2 | 3); }}
                              className="px-4 py-2.5 sm:px-2.5 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest">Back</button>
                          )}
                          {fundStep === 1 && (
                            <button type="button"
                              onClick={() => {
                                if (!fundTitle.trim()) { setFundError('Please enter a title.'); return; }
                                if (!fundDescription.trim()) { setFundError('Please describe the fundraiser.'); return; }
                                setFundError(null); setFundStep(2);
                              }}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1">
                              Continue <ArrowRight size={12} />
                            </button>
                          )}
                          {fundStep === 2 && (
                            <button type="button"
                              onClick={() => {
                                const g = Number(fundGoal);
                                if (!Number.isFinite(g) || g <= 0) { setFundError('Please enter a goal amount > 0.'); return; }
                                if (!fundPayment.trim()) { setFundError('Please add payment details.'); return; }
                                setFundError(null); setFundStep(3);
                              }}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1">
                              Continue <ArrowRight size={12} />
                            </button>
                          )}
                          {fundStep === 3 && (
                            <button type="button" disabled={fundSubmitting} onClick={() => void submitFundraiser()}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1">
                              {fundSubmitting ? 'Submitting…' : 'Submit for Review'} {!fundSubmitting && <Send size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* ── OFFER HELP ─────────────────────────────── */}
                    {controlsTab === 'offer' && (offerSuccess ? (
                      <div className="h-full flex flex-col items-center justify-center text-center px-6 py-10 gap-3">
                        <div className="w-14 h-14 rounded-full bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center">
                          <CheckCircle2 size={28} className="text-emerald-400" />
                        </div>
                        <div className="text-emerald-200 font-bold uppercase tracking-widest text-sm">Salamat!</div>
                        <p className="text-[12px] text-gray-300 leading-relaxed max-w-sm">
                          Your offer is now on the BangonGensan board. Volunteers will reach out to coordinate.
                        </p>
                        <button type="button" onClick={resetOfferForm}
                          className="mt-3 px-4 py-2 rounded-md bg-red-600 hover:bg-red-500 text-white text-[12px] font-bold uppercase tracking-widest">
                          Offer something else
                        </button>
                      </div>
                    ) : (
                      <div className="px-3 py-1.5 space-y-2">
                        <div className="flex items-center gap-1 mb-2">
                          {[1, 2, 3].map(n => (
                            <div key={n} className={`flex-1 h-0.5 rounded-full transition-colors ${n <= offerStep ? 'bg-red-500' : 'bg-gray-700'}`} />
                          ))}
                        </div>
                        {offerStep === 1 && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 1 / 3 · What can you offer?</div>
                            <div className="flex flex-wrap gap-1.5">
                              {OFFER_TAGS.map(tag => {
                                const active = offerTags.includes(tag);
                                return (
                                  <button key={tag} type="button" onClick={() => toggleOfferTag(tag)}
                                    className={`px-2.5 py-1 rounded-full border text-[10px] font-bold uppercase tracking-wider transition-colors ${active ? 'bg-red-600 text-white border-red-500' : 'bg-[#111720] text-gray-300 border-gray-700 hover:border-gray-500'}`}>
                                    {tag}
                                  </button>
                                );
                              })}
                            </div>
                            <label className="block">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Or describe in your own words</span>
                              <textarea value={offerDescription} onChange={e => setOfferDescription(e.target.value)} rows={2}
                                placeholder="e.g. Free hot meals at Brgy Lagao covered court 12–2 PM daily"
                                className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500 resize-none" />
                            </label>
                          </div>
                        )}
                        {offerStep === 2 && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 2 / 3 · Where</div>
                            <label className="block">
                              <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Barangay</span>
                              <select value={offerBarangay} onChange={e => setOfferBarangay(e.target.value)}
                                className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500">
                                <option value="">— Select —</option>
                                {BARANGAY_NAMES.map(b => <option key={b} value={b}>{b}</option>)}
                              </select>
                            </label>
                          </div>
                        )}
                        {offerStep === 3 && (
                          <div className="space-y-2">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Step 3 / 3 · Contact</div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Contact name</span>
                                <input type="text" value={offerContactName} onChange={e => setOfferContactName(e.target.value)} placeholder="Maria Santos"
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                              </label>
                              <label className="block">
                                <span className="block text-[9px] font-bold text-gray-400 uppercase tracking-widest mb-0.5">Contact number</span>
                                <input type="tel" value={offerContact} onChange={e => setOfferContact(e.target.value)} placeholder="09XX XXX XXXX"
                                  className="w-full px-2 py-1.5 rounded-md bg-[#111720] border border-gray-700 text-white text-[12px] placeholder:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-1 focus:ring-red-500" />
                              </label>
                            </div>
                          </div>
                        )}
                        {offerError && (
                          <div className="p-3 sm:p-2 rounded-md bg-red-900/40 border border-red-700/60 text-sm sm:text-[11px] text-red-100 sm:text-red-200 flex items-start gap-2 sm:gap-1.5 shadow-lg sm:shadow-none">
                            <AlertTriangle size={12} className="mt-0.5 flex-shrink-0" /><span>{offerError}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-1.5">
                          {offerStep > 1 && (
                            <button type="button" onClick={() => { setOfferError(null); setOfferStep((offerStep - 1) as 1 | 2 | 3); }}
                              className="px-4 py-2.5 sm:px-2.5 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-gray-700 hover:bg-gray-600 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest">Back</button>
                          )}
                          {offerStep === 1 && (
                            <button type="button"
                              onClick={() => {
                                if (offerTags.length === 0 && !offerDescription.trim()) {
                                  setOfferError('Pick at least one tag or describe your offer.');
                                  return;
                                }
                                setOfferError(null); setOfferStep(2);
                              }}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1">
                              Continue <ArrowRight size={12} />
                            </button>
                          )}
                          {offerStep === 2 && (
                            <button type="button"
                              onClick={() => {
                                if (!offerBarangay) { setOfferError('Please select a barangay.'); return; }
                                setOfferError(null); setOfferStep(3);
                              }}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1">
                              Continue <ArrowRight size={12} />
                            </button>
                          )}
                          {offerStep === 3 && (
                            <button type="button" disabled={offerSubmitting} onClick={() => void submitOffer()}
                              className="ml-auto px-4 py-2.5 sm:px-3 sm:py-1 min-h-[44px] sm:min-h-0 rounded-md bg-red-600 hover:bg-red-500 disabled:bg-red-900 disabled:cursor-not-allowed text-white text-xs sm:text-[10px] font-bold uppercase tracking-widest flex items-center gap-1.5 sm:gap-1">
                              {offerSubmitting ? 'Submitting…' : 'Post Offer'} {!offerSubmitting && <Send size={12} />}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>

          {/* ── RIGHT: Reports / Requests / Fundraisers (mobile-aware) ─── */}
          <aside className={`${mobileView === 'sidebar' ? 'fixed inset-0 z-30 flex w-full pb-20' : 'hidden lg:flex'} lg:relative lg:inset-auto lg:z-10 lg:flex flex-shrink-0 border-l flex-col cc-sidebar lg:w-80 ${darkMode ? 'bg-[#0d1117] border-[#1e2a3a]' : 'bg-gray-50 border-gray-200'}`}>
            {/* Horizontal tab bar */}
            <div className="flex items-stretch border-b border-[#1e2a3a] bg-[#0a0e14] flex-shrink-0">
              {([
                { key: 'reports', label: 'Reports', icon: <FileText size={11} /> },
                { key: 'requests', label: 'Requests', icon: <HandHelping size={11} /> },
                { key: 'fundraisers', label: 'Fundraisers', icon: <BadgeAlert size={11} /> },
              ] as const).map(t => (
                <button
                  key={t.key}
                  onClick={() => setRightTab(t.key)}
                  className={`flex-1 px-2 py-2 flex items-center justify-center gap-1 text-[10px] font-bold uppercase tracking-widest border-r border-[#1e2a3a] last:border-r-0 transition-colors ${rightTab === t.key ? 'bg-primary-700 text-white' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
                >
                  {t.icon}
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>
            {/* Active tab content */}
            <div className="flex-1 flex flex-col min-w-0">
                  <div key={rightTab} className="flex-1 overflow-y-auto cc-scroll bg-anim-fade-up">
                    {/* ── REPORTS TAB ─────────────────────────────── */}
                    {/* Shows admin-verified user-submitted incident reports (bangon_incidents).
                        Loaded via loadBangonIncidents() which filters verified=true. */}
                    {rightTab === 'reports' && (
                      <div className="p-2.5 space-y-1.5">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <FileText size={9} />
                          Verified Incident Reports
                          <span className="ml-auto text-[9px] text-gray-500 font-normal normal-case tracking-normal">
                            {bangonIncidentRows.length} verified
                          </span>
                        </div>
                        {bangonIncidentRows.length === 0 && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-500 text-center">
                            No verified incident reports yet. Submissions show here after an admin verifies them.
                          </div>
                        )}
                        {bangonIncidentRows.slice(0, 60).map(r => {
                          const meta = INCIDENT_TYPES.find(t => t.key === r.incident_type);
                          const markerId = `rpt-${r.id}`;
                          const isHighlighted = highlightedMarkerId === markerId;
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => flyToMarker(markerId)}
                              className={`block w-full text-left p-2 bg-white border rounded transition-colors cursor-pointer ${isHighlighted ? 'border-yellow-400 ring-2 ring-yellow-300 bg-yellow-50/60' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/40'}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 border border-emerald-200">
                                  Verified
                                </span>
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-700">
                                  {meta?.label ?? r.incident_type}
                                </span>
                                <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-gray-100 text-gray-600 capitalize">
                                  {r.status}
                                </span>
                                <span className="ml-auto text-[8px] text-gray-400 font-mono">
                                  {new Date(r.created_at).toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <p className="text-[10px] text-gray-700 leading-snug line-clamp-3">{r.description}</p>
                              <div className="mt-1 flex items-center gap-2 text-[9px] text-gray-400">
                                <span className="flex items-center gap-0.5"><MapPin size={8} />{r.barangay}{r.landmark ? ` · ${r.landmark}` : ''}</span>
                                {r.photo_url && (
                                  <a
                                    href={r.photo_url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    onClick={e => e.stopPropagation()}
                                    className="ml-auto text-primary-500 hover:underline"
                                  >photo ↗</a>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded text-[9px] text-emerald-700 flex items-start gap-1 mt-2">
                          <AlertTriangle size={9} className="mt-0.5 flex-shrink-0" />
                          <span>Only admin-verified reports appear here. Unverified submissions are reviewed in the BangonGensan admin panel before publishing.</span>
                        </div>
                      </div>
                    )}

                    {/* ── REQUESTS (TRIAGE) TAB ───────────────────── */}
                    {rightTab === 'requests' && (
                      <div className="p-2.5 space-y-1.5">
                        <div className="flex items-center gap-1 mb-1">
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                            <HandHelping size={9} />
                            Relief Requests
                          </div>
                          <span className="ml-auto text-[9px] text-gray-500">{bangonRequests.length} total</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <span className="text-[9px] text-gray-400 uppercase tracking-wider">Sort</span>
                          {(['time', 'need', 'barangay'] as const).map(s => (
                            <button
                              key={s}
                              onClick={() => setTriageSort(s)}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider transition-colors ${triageSort === s ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                              {s}
                            </button>
                          ))}
                          <button
                            onClick={() => void loadBangonRequests()}
                            className="ml-auto px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            Refresh
                          </button>
                        </div>
                        {triageError && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-[10px] text-red-700">
                            {triageError}
                          </div>
                        )}
                        {sortedTriage.length === 0 && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-500 text-center">
                            No relief requests yet. New submissions will appear here in real time.
                          </div>
                        )}
                        {sortedTriage.map(req => {
                          const need = NEED_META[req.need_type];
                          const status = STATUS_META[req.status];
                          const created = new Date(req.created_at);
                          const markerId = `req-${req.id}`;
                          const isHighlighted = highlightedMarkerId === markerId;
                          return (
                            <div
                              key={req.id}
                              onClick={() => flyToMarker(markerId)}
                              role="button"
                              tabIndex={0}
                              onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') flyToMarker(markerId); }}
                              className={`p-2 bg-white border rounded cursor-pointer transition-colors ${isHighlighted ? 'border-yellow-400 ring-2 ring-yellow-300 bg-yellow-50/60' : req.status === 'pending' ? 'border-amber-300 hover:border-amber-400 hover:bg-amber-50/40' : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'}`}
                            >
                              <div className="flex items-center gap-1.5 mb-1">
                                <span className={`flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded border ${need.color}`}>
                                  {need.icon}{need.label}
                                </span>
                                <span className="text-[8px] text-gray-400 font-mono ml-auto flex items-center gap-0.5">
                                  <Clock size={8} />
                                  {created.toLocaleString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                </span>
                              </div>
                              <div className="text-[11px] font-bold text-gray-900 leading-snug truncate">{req.full_name}</div>
                              <div className="text-[10px] text-gray-600 flex items-center gap-1">
                                <MapPin size={9} className="flex-shrink-0 text-gray-400" />
                                <span className="truncate">{req.barangay}{req.landmark ? ` — ${req.landmark}` : ''}</span>
                              </div>
                              <div className="text-[10px] text-gray-500 font-mono">{req.contact_number}</div>
                              <button
                                onClick={e => { e.stopPropagation(); void advanceStatus(req); }}
                                className={`mt-1.5 w-full px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1 ${status.color}`}
                              >
                                {req.status === 'fulfilled' ? <CheckCircle2 size={11} /> : <ArrowRight size={11} />}
                                {status.label}
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {/* ── FUNDRAISERS TAB ─────────────────────────── */}
                    {rightTab === 'fundraisers' && (
                      <div className="p-2.5 space-y-1.5">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                          <BadgeAlert size={9} />
                          Approved Fundraisers
                          <span className="ml-auto text-[9px] text-gray-500 font-normal normal-case tracking-normal">
                            {fundraisers.length} active
                          </span>
                        </div>
                        {fundraisersError && (
                          <div className="p-2 bg-red-50 border border-red-200 rounded text-[10px] text-red-700">{fundraisersError}</div>
                        )}
                        {fundraisers.length === 0 && !fundraisersError && (
                          <div className="p-3 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-500 text-center">
                            No approved fundraisers yet.
                          </div>
                        )}
                        {fundraisers.map(f => {
                          const paymentIsUrl = /^https?:\/\//i.test(f.payment_details);
                          return (
                          <div key={f.id} className="p-2.5 bg-white border border-gray-200 rounded bg-anim-fade-up">
                            <div className="flex items-start gap-1.5 mb-1">
                              <span className="text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-100 text-amber-700 border border-amber-200">
                                Approved
                              </span>
                              <span className="text-[8px] text-gray-400 font-mono ml-auto">
                                {new Date(f.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="text-[12px] font-bold text-gray-900 leading-snug">{f.title}</div>
                            <p className="text-[11px] text-gray-700 leading-snug mt-0.5">{f.description}</p>
                            <div className="mt-1.5 grid grid-cols-1 gap-0.5 text-[10px] text-gray-700">
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] uppercase tracking-widest text-gray-400 w-14">Goal</span>
                                <span className="font-bold text-emerald-700">₱{Number(f.goal_amount).toLocaleString('en-PH')}</span>
                              </div>
                              <div className="flex items-start gap-1.5">
                                <span className="text-[8px] uppercase tracking-widest text-gray-400 w-14 mt-0.5">Pay to</span>
                                {paymentIsUrl ? (
                                  <a href={f.payment_details} target="_blank" rel="noopener noreferrer"
                                    className="text-primary-700 hover:text-primary-900 underline underline-offset-2 break-all">
                                    {f.payment_details}
                                  </a>
                                ) : (
                                  <span className="break-all">{f.payment_details}</span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5">
                                <span className="text-[8px] uppercase tracking-widest text-gray-400 w-14">Contact</span>
                                <span>{f.contact_name} · <span className="font-mono">{f.contact_number}</span></span>
                              </div>
                              {f.facebook_url && (
                                <div className="flex items-center gap-1.5">
                                  <span className="text-[8px] uppercase tracking-widest text-gray-400 w-14">Verify</span>
                                  <a href={f.facebook_url} target="_blank" rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[#1877f2] hover:text-[#0c5dc9] underline underline-offset-2 break-all">
                                    Facebook ↗
                                  </a>
                                </div>
                              )}
                            </div>
                          </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
            </div>
          </aside>

          {/* ── MOBILE: global view toggle (safe-area aware) ────────── */}
          <div
            className="lg:hidden fixed left-1/2 -translate-x-1/2 z-[60] bg-gray-900/95 backdrop-blur rounded-full shadow-xl border border-gray-700/60 flex overflow-hidden"
            style={{ bottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}
          >
            {([
              { key: 'map',      label: 'Map',      icon: <MapPin size={14} /> },
              { key: 'chat',     label: 'Chat',     icon: <Users size={14} /> },
              { key: 'controls', label: 'Submit',   icon: <Send size={14} /> },
              { key: 'sidebar',  label: 'Board',    icon: <FileText size={14} /> },
            ] as const).map(m => (
              <button
                key={m.key}
                onClick={() => setMobileView(m.key)}
                className={`min-h-[44px] px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 ${mobileView === m.key ? 'bg-red-600 text-white' : 'text-gray-400 active:bg-white/5'}`}
              >
                {m.icon}<span className="hidden xs:inline sm:inline">{m.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
