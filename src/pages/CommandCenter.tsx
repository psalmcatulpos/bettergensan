// /command-center — Public Safety Command Center
//
// Full-page operational monitoring interface. 3D MapLibre GL map with
// building extrusions, heatmap, clustering. Embedded control surfaces,
// floating overlays, live feed, and intelligence panels.

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
  Brain,
  Users,
  Flame,
  Car,
  Siren,
  Search as SearchIcon,
  BadgeAlert,
  CircleDot,
  Thermometer,
  Calendar,
  Moon,
  Sun,
  Crosshair,
  Zap,
  BarChart3,
  Signal,
  Target,
  Waves,
  Lock,
} from 'lucide-react';
import { Helmet } from 'react-helmet-async';
import ApexChart from 'react-apexcharts';
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

const OCEAN_GROUP_ICONS: Record<string, string> = {
  Productivity: '🐟',
  Physics: '🌊',
  Conditions: '💨',
};

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

const INFRA_POI_GROUPS = [...new Set(INFRA_POI_CATEGORIES.map(c => c.group))];

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

const INFRA_GROUP_ICONS: Record<string, string> = {
  Government: '🏛️',
  Security: '🚓',
  Logistics: '🚢',
  Air: '✈️',
  Services: '🏥',
  Utilities: '⚡',
};

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

const categoryIconMap: Record<string, React.FC<{ size: number; className?: string }>> = {
  Theft: SearchIcon,
  Assault: BadgeAlert,
  'Drug-related': Shield,
  Vehicular: Car,
  Fire: Flame,
  Disturbance: Siren,
  'Missing Person': Users,
  'Natural Disaster': AlertTriangle,
  'Public Health': Activity,
  'Government Advisory': Shield,
  Other: MapPin,
};

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

const riskColor = {
  low: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  medium: 'bg-amber-50 text-amber-700 border-amber-200',
  high: 'bg-red-50 text-red-700 border-red-200',
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


// ── ApexCharts wrappers ──────────────────────────────────────────────

function TrendChart({ data, window: w }: { data: number[]; window: string }) {
  const labels = useMemo(() => {
    if (w === '24h') return data.map((_, i) => `${23 - i}h`);
    if (w === '7d') return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    return data.map((_, i) => `D${i + 1}`);
  }, [data, w]);

  const opts: ApexCharts.ApexOptions = useMemo(() => ({
    chart: { sparkline: { enabled: true }, animations: { enabled: true, easing: 'easeinout' as const, speed: 400 } },
    stroke: { curve: 'smooth' as const, width: 2, colors: ['#0066eb'] },
    fill: { type: 'gradient' as const, gradient: { shadeIntensity: 1, opacityFrom: 0.15, opacityTo: 0.02, stops: [0, 100] } },
    colors: ['#0066eb'],
    tooltip: { enabled: true, theme: 'dark' as const, x: { show: true }, y: { formatter: (v: number) => `${v} signals` }, style: { fontSize: '10px' } },
    xaxis: { categories: labels },
  }), [labels]);

  return <ApexChart type="area" height={90} series={[{ name: 'Signals', data }]} options={opts} />;
}

// ── Main component ──────────────────────────────────────────────────

export default function CommandCenter() {
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
  const [trendWindow, setTrendWindow] = useState<'24h' | '7d' | '30d'>('24h');
  const [mapReady, setMapReady] = useState(false);
  const [mobileView, setMobileView] = useState<'map' | 'layers' | 'intel'>('map');
  const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({ Incidents: false, Infrastructure: false, 'Hazard Maps': false, 'Population': false, 'Ocean': false, 'Tracking': false, 'Critical Infra': false });
  const [showInfra, setShowInfra] = useState(false);
  const [infraStatuses, setInfraStatuses] = useState<Record<InfraStatus, boolean>>({
    Completed: false, 'On-Going': false, 'For Procurement': false, 'Not Yet Started': false,
  });
  const [infraProjects, setInfraProjects] = useState<InfrastructureProjectRow[]>([]);
  const [safetyReports, setSafetyReports] = useState<SafetyReportRow[]>([]);
  // Timeline: range as 0-1 fractions of the selected window
  const [timelineWindow, setTimelineWindow] = useState<'24h' | '7d' | '30d' | '90d'>('30d');
  const [timelineRange, setTimelineRange] = useState<[number, number]>([0, 1]);
  const [timelineOpen, setTimelineOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [hazardLayers, setHazardLayers] = useState<Record<HazardLayerKey, boolean>>(
    () => Object.fromEntries(HAZARD_LAYERS.map(l => [l.key, false])) as Record<HazardLayerKey, boolean>,
  );
  const [popMode, setPopMode] = useState<'off' | 'visual' | 'analyst'>('off');
  const [showBarangays, setShowBarangays] = useState(true);
  const [oceanLayers, setOceanLayers] = useState<Record<OceanLayerKey, boolean>>(
    () => Object.fromEntries(OCEAN_LAYERS.map(l => [l.key, false])) as Record<OceanLayerKey, boolean>,
  );
  const [oceanOpacity, setOceanOpacity] = useState<Record<OceanLayerKey, number>>(
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

  // Dynamic trend data computed from real incidents
  const trendData = useMemo(() => {
    const now = Date.now();
    const buckets = trendWindow === '24h' ? 24 : trendWindow === '7d' ? 7 : 30;
    const bucketMs = trendWindow === '24h' ? 3600000 : 86400000;
    const data = new Array(buckets).fill(0);
    filteredIncidents.forEach(i => {
      if (!i.postedAt) return;
      const age = now - new Date(i.postedAt).getTime();
      const bucket = Math.floor(age / bucketMs);
      if (bucket >= 0 && bucket < buckets) data[buckets - 1 - bucket]++;
    });
    // If all zeros (no data in window), show at least the total spread evenly
    if (data.every(d => d === 0) && filteredIncidents.length > 0) {
      const avg = Math.max(1, Math.round(filteredIncidents.length / buckets));
      return data.map(() => avg);
    }
    return data;
  }, [filteredIncidents, trendWindow]);

  // Dynamic category trends — compare current window vs prior equivalent window
  const categoryTrends = useMemo(() => {
    const now = Date.now();
    const windowMs = { '24h': 86400000, '7d': 604800000, '30d': 2592000000 }[trendWindow];
    const currentStart = now - windowMs;
    const prevStart = currentStart - windowMs;

    const trends: Record<string, { dir: 'up' | 'down' | 'stable'; delta: string }> = {};
    const allCats = Object.keys(categoryColor) as IncidentCategory[];

    for (const cat of allCats) {
      const current = mappedIncidents.filter(i =>
        i.category === cat && i.postedAt && new Date(i.postedAt).getTime() >= currentStart,
      ).length;
      const prev = mappedIncidents.filter(i =>
        i.category === cat && i.postedAt &&
        new Date(i.postedAt).getTime() >= prevStart &&
        new Date(i.postedAt).getTime() < currentStart,
      ).length;

      if (prev === 0 && current === 0) {
        trends[cat] = { dir: 'stable', delta: '—' };
      } else if (prev === 0) {
        trends[cat] = { dir: current > 0 ? 'up' : 'stable', delta: current > 0 ? 'new' : '—' };
      } else {
        const pctChange = Math.round(((current - prev) / prev) * 100);
        trends[cat] = {
          dir: pctChange > 0 ? 'up' : pctChange < 0 ? 'down' : 'stable',
          delta: `${pctChange >= 0 ? '+' : ''}${pctChange}%`,
        };
      }
    }
    return trends;
  }, [mappedIncidents, trendWindow]);

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

  const activeLayerCount = Object.values(layers).filter(Boolean).length + Object.values(hazardLayers).filter(Boolean).length + (popMode !== 'off' ? 1 : 0) + PHASE1_OCEAN.filter(l => oceanLayers[l.key]).length + (showFlights ? 1 : 0) + (showShips ? 1 : 0) + Object.values(infraPOI).filter(Boolean).length;

  // Dynamic category distribution from real data
  const categoryDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIncidents.forEach(i => {
      const cat = i.category || 'Other';
      counts[cat] = (counts[cat] || 0) + 1;
    });
    const total = filteredIncidents.length || 1;
    return Object.entries(counts)
      .map(([category, count]) => ({
        category: category as IncidentCategory,
        count,
        pct: Math.round((count / total) * 100),
      }))
      .sort((a, b) => b.count - a.count);
  }, [filteredIncidents]);
  const anyIncidentsOn = Object.values(layers).some(Boolean);
  const anyInfraOn = showInfra && Object.values(infraStatuses).some(Boolean);

  // Dynamic barangay risk table (computed from real incidents)
  const barangayRisks = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredIncidents.forEach(i => {
      if (i.barangay && i.barangay !== 'Unknown') counts[i.barangay] = (counts[i.barangay] || 0) + 1;
    });
    return Object.entries(counts)
      .map(([name, count]) => ({
        name,
        count,
        risk: count >= 3 ? 'high' as const : count >= 2 ? 'medium' as const : 'low' as const,
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  }, [filteredIncidents]);

  // Dynamic high-severity count
  const highSeverityCount = useMemo(() => filteredIncidents.filter(i => i.severity === 'high').length, [filteredIncidents]);

  // Unified feed items
  interface FeedItem {
    id: string;
    type: 'incident' | 'infra' | 'flight' | 'poi';
    title: string;
    subtitle: string;
    location: string;
    meta: string;
    dotColor: string;
    dotClass?: string;
    url?: string;
  }

  const unifiedFeed = useMemo<FeedItem[]>(() => {
    const items: FeedItem[] = [];
    if (anyIncidentsOn) {
      filteredIncidents.forEach(inc => {
        items.push({
          id: `inc-${inc.id}`,
          type: 'incident',
          title: inc.category,
          subtitle: inc.summary,
          location: inc.barangay,
          meta: inc.timestamp,
          dotColor: categoryColor[inc.category],
          dotClass: severityDot[inc.severity],
          url: inc.url,
        });
      });
    }
    if (anyInfraOn) {
      filteredInfraProjects.slice(0, 30).forEach(p => {
        const status = normalizeInfraStatus(p.status);
        items.push({
          id: `infra-${p.id}`,
          type: 'infra',
          title: status,
          subtitle: p.title.length > 80 ? p.title.slice(0, 80) + '…' : p.title,
          location: p.barangay || p.city_municipality || 'GenSan',
          meta: p.budget_amount ? `₱${(p.budget_amount / 1e6).toFixed(1)}M` : '',
          dotColor: infraStatusColor[status],
        });
      });
    }
    if (showFlights) {
      aircraft.filter(a => a.alt !== 'ground').slice(0, 15).forEach(a => {
        items.push({
          id: `flt-${a.hex}`,
          type: 'flight',
          title: a.flight || a.hex,
          subtitle: `${a.desc || a.type || 'Aircraft'} · ${typeof a.alt === 'number' ? `${a.alt.toLocaleString()} ft` : 'GND'} · ${Math.round(a.gs)} kts`,
          location: a.registration || a.hex,
          meta: 'LIVE',
          dotColor: '#f59e0b',
        });
      });
    }
    if (anyInfraPOIOn) {
      filteredInfraPOIData.slice(0, 20).forEach(p => {
        const cat = INFRA_POI_CATEGORIES.find(c => c.key === p.category);
        items.push({
          id: `poi-${p.id}`,
          type: 'poi',
          title: p.name || cat?.label || p.category,
          subtitle: cat?.label || p.category,
          location: p.tags['addr:street'] || 'GenSan',
          meta: p.tags.phone || '',
          dotColor: cat?.color || '#6b7280',
        });
      });
    }
    return items;
  }, [anyIncidentsOn, anyInfraOn, showFlights, anyInfraPOIOn, filteredIncidents, filteredInfraProjects, aircraft, filteredInfraPOIData]);

  // Infra status distribution for analysis panel
  const infraStatusDistribution = useMemo(() => {
    const counts: Record<string, number> = {};
    filteredInfraProjects.forEach(p => {
      const s = normalizeInfraStatus(p.status);
      counts[s] = (counts[s] || 0) + 1;
    });
    const total = filteredInfraProjects.length || 1;
    return INFRA_STATUSES.map(s => ({
      status: s,
      count: counts[s] || 0,
      pct: Math.round(((counts[s] || 0) / total) * 100),
    }));
  }, [filteredInfraProjects]);

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
      <Helmet>
        <title>Command Center — BetterGenSan</title>
        <meta name="description" content="Public safety command center for General Santos City — situational overview, incident monitoring, and community safety signals." />
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
            BETTERGENSAN
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

          {/* ── LEFT: LAYERS CONSOLE (hidden on mobile) ─────────── */}
          <aside className={`hidden lg:flex flex-shrink-0 border-r flex-col transition-all z-10 cc-sidebar ${layerPanelOpen ? 'w-52' : 'w-10'} ${darkMode ? 'bg-[#0d1117] border-[#1e2a3a]' : 'bg-gray-50 border-gray-200'}`}>
            <button
              onClick={() => setLayerPanelOpen(!layerPanelOpen)}
              className="bg-primary-700 px-2.5 py-2 flex items-center gap-1.5 text-white text-[10px] font-bold uppercase tracking-widest flex-shrink-0 hover:bg-primary-600 transition-colors"
            >
              <Layers size={12} />
              {layerPanelOpen && <span className="flex-1 text-left">Layers</span>}
              {layerPanelOpen ? <ChevronUp size={11} /> : <ChevronDown size={11} />}
            </button>

            {layerPanelOpen && (
              <div className="flex-1 overflow-y-auto cc-scroll text-[11px]">
                <div className="px-3 py-2.5 border-b border-gray-200">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">Map</div>
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors">
                      <input type="checkbox" checked={showBarangays} onChange={() => setShowBarangays(!showBarangays)} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" />
                      <Layers size={11} className="text-blue-500" />
                      <span className="font-medium">Barangays</span>
                      <span className="ml-auto text-[9px] text-gray-400">{showBarangays ? 'ON' : 'OFF'}</span>
                    </label>
                  </div>
                </div>

                {/* Incidents dropdown */}
                {(() => {
                  const allCats = Object.keys(layers) as IncidentCategory[];
                  const allOn = allCats.every(c => layers[c]);
                  const someOn = allCats.some(c => layers[c]);
                  const expanded = expandedGroups['Incidents'];
                  return (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedGroups(p => ({ ...p, Incidents: !p.Incidents }))}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={allOn}
                          ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                          onChange={e => {
                            e.stopPropagation();
                            const next = !allOn;
                            setLayers(p => {
                              const updated = { ...p };
                              allCats.forEach(c => { updated[c] = next; });
                              return updated;
                            });
                          }}
                          onClick={e => e.stopPropagation()}
                          className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                        />
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Incidents</span>
                        <span className="text-[9px] text-gray-400">{allCats.filter(c => layers[c]).length}/{allCats.length}</span>
                        <ChevronDown size={10} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="px-3 pb-2 space-y-0.5">
                          {allCats.map(cat => (
                            <label key={cat} className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                              <input type="checkbox" checked={layers[cat]} onChange={() => setLayers(p => ({ ...p, [cat]: !p[cat] }))} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3" />
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColor[cat] }} />
                              <span className="font-medium flex-1">{cat}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Infrastructure dropdown (bisto.ph) */}
                {(() => {
                  const allOn = INFRA_STATUSES.every(s => infraStatuses[s]);
                  const someOn = INFRA_STATUSES.some(s => infraStatuses[s]);
                  const expanded = expandedGroups['Infrastructure'];
                  return (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedGroups(p => ({ ...p, Infrastructure: !p.Infrastructure }))}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={showInfra && allOn}
                          ref={el => { if (el) el.indeterminate = showInfra && someOn && !allOn; }}
                          onChange={e => {
                            e.stopPropagation();
                            if (showInfra && allOn) {
                              setShowInfra(false);
                            } else {
                              setShowInfra(true);
                              setInfraStatuses({ Completed: true, 'On-Going': true, 'For Procurement': true, 'Not Yet Started': true });
                            }
                          }}
                          onClick={e => e.stopPropagation()}
                          className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                        />
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Infrastructure</span>
                        <span className="text-[9px] text-gray-400">
                          {INFRA_STATUSES.filter(s => infraStatuses[s]).length}/{INFRA_STATUSES.length}
                        </span>
                        <ChevronDown size={10} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="px-3 pb-2 space-y-0.5">
                          {INFRA_STATUSES.map(status => (
                            <label key={status} className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                              <input
                                type="checkbox"
                                checked={infraStatuses[status]}
                                onChange={() => {
                                  setInfraStatuses(p => ({ ...p, [status]: !p[status] }));
                                  if (!showInfra) setShowInfra(true);
                                }}
                                className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                              />
                              <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: infraStatusColor[status] }} />
                              <span className="font-medium flex-1">{status}</span>
                            </label>
                          ))}
                          <div className="ml-2 mt-1 text-[9px] text-gray-400 flex items-center gap-1">
                            <span>Source:</span>
                            <span className="text-primary-600 font-medium">bisto.ph</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Hazard Maps dropdown (Project NOAH) */}
                {(() => {
                  const activeCount = HAZARD_LAYERS.filter(l => hazardLayers[l.key]).length;
                  const allOn = HAZARD_LAYERS.every(l => hazardLayers[l.key]);
                  const someOn = activeCount > 0;
                  const expanded = expandedGroups['Hazard Maps'];
                  const groups = [...new Set(HAZARD_LAYERS.map(l => l.group))];
                  return (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedGroups(p => ({ ...p, 'Hazard Maps': !p['Hazard Maps'] }))}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={allOn}
                          ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                          onChange={e => {
                            e.stopPropagation();
                            const next = !allOn;
                            setHazardLayers(p => {
                              const updated = { ...p };
                              HAZARD_LAYERS.forEach(l => { updated[l.key] = next; });
                              return updated;
                            });
                          }}
                          onClick={e => e.stopPropagation()}
                          className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                        />
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Hazard Maps</span>
                        <span className="text-[9px] text-gray-400">{activeCount}/{HAZARD_LAYERS.length}</span>
                        <ChevronDown size={10} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="px-3 pb-2 space-y-1">
                          {groups.map(group => {
                            const items = HAZARD_LAYERS.filter(l => l.group === group).slice().reverse();
                            return (
                              <div key={group}>
                                <div className="flex items-center gap-1.5 ml-2 mb-0.5">
                                  <span className="text-[10px]">{HAZARD_GROUP_ICONS[group]}</span>
                                  <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{group}</span>
                                </div>
                                {items.map(layer => (
                                  <label key={layer.key} className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-4">
                                    <input
                                      type="checkbox"
                                      checked={hazardLayers[layer.key]}
                                      onChange={() => setHazardLayers(p => ({ ...p, [layer.key]: !p[layer.key] }))}
                                      className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                                    />
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: `linear-gradient(135deg, ${layer.colors[0]}, ${layer.colors[2]})` }} />
                                    <span className="font-medium flex-1">{layer.label}</span>
                                  </label>
                                ))}
                              </div>
                            );
                          })}
                          <div className="ml-2 mt-1 text-[9px] text-gray-400 flex items-center gap-1">
                            <span>Source:</span>
                            <span className="text-primary-600 font-medium">Project NOAH</span>
                          </div>
                          <div className="ml-2 flex items-center gap-2 text-[9px] text-gray-400">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#93c5fd' }} />Low</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />Med</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#1d4ed8' }} />High</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Population Density dropdown (Meta HRSL) */}
                {(() => {
                  const expanded = expandedGroups['Population'];
                  const isOn = popMode !== 'off';
                  return (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedGroups(p => ({ ...p, Population: !p.Population }))}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={isOn}
                          onChange={e => { e.stopPropagation(); setPopMode(isOn ? 'off' : 'visual'); }}
                          onClick={e => e.stopPropagation()}
                          className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                        />
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Population</span>
                        <span className="text-[9px] text-gray-400">{popMode !== 'off' ? 1 : 0}/2</span>
                        <ChevronDown size={10} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="px-3 pb-2 space-y-1">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                            <input type="radio" name="pop-mode" checked={popMode === 'visual'} onChange={() => setPopMode('visual')} className="h-3 w-3 text-primary-600 focus:ring-primary-500" />
                            <Thermometer size={11} className="text-green-500" />
                            <span className="font-medium flex-1">Visual</span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                            <input type="radio" name="pop-mode" checked={popMode === 'analyst'} onChange={() => setPopMode('analyst')} className="h-3 w-3 text-primary-600 focus:ring-primary-500" />
                            <BarChart3 size={11} className="text-green-600" />
                            <span className="font-medium flex-1">Analyst</span>
                          </label>
                          {popMode === 'analyst' && (
                            <div className="ml-4 mt-0.5 space-y-0.5">
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-[#d9f99d]" />&lt;500/km²
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-[#4ade80]" />500–2k
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-[#facc15]" />2k–3.5k
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-[#f97316]" />3.5k–4.5k
                              </div>
                              <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                <span className="w-2 h-2 rounded-full bg-[#ef4444]" />4.5k+
                              </div>
                            </div>
                          )}
                          {popMode === 'visual' && (
                            <div className="ml-2 mt-1 flex items-center gap-1 text-[9px] text-gray-400">
                              <span>Sparse</span>
                              <div className="flex-1 h-1.5 rounded-full bg-gradient-to-r from-lime-200 via-green-400 via-yellow-400 via-orange-500 to-red-700" />
                              <span>Dense</span>
                            </div>
                          )}
                          <div className="ml-2 mt-0.5 text-[9px] text-gray-400 flex items-center gap-1">
                            <span>Source:</span>
                            <span className="text-primary-600 font-medium">Meta HRSL / HDX</span>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Marine Analytics dropdown */}
                {(() => {
                  const phase1 = PHASE1_OCEAN;
                  const phase2 = OCEAN_LAYERS.filter(l => l.phase >= 2);
                  const activeCount = phase1.filter(l => oceanLayers[l.key]).length;
                  const allOn = phase1.every(l => oceanLayers[l.key]);
                  const someOn = activeCount > 0;
                  const expanded = expandedGroups['Ocean'];
                  const groups = [...new Set(OCEAN_LAYERS.map(l => l.group))];
                  // Yesterday's date for data freshness display
                  // Show the most recent data date across active layers
                  const maxLag = Math.max(...phase1.map(l => l.dateLagDays ?? 2));
                  const gibsDisplay = new Date();
                  gibsDisplay.setDate(gibsDisplay.getDate() - maxLag);
                  const gibsDateLabel = gibsDisplay.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
                  return (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedGroups(p => ({ ...p, Ocean: !p.Ocean }))}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={allOn}
                          ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                          onChange={e => {
                            e.stopPropagation();
                            const next = !allOn;
                            setOceanLayers(p => {
                              const updated = { ...p };
                              phase1.forEach(l => { updated[l.key] = next; });
                              return updated;
                            });
                          }}
                          onClick={e => e.stopPropagation()}
                          className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                        />
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Marine Analytics</span>
                        <span className="text-[9px] text-gray-400">{activeCount}/{phase1.length}</span>
                        <ChevronDown size={10} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="px-3 pb-2 space-y-1">
                          {groups.map(group => {
                            const p1Items = phase1.filter(l => l.group === group);
                            const p2Items = phase2.filter(l => l.group === group);
                            if (p1Items.length === 0 && p2Items.length === 0) return null;
                            return (
                              <div key={group}>
                                <div className="flex items-center gap-1.5 ml-2 mb-0.5">
                                  <span className="text-[10px]">{OCEAN_GROUP_ICONS[group]}</span>
                                  <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{group}</span>
                                </div>
                                {/* Phase 1: interactive */}
                                {p1Items.map(layer => (
                                  <label key={layer.key} className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-4">
                                    <input
                                      type="checkbox"
                                      checked={oceanLayers[layer.key]}
                                      onChange={() => setOceanLayers(p => ({ ...p, [layer.key]: !p[layer.key] }))}
                                      className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                                    />
                                    <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: `linear-gradient(135deg, ${layer.legend[0].color}, ${layer.legend[layer.legend.length - 1].color})` }} />
                                    <span className="font-medium flex-1">{layer.label}</span>
                                    {oceanLayers[layer.key] && (
                                      <input
                                        type="range"
                                        min={10} max={100} step={5}
                                        value={Math.round(oceanOpacity[layer.key] * 100)}
                                        onChange={e => setOceanOpacity(p => ({ ...p, [layer.key]: Number(e.target.value) / 100 }))}
                                        onClick={e => e.stopPropagation()}
                                        className="w-12 h-1 accent-blue-500"
                                      />
                                    )}
                                  </label>
                                ))}
                                {/* Phase 2+: disabled, coming soon */}
                                {p2Items.map(layer => (
                                  <label key={layer.key} className="flex items-center gap-2 text-gray-400 py-0.5 px-1.5 ml-4 cursor-not-allowed">
                                    <input type="checkbox" disabled className="rounded-sm border-gray-200 h-3 w-3 opacity-40" />
                                    <span className="w-2 h-2 rounded-full flex-shrink-0 opacity-40" style={{ background: `linear-gradient(135deg, ${layer.legend[0].color}, ${layer.legend[layer.legend.length - 1].color})` }} />
                                    <span className="font-medium flex-1 text-gray-400">{layer.label}</span>
                                    <Lock size={8} className="text-gray-300" />
                                  </label>
                                ))}
                              </div>
                            );
                          })}
                          {/* Data freshness + attribution */}
                          <div className="ml-2 mt-1 text-[9px] text-gray-400 space-y-0.5">
                            <div className="flex items-center gap-1">
                              <span>Data:</span>
                              <span className="text-primary-600 font-medium">{gibsDateLabel}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <span>Sources:</span>
                              <span className="text-primary-600 font-medium">NASA GIBS · GEBCO</span>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Live Tracking dropdown (Flights + Ships) */}
                {(() => {
                  const trackCount = (showFlights ? 1 : 0) + (showShips ? 1 : 0);
                  const expanded = expandedGroups['Tracking'];
                  return (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedGroups(p => ({ ...p, Tracking: !p.Tracking }))}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={trackCount === 2}
                          ref={el => { if (el) el.indeterminate = trackCount === 1; }}
                          onChange={e => {
                            e.stopPropagation();
                            const next = trackCount < 2;
                            setShowFlights(next);
                            setShowShips(next);
                          }}
                          onClick={e => e.stopPropagation()}
                          className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                        />
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Live Tracking</span>
                        <span className="text-[9px] text-gray-400">{trackCount}/2</span>
                        <ChevronDown size={10} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="px-3 pb-2 space-y-1">
                          <label className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                            <input
                              type="checkbox"
                              checked={showFlights}
                              onChange={() => setShowFlights(p => !p)}
                              className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                            />
                            <span className="text-[10px]">✈️</span>
                            <span className="font-medium flex-1">Flights</span>
                            {showFlights && <span className="text-[9px] text-amber-600 font-bold">{aircraft.length}</span>}
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                            <input
                              type="checkbox"
                              checked={showShips}
                              onChange={() => setShowShips(p => !p)}
                              className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                            />
                            <span className="text-[10px]">🚢</span>
                            <span className="font-medium flex-1">Ships & Maritime</span>
                            {showShips && <span className="text-[9px] text-indigo-600 font-bold">{vessels.length > 0 ? vessels.length : nauticalFeatures.length}</span>}
                          </label>
                          {showFlights && (
                            <div className="ml-4 flex items-center gap-2 text-[9px] text-gray-400">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Airborne</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />Ground</span>
                              <span className="ml-auto">Live · {ADSB_POLL_MS / 1000}s</span>
                            </div>
                          )}
                          {showShips && (
                            <div className="ml-4 flex items-center gap-2 text-[9px] text-gray-400">
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Fishing</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Cargo</span>
                              <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Passenger</span>
                              {!AISSTREAM_KEY && <span className="text-amber-500 ml-auto">No API key</span>}
                              {AISSTREAM_KEY && vessels.length > 0 && <span className="ml-auto">Live · {vessels.length}</span>}
                            </div>
                          )}
                          <div className="ml-2 mt-0.5 text-[9px] text-gray-400 flex items-center gap-1">
                            <span>Sources:</span>
                            <span className="text-primary-600 font-medium">ADSB.fi · AISStream.io · OSM</span>
                          </div>
                          {showShips && !AISSTREAM_KEY && (
                            <div className="ml-2 mt-1 p-1.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-700">
                              Set <code className="font-mono bg-amber-100 px-0.5">VITE_AISSTREAM_API_KEY</code> in .env.local for live ship tracking.
                              Free key at <strong>aisstream.io</strong>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}

                {/* Critical Infrastructure dropdown */}
                {(() => {
                  const activeCount = Object.values(infraPOI).filter(Boolean).length;
                  const allOn = INFRA_POI_CATEGORIES.every(c => infraPOI[c.key]);
                  const someOn = activeCount > 0;
                  const expanded = expandedGroups['Critical Infra'];
                  return (
                    <div className="border-b border-gray-200">
                      <button
                        onClick={() => setExpandedGroups(p => ({ ...p, 'Critical Infra': !p['Critical Infra'] }))}
                        className="w-full px-3 py-2 flex items-center gap-2 hover:bg-white transition-colors"
                      >
                        <input
                          type="checkbox"
                          checked={allOn}
                          ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                          onChange={e => {
                            e.stopPropagation();
                            const next = !allOn;
                            setInfraPOI(Object.fromEntries(INFRA_POI_CATEGORIES.map(c => [c.key, next])));
                          }}
                          onClick={e => e.stopPropagation()}
                          className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                        />
                        <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Critical Infrastructure</span>
                        <span className="text-[9px] text-gray-400">{activeCount}/{INFRA_POI_CATEGORIES.length}</span>
                        <ChevronDown size={10} className={`text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                      </button>
                      {expanded && (
                        <div className="px-3 pb-2 space-y-1">
                          {INFRA_POI_GROUPS.map(group => {
                            const items = INFRA_POI_CATEGORIES.filter(c => c.group === group);
                            return (
                              <div key={group}>
                                <div className="flex items-center gap-1.5 ml-2 mb-0.5">
                                  <span className="text-[10px]">{INFRA_GROUP_ICONS[group]}</span>
                                  <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{group}</span>
                                </div>
                                {items.map(cat => {
                                  const count = infraPOIData.filter(p => p.category === cat.key).length;
                                  return (
                                    <label key={cat.key} className="flex items-center gap-2 cursor-pointer text-gray-700 py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-4">
                                      <input
                                        type="checkbox"
                                        checked={infraPOI[cat.key]}
                                        onChange={() => setInfraPOI(p => ({ ...p, [cat.key]: !p[cat.key] }))}
                                        className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3 w-3"
                                      />
                                      <span className="text-[10px]">{cat.icon}</span>
                                      <span className="font-medium flex-1">{cat.label}</span>
                                      {infraPOILoaded && <span className="text-[9px] text-gray-400">{count}</span>}
                                    </label>
                                  );
                                })}
                              </div>
                            );
                          })}
                          <div className="ml-2 mt-1 text-[9px] text-gray-400 flex items-center gap-1">
                            <span>Sources:</span>
                            <span className="text-primary-600 font-medium">BetterGenSan · OSM</span>
                            {infraPOILoaded && <span>· {infraPOIData.length} POIs</span>}
                            {infraPOILoaded && !osmLoaded && <span className="text-amber-500">· loading OSM…</span>}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}

                <div className="px-3 py-2.5">
                  <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-1.5">Filter Summary</div>
                  <div className="bg-white rounded border border-gray-200 p-2 text-[10px] text-gray-500 space-y-0.5">
                    <div><span className="text-gray-700 font-medium">{activeLayerCount}</span> layers active</div>
                    <div><span className="text-gray-700 font-medium">{filteredIncidents.length}</span> signals visible</div>
                    <div><span className="text-gray-700 font-medium">All</span> barangays</div>
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

              {/* Mobile: view toggle */}
              <div className="lg:hidden absolute bottom-4 left-1/2 -translate-x-1/2 z-[10] bg-gray-900/90 backdrop-blur rounded-full shadow-xl border border-gray-700/50 flex overflow-hidden">
                <button
                  onClick={() => setMobileView('map')}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mobileView === 'map' ? 'bg-primary-600 text-white' : 'text-gray-400'}`}
                >
                  <MapPin size={14} className="inline mr-1" />Map
                </button>
                <button
                  onClick={() => setMobileView('layers')}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mobileView === 'layers' ? 'bg-primary-600 text-white' : 'text-gray-400'}`}
                >
                  <Layers size={14} className="inline mr-1" />Layers
                </button>
                <button
                  onClick={() => setMobileView('intel')}
                  className={`px-3 py-2 text-xs font-bold uppercase tracking-wider transition-colors ${mobileView === 'intel' ? 'bg-primary-600 text-white' : 'text-gray-400'}`}
                >
                  <BarChart3 size={14} className="inline mr-1" />Intel
                </button>
              </div>

              {/* ── Floating overlays ─────────────────────────────── */}

              {/* Top-left: live status + metrics combined (desktop only) */}
              <div className="hidden lg:flex absolute top-3 left-3 z-[10] flex-col gap-1.5">
                <div className="bg-gray-900/85 backdrop-blur text-white rounded-lg px-3 py-2.5 shadow-lg border border-gray-700/50 min-w-[160px]">
                  <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-bold uppercase tracking-wider mb-1.5">
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
                    </span>
                    Live Monitoring
                  </div>
                  <div className="text-[10px] text-gray-400 mb-2.5">
                    General Santos City · {clock.toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>
                  {/* Metrics — dynamic per active layer */}
                  <div className="space-y-1.5">
                    {Object.values(layers).some(Boolean) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-primary-400"><Target size={9} /></span>
                        <span className="text-[9px] text-gray-500">Incidents</span>
                        <span className="text-[11px] font-bold ml-auto">{filteredIncidents.length}</span>
                        {highSeverityCount > 0 && <span className="text-[8px] text-red-400 font-bold">{highSeverityCount} high</span>}
                      </div>
                    )}
                    {showInfra && INFRA_STATUSES.some(s => infraStatuses[s]) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-emerald-400"><Activity size={9} /></span>
                        <span className="text-[9px] text-gray-500">Infrastructure</span>
                        <span className="text-[11px] font-bold ml-auto">{filteredInfraProjects.length}</span>
                      </div>
                    )}
                    {HAZARD_LAYERS.some(h => hazardLayers[h.key]) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400"><AlertTriangle size={9} /></span>
                        <span className="text-[9px] text-gray-500">Hazard Layers</span>
                        <span className="text-[11px] font-bold ml-auto">{HAZARD_LAYERS.filter(h => hazardLayers[h.key]).length}</span>
                      </div>
                    )}
                    {popMode !== 'off' && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-green-400"><Users size={9} /></span>
                        <span className="text-[9px] text-gray-500">Population</span>
                        <span className="text-[11px] font-bold ml-auto capitalize">{popMode}</span>
                      </div>
                    )}
                    {PHASE1_OCEAN.some(l => oceanLayers[l.key]) && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-cyan-400"><Waves size={9} /></span>
                        <span className="text-[9px] text-gray-500">Marine</span>
                        <span className="text-[11px] font-bold ml-auto">{PHASE1_OCEAN.filter(l => oceanLayers[l.key]).length}</span>
                      </div>
                    )}
                    {showFlights && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400"><Signal size={9} /></span>
                        <span className="text-[9px] text-gray-500">Flights</span>
                        <span className="text-[11px] font-bold ml-auto">{aircraft.length}</span>
                      </div>
                    )}
                    {showShips && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-400"><Waves size={9} /></span>
                        <span className="text-[9px] text-gray-500">Vessels</span>
                        <span className="text-[11px] font-bold ml-auto">{vessels.length}</span>
                      </div>
                    )}
                    {anyInfraPOIOn && (
                      <div className="flex items-center gap-1.5">
                        <span className="text-indigo-400"><MapPin size={9} /></span>
                        <span className="text-[9px] text-gray-500">Facilities</span>
                        <span className="text-[11px] font-bold ml-auto">{filteredInfraPOIData.length}</span>
                      </div>
                    )}
                    {activeLayerCount === 0 && (
                      <div className="text-[9px] text-gray-600 italic">No layers active</div>
                    )}
                  </div>
                </div>
              </div>

              {/* Control buttons stack — bottom right */}
              <div className="hidden lg:flex absolute bottom-10 right-14 z-[10] flex-col gap-1.5">
                {/* Dark mode toggle */}
                <button
                  onClick={() => setDarkMode(p => !p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-lg border transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-amber-400' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  {darkMode ? <Sun size={15} /> : <Moon size={15} />}
                </button>
                {/* Calendar/timeline toggle */}
                <button
                  onClick={() => setTimelineOpen(p => !p)}
                  className={`w-8 h-8 flex items-center justify-center rounded-lg shadow-lg border transition-all ${timelineOpen ? 'bg-primary-600 border-primary-500 text-white' : darkMode ? 'bg-gray-800 border-gray-700 text-gray-400 hover:text-gray-200' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                >
                  <Calendar size={15} />
                </button>
              </div>

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

              {/* Bottom-center: dynamic legend strip — below timeline (desktop only) */}
              <div className="hidden lg:flex absolute bottom-3 left-1/2 -translate-x-1/2 z-[10] bg-white/90 backdrop-blur rounded-lg border border-gray-200 shadow-lg px-3 py-1.5 items-center gap-2">
                {(Object.keys(categoryColor) as IncidentCategory[]).filter(cat => layers[cat]).map(cat => (
                  <button
                    key={cat}
                    onClick={() => setLayers(p => ({ ...p, [cat]: !p[cat] }))}
                    className="flex items-center gap-1 text-[10px]"
                  >
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: categoryColor[cat] }} />
                    <span className="font-medium text-gray-700">{cat}</span>
                  </button>
                ))}
                {showInfra && INFRA_STATUSES.filter(s => infraStatuses[s]).length > 0 && (
                  <>
                    <div className="w-px h-3 bg-gray-300 mx-1" />
                    {INFRA_STATUSES.filter(s => infraStatuses[s]).map(s => (
                      <button
                        key={s}
                        onClick={() => setInfraStatuses(p => ({ ...p, [s]: !p[s] }))}
                        className="flex items-center gap-1 text-[10px]"
                      >
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: infraStatusColor[s] }} />
                        <span className="font-medium text-gray-700">{s}</span>
                      </button>
                    ))}
                  </>
                )}
                {HAZARD_LAYERS.some(h => hazardLayers[h.key]) && (
                  <>
                    <div className="w-px h-3 bg-gray-300 mx-1" />
                    {HAZARD_LAYERS.filter(h => hazardLayers[h.key]).map(h => (
                      <button
                        key={h.key}
                        onClick={() => setHazardLayers(p => ({ ...p, [h.key]: !p[h.key] }))}
                        className="flex items-center gap-1 text-[10px]"
                      >
                        <span className="w-2 h-2 rounded-sm" style={{ background: `linear-gradient(135deg, ${h.colors[0]}, ${h.colors[2]})` }} />
                        <span className="font-medium text-gray-700">{h.label}</span>
                      </button>
                    ))}
                  </>
                )}
                {popMode !== 'off' && (
                  <>
                    <div className="w-px h-3 bg-gray-300 mx-1" />
                    <button
                      onClick={() => setPopMode('off')}
                      className="flex items-center gap-1 text-[10px]"
                    >
                      <div className="w-10 h-1.5 rounded-full bg-gradient-to-r from-lime-200 via-yellow-400 to-red-600" />
                      <span className="font-medium text-gray-700">Pop. {popMode === 'analyst' ? '(Grid)' : '(Heat)'}</span>
                    </button>
                  </>
                )}
                {PHASE1_OCEAN.some(l => oceanLayers[l.key]) && (
                  <>
                    <div className="w-px h-3 bg-gray-300 mx-1" />
                    {PHASE1_OCEAN.filter(l => oceanLayers[l.key]).map(l => (
                      <button
                        key={l.key}
                        onClick={() => setOceanLayers(p => ({ ...p, [l.key]: !p[l.key] }))}
                        className="flex items-center gap-1 text-[10px]"
                      >
                        <div
                          className="w-10 h-1.5 rounded-full"
                          style={{ background: `linear-gradient(90deg, ${l.legend.map(s => s.color).join(', ')})` }}
                        />
                        <span className="font-medium text-gray-700">{l.label}</span>
                      </button>
                    ))}
                  </>
                )}
                {showFlights && (
                  <>
                    <div className="w-px h-3 bg-gray-300 mx-1" />
                    <button
                      onClick={() => setShowFlights(false)}
                      className="flex items-center gap-1 text-[10px]"
                    >
                      <span className="w-2 h-2 rounded-full bg-amber-400" />
                      <span className="font-medium text-gray-700">Flights ({aircraft.length})</span>
                    </button>
                  </>
                )}
                {showShips && (
                  <>
                    <div className="w-px h-3 bg-gray-300 mx-1" />
                    <button
                      onClick={() => setShowShips(false)}
                      className="flex items-center gap-1 text-[10px]"
                    >
                      <span className="w-2 h-2 rounded-full bg-blue-400" />
                      <span className="font-medium text-gray-700">Nautical</span>
                    </button>
                  </>
                )}
              </div>

              {/* Right edge: mini live feed preview (desktop only) */}
              <div className="hidden lg:block absolute top-3 right-3 z-[10] w-[220px] bg-gray-900/85 backdrop-blur rounded-lg border border-gray-700/50 shadow-xl overflow-hidden">
                <div className="px-2.5 py-1.5 border-b border-gray-700/50 flex items-center gap-1.5">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-red-400" />
                  </span>
                  <span className="text-[9px] font-bold text-gray-300 uppercase tracking-wider">Incoming</span>
                </div>
                <div className="max-h-[160px] overflow-hidden">
                  {unifiedFeed.slice(0, 5).map((item, idx) => (
                    <div key={item.id} className={`px-2.5 py-1.5 border-b border-gray-800/50 ${idx === 0 ? 'bg-white/[0.03]' : ''}`}>
                      <div className="flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.dotColor }} />
                        <span className="text-[10px] font-semibold text-white truncate">{item.title}</span>
                        <span className="ml-auto text-[9px] text-gray-500">{item.meta}</span>
                      </div>
                      <div className="text-[9px] text-gray-400 truncate mt-0.5 pl-3">{item.location} — {item.subtitle.slice(0, 40)}…</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* ══ MOBILE LAYERS PANEL ═══════════════════════════ */}
            {mobileView === 'layers' && (
              <div className={`lg:hidden flex-1 overflow-y-auto ${darkMode ? 'bg-[#0d1117] text-gray-300' : 'bg-gray-50 text-gray-700'}`}>
                <div className="px-3 py-2.5 flex items-center gap-3 border-b border-gray-200">
                  <button onClick={() => setMobileView('map')} className="flex items-center gap-1 text-gray-500 hover:text-gray-800 transition-colors font-medium text-xs">
                    <ArrowLeft size={14} />Map
                  </button>
                  <div className="h-3 w-px bg-gray-300" />
                  <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-widest"><Layers size={12} />Layers</div>
                  <span className="ml-auto text-[10px] text-gray-400">{activeLayerCount} active</span>
                  <button
                    onClick={() => setDarkMode(p => !p)}
                    className={`w-7 h-7 flex items-center justify-center rounded-lg border transition-all ${darkMode ? 'bg-gray-800 border-gray-700 text-amber-400' : 'bg-white border-gray-200 text-gray-600'}`}
                  >
                    {darkMode ? <Sun size={13} /> : <Moon size={13} />}
                  </button>
                </div>
                <div className="text-[11px]">
                  {/* Map controls */}
                  <div className="px-3 py-2.5 border-b border-gray-200">
                    <div className="text-[9px] font-bold text-gray-400 uppercase tracking-[0.15em] mb-2">Map</div>
                    <label className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors">
                      <input type="checkbox" checked={showBarangays} onChange={() => setShowBarangays(!showBarangays)} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
                      <Layers size={12} className="text-blue-500" />
                      <span className="font-medium">Barangays</span>
                    </label>
                  </div>

                  {/* Incidents */}
                  {(() => {
                    const allCats = Object.keys(layers) as IncidentCategory[];
                    const allOn = allCats.every(c => layers[c]);
                    const someOn = allCats.some(c => layers[c]);
                    return (
                  <div className="border-b border-gray-200">
                    <button onClick={() => setExpandedGroups(p => ({ ...p, Incidents: !p.Incidents }))} className="w-full px-3 py-2.5 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={allOn}
                        ref={el => { if (el) el.indeterminate = someOn && !allOn; }}
                        onChange={e => {
                          e.stopPropagation();
                          const next = !allOn;
                          setLayers(p => {
                            const updated = { ...p };
                            allCats.forEach(c => { updated[c] = next; });
                            return updated;
                          });
                        }}
                        onClick={e => e.stopPropagation()}
                        className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                      />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Incidents</span>
                      <span className="text-[9px] text-gray-400">{allCats.filter(c => layers[c]).length}/{allCats.length}</span>
                      <ChevronDown size={10} className={`text-gray-400 transition-transform ${expandedGroups['Incidents'] ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedGroups['Incidents'] && (
                      <div className="px-3 pb-2 space-y-0.5">
                        {(Object.keys(layers) as IncidentCategory[]).map(cat => (
                          <label key={cat} className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                            <input type="checkbox" checked={layers[cat]} onChange={() => setLayers(p => ({ ...p, [cat]: !p[cat] }))} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: categoryColor[cat] }} />
                            <span className="font-medium">{cat}</span>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                    );
                  })()}

                  {/* Infrastructure */}
                  {(() => {
                    const allOn = INFRA_STATUSES.every(s => infraStatuses[s]);
                    const someOn = INFRA_STATUSES.some(s => infraStatuses[s]);
                    return (
                  <div className="border-b border-gray-200">
                    <button onClick={() => setExpandedGroups(p => ({ ...p, Infrastructure: !p.Infrastructure }))} className="w-full px-3 py-2.5 flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showInfra && allOn}
                        ref={el => { if (el) el.indeterminate = showInfra && someOn && !allOn; }}
                        onChange={e => {
                          e.stopPropagation();
                          if (showInfra && allOn) {
                            setShowInfra(false);
                          } else {
                            setShowInfra(true);
                            setInfraStatuses({ Completed: true, 'On-Going': true, 'For Procurement': true, 'Not Yet Started': true });
                          }
                        }}
                        onClick={e => e.stopPropagation()}
                        className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5"
                      />
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Infrastructure</span>
                      <span className="text-[9px] text-gray-400">{INFRA_STATUSES.filter(s => infraStatuses[s]).length}/{INFRA_STATUSES.length}</span>
                      <ChevronDown size={10} className={`text-gray-400 transition-transform ${expandedGroups['Infrastructure'] ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedGroups['Infrastructure'] && (
                      <div className="px-3 pb-2 space-y-0.5">
                        {INFRA_STATUSES.map(status => (
                          <label key={status} className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                            <input type="checkbox" checked={infraStatuses[status]} onChange={() => { setInfraStatuses(p => ({ ...p, [status]: !p[status] })); if (!showInfra) setShowInfra(true); }} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: infraStatusColor[status] }} />
                            <span className="font-medium">{status}</span>
                          </label>
                        ))}
                        <div className="ml-2 mt-1 text-[9px] text-gray-400 flex items-center gap-1">
                          <span>Source:</span>
                          <span className="text-primary-600 font-medium">bisto.ph</span>
                        </div>
                      </div>
                    )}
                  </div>
                    );
                  })()}

                  {/* Hazard Maps */}
                  <div className="border-b border-gray-200">
                    <button onClick={() => setExpandedGroups(p => ({ ...p, 'Hazard Maps': !p['Hazard Maps'] }))} className="w-full px-3 py-2.5 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Hazard Maps</span>
                      <span className="text-[9px] text-gray-400">{HAZARD_LAYERS.filter(l => hazardLayers[l.key]).length}/{HAZARD_LAYERS.length}</span>
                      <ChevronDown size={10} className={`text-gray-400 transition-transform ${expandedGroups['Hazard Maps'] ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedGroups['Hazard Maps'] && (
                      <div className="px-3 pb-2 space-y-1">
                        {[...new Set(HAZARD_LAYERS.map(l => l.group))].map(group => (
                          <div key={group}>
                            <div className="flex items-center gap-1.5 ml-2 mb-0.5">
                              <span className="text-[10px]">{HAZARD_GROUP_ICONS[group]}</span>
                              <span className="text-[9px] font-semibold text-gray-500 uppercase tracking-wider">{group}</span>
                            </div>
                            {HAZARD_LAYERS.filter(l => l.group === group).slice().reverse().map(layer => (
                              <label key={layer.key} className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-4">
                                <input type="checkbox" checked={hazardLayers[layer.key]} onChange={() => setHazardLayers(p => ({ ...p, [layer.key]: !p[layer.key] }))} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: `linear-gradient(135deg, ${layer.colors[0]}, ${layer.colors[2]})` }} />
                                <span className="font-medium">{layer.label}</span>
                              </label>
                            ))}
                          </div>
                        ))}
                        <div className="ml-2 mt-1 text-[9px] text-gray-400 flex items-center gap-1">
                          <span>Source:</span>
                          <span className="text-primary-600 font-medium">Project NOAH</span>
                        </div>
                        <div className="ml-2 flex items-center gap-2 text-[9px] text-gray-400">
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#93c5fd' }} />Low</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#3b82f6' }} />Med</span>
                          <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-sm" style={{ backgroundColor: '#1d4ed8' }} />High</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Population */}
                  <div className="border-b border-gray-200">
                    <button onClick={() => setExpandedGroups(p => ({ ...p, Population: !p.Population }))} className="w-full px-3 py-2.5 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Population</span>
                      <span className="text-[9px] text-gray-400">{popMode !== 'off' ? 1 : 0}/2</span>
                      <ChevronDown size={10} className={`text-gray-400 transition-transform ${expandedGroups['Population'] ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedGroups['Population'] && (
                      <div className="px-3 pb-2 space-y-1">
                        <label className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                          <input type="radio" name="mob-pop-mode" checked={popMode === 'visual'} onChange={() => setPopMode(popMode === 'visual' ? 'off' : 'visual')} className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500" />
                          <Thermometer size={12} className="text-green-500" />
                          <span className="font-medium">Visual</span>
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                          <input type="radio" name="mob-pop-mode" checked={popMode === 'analyst'} onChange={() => setPopMode(popMode === 'analyst' ? 'off' : 'analyst')} className="h-3.5 w-3.5 text-primary-600 focus:ring-primary-500" />
                          <BarChart3 size={12} className="text-green-600" />
                          <span className="font-medium">Analyst</span>
                        </label>
                        <div className="ml-2 mt-0.5 text-[9px] text-gray-400 flex items-center gap-1">
                          <span>Source:</span>
                          <span className="text-primary-600 font-medium">Meta HRSL / HDX</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Marine Analytics */}
                  <div className="border-b border-gray-200">
                    <button onClick={() => setExpandedGroups(p => ({ ...p, Ocean: !p.Ocean }))} className="w-full px-3 py-2.5 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Marine Analytics</span>
                      <span className="text-[9px] text-gray-400">{PHASE1_OCEAN.filter(l => oceanLayers[l.key]).length}/{PHASE1_OCEAN.length}</span>
                      <ChevronDown size={10} className={`text-gray-400 transition-transform ${expandedGroups['Ocean'] ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedGroups['Ocean'] && (
                      <div className="px-3 pb-2 space-y-0.5">
                        {PHASE1_OCEAN.map(layer => (
                          <label key={layer.key} className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                            <input type="checkbox" checked={oceanLayers[layer.key]} onChange={() => setOceanLayers(p => ({ ...p, [layer.key]: !p[layer.key] }))} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
                            <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: `linear-gradient(135deg, ${layer.legend[0].color}, ${layer.legend[layer.legend.length - 1].color})` }} />
                            <span className="font-medium">{layer.label}</span>
                          </label>
                        ))}
                        <div className="ml-2 mt-1 text-[9px] text-gray-400 flex items-center gap-1">
                          <span>Sources:</span>
                          <span className="text-primary-600 font-medium">NASA GIBS · GEBCO</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Live Tracking */}
                  <div className="border-b border-gray-200">
                    <button onClick={() => setExpandedGroups(p => ({ ...p, Tracking: !p.Tracking }))} className="w-full px-3 py-2.5 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Live Tracking</span>
                      <span className="text-[9px] text-gray-400">{(showFlights ? 1 : 0) + (showShips ? 1 : 0)}/2</span>
                      <ChevronDown size={10} className={`text-gray-400 transition-transform ${expandedGroups['Tracking'] ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedGroups['Tracking'] && (
                      <div className="px-3 pb-2 space-y-0.5">
                        <label className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                          <input type="checkbox" checked={showFlights} onChange={() => setShowFlights(p => !p)} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
                          <span className="text-[11px]">✈️</span>
                          <span className="font-medium flex-1">Flights</span>
                          {showFlights && <span className="text-[9px] text-amber-600 font-bold">{aircraft.length}</span>}
                        </label>
                        <label className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                          <input type="checkbox" checked={showShips} onChange={() => setShowShips(p => !p)} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
                          <span className="text-[11px]">🚢</span>
                          <span className="font-medium flex-1">Ships & Maritime</span>
                          {showShips && vessels.length > 0 && <span className="text-[9px] text-indigo-600 font-bold">{vessels.length}</span>}
                        </label>
                        {showFlights && (
                          <div className="ml-4 flex items-center gap-2 text-[9px] text-gray-400">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Airborne</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-400" />Ground</span>
                          </div>
                        )}
                        {showShips && (
                          <div className="ml-4 flex items-center gap-2 text-[9px] text-gray-400">
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" />Fishing</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-400" />Cargo</span>
                            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-400" />Passenger</span>
                          </div>
                        )}
                        <div className="ml-2 mt-0.5 text-[9px] text-gray-400 flex items-center gap-1">
                          <span>Sources:</span>
                          <span className="text-primary-600 font-medium">ADSB.fi · AISStream.io · OSM</span>
                        </div>
                        {showShips && !AISSTREAM_KEY && (
                          <div className="ml-2 mt-1 p-1.5 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-700">
                            Set <code className="font-mono bg-amber-100 px-0.5">VITE_AISSTREAM_API_KEY</code> for live ship tracking.
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Critical Infrastructure */}
                  <div className="border-b border-gray-200">
                    <button onClick={() => setExpandedGroups(p => ({ ...p, 'Critical Infra': !p['Critical Infra'] }))} className="w-full px-3 py-2.5 flex items-center gap-2">
                      <span className="text-[9px] font-bold text-gray-500 uppercase tracking-[0.15em] flex-1 text-left">Critical Infrastructure</span>
                      <span className="text-[9px] text-gray-400">{Object.values(infraPOI).filter(Boolean).length}/{INFRA_POI_CATEGORIES.length}</span>
                      <ChevronDown size={10} className={`text-gray-400 transition-transform ${expandedGroups['Critical Infra'] ? 'rotate-180' : ''}`} />
                    </button>
                    {expandedGroups['Critical Infra'] && (
                      <div className="px-3 pb-2 space-y-0.5">
                        {INFRA_POI_CATEGORIES.map(cat => (
                          <label key={cat.key} className="flex items-center gap-2 cursor-pointer py-0.5 px-1.5 rounded hover:bg-white transition-colors ml-2">
                            <input type="checkbox" checked={infraPOI[cat.key]} onChange={() => setInfraPOI(p => ({ ...p, [cat.key]: !p[cat.key] }))} className="rounded-sm border-gray-300 text-primary-600 focus:ring-primary-500 h-3.5 w-3.5" />
                            <span className="text-[11px]">{cat.icon}</span>
                            <span className="font-medium flex-1">{cat.label}</span>
                            {infraPOILoaded && <span className="text-[9px] text-gray-400">{infraPOIData.filter(p => p.category === cat.key).length}</span>}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* ══ INTELLIGENCE DECK ═════════════════════════════ */}
            <div className={`border-t ${mobileView !== 'intel' && mobileView !== 'layers' ? 'hidden lg:block' : mobileView === 'layers' ? 'hidden lg:block' : 'flex-1'} lg:flex-shrink-0 ${darkMode ? 'bg-[#0a0e14] border-[#1e2a3a]' : 'bg-gray-100 border-gray-300'}`} style={{ height: mobileView === 'intel' ? undefined : '33vh' }}>
              {/* Mobile: back + title bar when in intel view */}
              {mobileView === 'intel' && (
                <div className="lg:hidden bg-gray-900 text-white px-3 py-2.5 flex items-center gap-3">
                  <button onClick={() => setMobileView('map')} className="flex items-center gap-1 text-gray-400 hover:text-white transition-colors font-medium text-xs">
                    <ArrowLeft size={14} />
                    Map
                  </button>
                  <div className="h-3 w-px bg-gray-700" />
                  <div className="flex items-center gap-1.5 font-bold text-xs tracking-tight">
                    <img src="/logo.png" alt="" className="h-5 w-5 object-contain" />
                    BETTERGENSAN
                  </div>
                  <div className="flex-1" />
                  <span className="font-mono text-gray-400 tabular-nums text-[11px]">
                    {clock.toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                  </span>
                </div>
              )}
              <div className={`h-full flex flex-col lg:flex-row gap-px overflow-y-auto cc-scroll lg:overflow-hidden ${darkMode ? 'bg-[#1e2a3a]' : 'bg-gray-300'}`}>

                {/* ── LIVE FEED ─────────────────────────────────── */}
                <div className={`w-full lg:w-[30%] flex flex-col ${darkMode ? 'bg-[#111720]' : 'bg-white'}`}>
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
                      <div className="px-3 py-6 text-center text-[10px] text-gray-400">No active layers</div>
                    )}
                    {unifiedFeed.map((item, idx) => (
                      <a
                        key={item.id}
                        href={item.url || undefined}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`block px-3 py-2 border-b border-gray-100 hover:bg-primary-50/30 transition-colors ${item.url ? 'cursor-pointer' : ''} ${idx === 0 ? 'bg-primary-50/50 border-l-2 border-l-primary-500' : ''}`}
                      >
                        <div className="flex items-center gap-1.5 mb-0.5">
                          <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: item.dotColor }} />
                          <span className="text-[11px] font-bold text-gray-900">{item.title}</span>
                          <span className={`text-[8px] px-1 py-0 rounded font-medium ${
                            item.type === 'infra' ? 'bg-emerald-50 text-emerald-700' :
                            item.type === 'flight' ? 'bg-amber-50 text-amber-700' :
                            item.type === 'poi' ? 'bg-indigo-50 text-indigo-700' :
                            'bg-red-50 text-red-700'
                          }`}>
                            {item.type === 'infra' ? 'INFRA' : item.type === 'flight' ? 'FLIGHT' : item.type === 'poi' ? 'POI' : 'INCIDENT'}
                          </span>
                          <span className="text-[9px] text-gray-400 ml-auto font-mono">{item.meta}</span>
                        </div>
                        <p className="text-[10px] text-gray-600 leading-snug line-clamp-1 pl-3">{item.subtitle}</p>
                        <div className="flex items-center gap-2 mt-0.5 pl-3 text-[9px] text-gray-400">
                          <span className="flex items-center gap-0.5"><MapPin size={8} />{item.location}</span>
                          {item.url && <span className="text-primary-500 ml-auto">↗</span>}
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

                {/* ── ANALYSIS CENTER ───────────────────────────── */}
                <div className={`w-full lg:flex-1 flex flex-col ${darkMode ? 'bg-[#111720]' : 'bg-white'}`}>
                  <div className="cc-panel-header bg-primary-700 px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0">
                    <BarChart3 size={11} className="text-primary-200" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Analysis</span>
                    <div className="ml-auto flex gap-0.5">
                      {(['24h', '7d', '30d'] as const).map(w => (
                        <button key={w} onClick={() => setTrendWindow(w)} className={`px-1.5 py-0.5 rounded text-[9px] font-bold transition-colors ${trendWindow === w ? 'bg-white text-primary-700' : 'text-primary-300 hover:text-white'}`}>
                          {w.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="flex-1 flex min-h-0">
                    <div className="flex-1 p-3 flex flex-col gap-2 overflow-y-auto cc-scroll">
                      {/* Trend chart — only when incidents are on */}
                      {anyIncidentsOn && (
                        <div>
                          <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1">Signal Volume — {trendWindow}</div>
                          <TrendChart data={trendData} window={trendWindow} />
                        </div>
                      )}

                      {/* Incident category breakdown */}
                      {anyIncidentsOn && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Incident Categories</div>
                            <div className="text-[10px] font-bold text-gray-700">
                              {categoryDistribution.reduce((s, c) => s + c.count, 0)} <span className="text-gray-400 font-normal">total</span>
                            </div>
                          </div>
                          {categoryDistribution.length > 0 && (
                            <div className="flex items-center gap-2 mb-2 p-1.5 bg-primary-50 border border-primary-200 rounded text-[10px]">
                              <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${categoryColor[categoryDistribution[0].category] ?? '#6b7280'}20`, color: categoryColor[categoryDistribution[0].category] ?? '#6b7280' }}>
                                {(() => { const Icon = categoryIconMap[categoryDistribution[0].category] ?? MapPin; return <Icon size={10} />; })()}
                              </span>
                              <span className="font-bold text-primary-800">TOP: {categoryDistribution[0].category}</span>
                              <span className="text-primary-600 font-medium ml-auto">{categoryDistribution[0].count} reports ({categoryDistribution[0].pct}%)</span>
                            </div>
                          )}
                          <div className="space-y-0.5">
                            {categoryDistribution.map(c => {
                              const trend = categoryTrends[c.category];
                              const Icon = categoryIconMap[c.category];
                              return (
                                <div key={c.category} className="group rounded px-1.5 py-1 hover:bg-gray-50 transition-colors">
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${categoryColor[c.category]}18`, color: categoryColor[c.category] }}>
                                      <Icon size={10} />
                                    </span>
                                    <span className="font-medium text-gray-800 flex-1">{c.category}</span>
                                    <span className="font-mono font-bold text-gray-700 w-7 text-right">{c.count}</span>
                                    <span className={`w-10 text-right text-[9px] font-medium ${trend.dir === 'up' ? 'text-red-500' : trend.dir === 'down' ? 'text-emerald-500' : 'text-gray-400'}`}>
                                      {trend.dir === 'up' ? '▲' : trend.dir === 'down' ? '▼' : '—'} {trend.delta}
                                    </span>
                                    <span className="w-7 text-right text-[9px] text-gray-400 font-mono">{c.pct}%</span>
                                  </div>
                                  <div className="mt-0.5 ml-[22px] bg-gray-100 rounded h-2 overflow-hidden">
                                    <div className="h-full rounded transition-all" style={{ width: `${c.pct}%`, background: `linear-gradient(90deg, ${categoryColor[c.category]}, ${categoryColor[c.category]}cc)` }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Infra status breakdown */}
                      {anyInfraOn && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Infrastructure Status</div>
                            <div className="text-[10px] font-bold text-gray-700">
                              {filteredInfraProjects.length} <span className="text-gray-400 font-normal">projects</span>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            {infraStatusDistribution.map(s => (
                              <div key={s.status} className="group rounded px-1.5 py-1 hover:bg-gray-50 transition-colors">
                                <div className="flex items-center gap-1.5 text-[10px]">
                                  <span className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${infraStatusColor[s.status]}18`, color: infraStatusColor[s.status] }}>
                                    <Activity size={10} />
                                  </span>
                                  <span className="font-medium text-gray-800 flex-1">{s.status}</span>
                                  <span className="font-mono font-bold text-gray-700 w-10 text-right">{s.count}</span>
                                  <span className="w-7 text-right text-[9px] text-gray-400 font-mono">{s.pct}%</span>
                                </div>
                                <div className="mt-0.5 ml-[22px] bg-gray-100 rounded h-2 overflow-hidden">
                                  <div className="h-full rounded transition-all" style={{ width: `${s.pct}%`, background: `linear-gradient(90deg, ${infraStatusColor[s.status]}, ${infraStatusColor[s.status]}cc)` }} />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Hazard layers summary */}
                      {HAZARD_LAYERS.some(h => hazardLayers[h.key]) && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Active Hazard Layers</div>
                            <div className="text-[10px] font-bold text-gray-700">
                              {HAZARD_LAYERS.filter(h => hazardLayers[h.key]).length} <span className="text-gray-400 font-normal">layers</span>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            {HAZARD_LAYERS.filter(h => hazardLayers[h.key]).map(h => (
                              <div key={h.key} className="flex items-center gap-1.5 text-[10px] px-1.5 py-1 rounded hover:bg-gray-50">
                                <span className="w-3 h-3 rounded-sm flex-shrink-0" style={{ background: `linear-gradient(135deg, ${h.colors[0]}, ${h.colors[2]})` }} />
                                <span className="font-medium text-gray-800 flex-1">{h.group}: {h.label}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Marine analytics summary */}
                      {PHASE1_OCEAN.some(l => oceanLayers[l.key]) && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Marine Analytics</div>
                            <div className="text-[10px] font-bold text-gray-700">
                              {PHASE1_OCEAN.filter(l => oceanLayers[l.key]).length} <span className="text-gray-400 font-normal">layers</span>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            {PHASE1_OCEAN.filter(l => oceanLayers[l.key]).map(l => (
                              <div key={l.key} className="flex items-center gap-1.5 text-[10px] px-1.5 py-1 rounded hover:bg-gray-50">
                                <div className="w-8 h-2 rounded-sm flex-shrink-0" style={{ background: `linear-gradient(90deg, ${l.legend.map(s => s.color).join(', ')})` }} />
                                <span className="font-medium text-gray-800 flex-1">{l.label}</span>
                                <span className="text-[9px] text-gray-400">Opacity: {Math.round(oceanOpacity[l.key] * 100)}%</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Flight tracking summary */}
                      {showFlights && aircraft.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Live Flights</div>
                            <div className="text-[10px] font-bold text-gray-700">
                              {aircraft.length} <span className="text-gray-400 font-normal">aircraft</span>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            {(() => {
                              const airborne = aircraft.filter(a => a.alt !== 'ground');
                              const ground = aircraft.filter(a => a.alt === 'ground');
                              const avgAlt = airborne.length > 0 ? Math.round(airborne.reduce((s, a) => s + (typeof a.alt === 'number' ? a.alt : 0), 0) / airborne.length) : 0;
                              return (
                                <>
                                  <div className="flex items-center gap-1.5 text-[10px] px-1.5 py-0.5">
                                    <span className="w-2 h-2 rounded-full bg-amber-400" />
                                    <span className="text-gray-700">Airborne: <strong>{airborne.length}</strong></span>
                                    {avgAlt > 0 && <span className="text-gray-400 ml-auto">avg {avgAlt.toLocaleString()} ft</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5 text-[10px] px-1.5 py-0.5">
                                    <span className="w-2 h-2 rounded-full bg-gray-400" />
                                    <span className="text-gray-700">Ground: <strong>{ground.length}</strong></span>
                                  </div>
                                  {airborne.slice(0, 3).map(a => (
                                    <div key={a.hex} className="flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 ml-2">
                                      <span className="text-amber-600 font-mono font-bold">{a.flight || a.hex}</span>
                                      <span className="text-gray-400">{a.type || '?'}</span>
                                      <span className="text-gray-400 ml-auto">{typeof a.alt === 'number' ? `${a.alt.toLocaleString()} ft` : 'GND'}</span>
                                    </div>
                                  ))}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      {/* Critical infrastructure summary */}
                      {anyInfraPOIOn && filteredInfraPOIData.length > 0 && (
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Critical Infrastructure</div>
                            <div className="text-[10px] font-bold text-gray-700">
                              {filteredInfraPOIData.length} <span className="text-gray-400 font-normal">POIs</span>
                            </div>
                          </div>
                          <div className="space-y-0.5">
                            {INFRA_POI_CATEGORIES.filter(c => infraPOI[c.key]).map(cat => {
                              const count = filteredInfraPOIData.filter(p => p.category === cat.key).length;
                              if (count === 0) return null;
                              return (
                                <div key={cat.key} className="flex items-center gap-1.5 text-[10px] px-1.5 py-0.5 rounded hover:bg-gray-50">
                                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: cat.color }} />
                                  <span className="text-gray-700 flex-1">{cat.label}</span>
                                  <span className="font-mono font-bold text-gray-700">{count}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Empty state */}
                      {!anyIncidentsOn && !anyInfraOn && !HAZARD_LAYERS.some(h => hazardLayers[h.key]) && !PHASE1_OCEAN.some(l => oceanLayers[l.key]) && !showFlights && !anyInfraPOIOn && (
                        <div className="flex-1 flex items-center justify-center text-[10px] text-gray-400">
                          Enable layers to see analysis
                        </div>
                      )}
                    </div>

                    <div className="w-[45%] border-l border-gray-200 flex flex-col">
                      <div className="px-3 py-1.5 bg-gray-50 border-b border-gray-200">
                        <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                          {anyIncidentsOn ? 'Barangay Activity' : anyInfraOn ? 'Top Barangays (Infra)' : 'Barangay Activity'}
                        </div>
                      </div>
                      <div className="flex-1 overflow-y-auto cc-scroll">
                        {anyIncidentsOn && barangayRisks.length > 0 ? (
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="text-gray-400 border-b border-gray-100">
                                <th className="text-left px-3 py-1 font-medium">Area</th>
                                <th className="text-center px-1 py-1 font-medium w-10">Ct</th>
                                <th className="text-center px-1 py-1 font-medium w-14">Risk</th>
                              </tr>
                            </thead>
                            <tbody>
                              {barangayRisks.map(b => (
                                <tr key={b.name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                  <td className="px-3 py-1 font-medium text-gray-800">{b.name}</td>
                                  <td className="text-center px-1 py-1 text-gray-600 font-mono">{b.count}</td>
                                  <td className="px-1 py-1"><div className="flex justify-center"><span className={`px-1.5 py-0 rounded text-[9px] font-bold border ${riskColor[b.risk]}`}>{b.risk.toUpperCase()}</span></div></td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : anyInfraOn ? (
                          <table className="w-full text-[10px]">
                            <thead>
                              <tr className="text-gray-400 border-b border-gray-100">
                                <th className="text-left px-3 py-1 font-medium">Area</th>
                                <th className="text-center px-1 py-1 font-medium w-10">Projects</th>
                              </tr>
                            </thead>
                            <tbody>
                              {(() => {
                                const brgyCounts: Record<string, number> = {};
                                filteredInfraProjects.forEach(p => {
                                  const b = p.barangay || p.city_municipality || 'Unknown';
                                  if (b !== 'Unknown') brgyCounts[b] = (brgyCounts[b] || 0) + 1;
                                });
                                return Object.entries(brgyCounts)
                                  .sort((a, b) => b[1] - a[1])
                                  .slice(0, 10)
                                  .map(([name, count]) => (
                                    <tr key={name} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                      <td className="px-3 py-1 font-medium text-gray-800">{name}</td>
                                      <td className="text-center px-1 py-1 text-gray-600 font-mono">{count}</td>
                                    </tr>
                                  ));
                              })()}
                            </tbody>
                          </table>
                        ) : (
                          <div className="flex items-center justify-center h-full text-[10px] text-gray-400">No data</div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* ── INTELLIGENCE STACK ────────────────────────── */}
                <div className={`w-full lg:w-[24%] flex flex-col ${darkMode ? 'bg-[#111720]' : 'bg-white'}`}>
                  <div className="cc-panel-header bg-primary-700 px-3 py-1.5 flex items-center gap-1.5 flex-shrink-0">
                    <Brain size={11} className="text-primary-200" />
                    <span className="text-[10px] font-bold text-white uppercase tracking-widest">Intelligence</span>
                  </div>
                  <div className="flex-1 overflow-y-auto cc-scroll">
                    {/* Dynamic quick stats */}
                    <div className="grid grid-cols-2 gap-px bg-gray-200 border-b border-gray-200">
                      {(() => {
                        const stats: { label: string; value: string; icon: React.ReactNode; green?: boolean }[] = [];
                        if (anyIncidentsOn) {
                          // Top incident barangay
                          const brgyCounts: Record<string, number> = {};
                          filteredIncidents.forEach(i => { if (i.barangay) brgyCounts[i.barangay] = (brgyCounts[i.barangay] || 0) + 1; });
                          const topBrgy = Object.entries(brgyCounts).sort((a, b) => b[1] - a[1])[0];
                          stats.push({ label: 'Top Hotspot', value: topBrgy?.[0] ?? 'N/A', icon: <Target size={10} /> });
                          // Top category
                          const catCounts: Record<string, number> = {};
                          filteredIncidents.forEach(i => { if (i.category) catCounts[i.category] = (catCounts[i.category] || 0) + 1; });
                          const topCat = Object.entries(catCounts).sort((a, b) => b[1] - a[1])[0];
                          stats.push({ label: 'Top Category', value: topCat?.[0] ?? 'N/A', icon: <Zap size={10} /> });
                        }
                        if (anyInfraOn) {
                          stats.push({ label: 'Infra Projects', value: String(filteredInfraProjects.length), icon: <Activity size={10} /> });
                          const completedPct = filteredInfraProjects.length > 0
                            ? Math.round(filteredInfraProjects.filter(p => normalizeInfraStatus(p.status) === 'Completed').length / filteredInfraProjects.length * 100)
                            : 0;
                          stats.push({ label: 'Completed', value: `${completedPct}%`, icon: <Signal size={10} />, green: true });
                        }
                        if (showFlights && aircraft.length > 0) {
                          stats.push({ label: 'Live Flights', value: String(aircraft.length), icon: <Signal size={10} /> });
                        }
                        if (anyInfraPOIOn && filteredInfraPOIData.length > 0) {
                          stats.push({ label: 'Infra POIs', value: String(filteredInfraPOIData.length), icon: <MapPin size={10} /> });
                        }
                        if (HAZARD_LAYERS.some(h => hazardLayers[h.key])) {
                          stats.push({ label: 'Hazard Layers', value: String(HAZARD_LAYERS.filter(h => hazardLayers[h.key]).length), icon: <AlertTriangle size={10} /> });
                        }
                        if (PHASE1_OCEAN.some(l => oceanLayers[l.key])) {
                          stats.push({ label: 'Marine Layers', value: String(PHASE1_OCEAN.filter(l => oceanLayers[l.key]).length), icon: <Waves size={10} /> });
                        }
                        if (stats.length === 0) {
                          stats.push(
                            { label: 'Layers', value: '0', icon: <Layers size={10} /> },
                            { label: 'Status', value: 'Idle', icon: <Signal size={10} /> },
                          );
                        }
                        return stats.slice(0, 4).map(s => (
                          <div key={s.label} className="bg-white p-2">
                            <div className="flex items-center gap-1 text-[8px] text-gray-400 uppercase tracking-wider">{s.icon}{s.label}</div>
                            <div className={`text-[11px] font-bold mt-0.5 ${s.green ? 'text-emerald-600' : 'text-gray-900'}`}>{s.value}</div>
                          </div>
                        ));
                      })()}
                    </div>

                    {/* Dynamic insights based on active layers */}
                    <div className="p-2.5 space-y-2">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">Insights</div>

                      {anyIncidentsOn && (
                        <>
                          {/* Incident alert */}
                          {filteredIncidents.filter(i => i.severity === 'high').length > 0 && (
                            <div className="flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded">
                              <AlertTriangle size={12} className="text-red-600 flex-shrink-0" />
                              <div>
                                <div className="text-[10px] font-bold text-red-800">
                                  {filteredIncidents.filter(i => i.severity === 'high').length} HIGH SEVERITY
                                </div>
                                <div className="text-[9px] text-red-700">Active high-severity incidents</div>
                              </div>
                            </div>
                          )}
                          {/* Incident summary */}
                          <div className="p-2 bg-primary-50 border border-primary-200 rounded">
                            <div className="text-[10px] font-bold text-primary-800 mb-0.5 flex items-center gap-1">
                              <Crosshair size={9} />
                              Incident Overview
                            </div>
                            <p className="text-[10px] text-primary-700 leading-relaxed">
                              {filteredIncidents.length} active signals across {new Set(filteredIncidents.map(i => i.barangay).filter(Boolean)).size} barangays.
                              {(() => {
                                const cats: Record<string, number> = {};
                                filteredIncidents.forEach(i => { if (i.category) cats[i.category] = (cats[i.category] || 0) + 1; });
                                const top = Object.entries(cats).sort((a, b) => b[1] - a[1]).slice(0, 2);
                                return top.length > 0 ? ` Top: ${top.map(([k, v]) => `${k} (${v})`).join(', ')}.` : '';
                              })()}
                            </p>
                          </div>
                        </>
                      )}

                      {anyInfraOn && (
                        <div className="p-2 bg-emerald-50 border border-emerald-200 rounded">
                          <div className="text-[10px] font-bold text-emerald-800 mb-0.5 flex items-center gap-1">
                            <Activity size={9} />
                            Infrastructure
                          </div>
                          <p className="text-[10px] text-emerald-700 leading-relaxed">
                            {filteredInfraProjects.length} projects tracked.
                            {' '}{filteredInfraProjects.filter(p => normalizeInfraStatus(p.status) === 'On-Going').length} on-going,
                            {' '}{filteredInfraProjects.filter(p => normalizeInfraStatus(p.status) === 'For Procurement').length} for procurement.
                            {' '}{filteredInfraProjects.filter(p => p.budget_amount).length} with budget data.
                          </p>
                        </div>
                      )}

                      {HAZARD_LAYERS.some(h => hazardLayers[h.key]) && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                          <div className="text-[10px] font-bold text-amber-800 mb-0.5 flex items-center gap-1">
                            <AlertTriangle size={9} />
                            Hazard Assessment
                          </div>
                          <p className="text-[10px] text-amber-700 leading-relaxed">
                            {HAZARD_LAYERS.filter(h => hazardLayers[h.key]).length} hazard layers active:
                            {' '}{[...new Set(HAZARD_LAYERS.filter(h => hazardLayers[h.key]).map(h => h.group))].join(', ')}.
                            {' '}Source: Project NOAH. Cross-reference with population density for exposure analysis.
                          </p>
                        </div>
                      )}

                      {PHASE1_OCEAN.some(l => oceanLayers[l.key]) && (
                        <div className="p-2 bg-cyan-50 border border-cyan-200 rounded">
                          <div className="text-[10px] font-bold text-cyan-800 mb-0.5 flex items-center gap-1">
                            <Waves size={9} />
                            Marine Intelligence
                          </div>
                          <p className="text-[10px] text-cyan-700 leading-relaxed">
                            {oceanLayers.chlorophyll && 'Chlorophyll-a shows phytoplankton density — high values indicate productive fishing zones. '}
                            {oceanLayers.sst && 'SST Anomaly highlights unusual temperature zones — fish aggregate at thermal boundaries. '}
                            {oceanLayers.bathymetry && 'Bathymetry reveals shelf breaks and seamounts that concentrate prey. '}
                            {oceanLayers.salinity && 'Salinity fronts mark where freshwater meets ocean — baitfish aggregate at these boundaries after rainfall. '}
                            {oceanLayers.chlorophyll && oceanLayers.sst && 'Overlay both: high chlorophyll + SST anomaly boundary = probable fishing hotspot. '}
                            {oceanLayers.salinity && oceanLayers.chlorophyll && 'High chlorophyll near a salinity front = active food chain at a freshwater boundary.'}
                          </p>
                        </div>
                      )}

                      {showFlights && aircraft.length > 0 && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded">
                          <div className="text-[10px] font-bold text-amber-800 mb-0.5 flex items-center gap-1">
                            <Signal size={9} />
                            Airspace
                          </div>
                          <p className="text-[10px] text-amber-700 leading-relaxed">
                            {aircraft.length} aircraft tracked within {ADSB_RADIUS_NM}nm.
                            {' '}{aircraft.filter(a => a.alt === 'ground').length} on ground,
                            {' '}{aircraft.filter(a => a.alt !== 'ground').length} airborne.
                            Live feed via ADS-B receivers (ADSB.fi open data).
                          </p>
                        </div>
                      )}

                      {anyInfraPOIOn && filteredInfraPOIData.length > 0 && (
                        <div className="p-2 bg-indigo-50 border border-indigo-200 rounded">
                          <div className="text-[10px] font-bold text-indigo-800 mb-0.5 flex items-center gap-1">
                            <MapPin size={9} />
                            Critical Infrastructure
                          </div>
                          <p className="text-[10px] text-indigo-700 leading-relaxed">
                            {filteredInfraPOIData.length} facilities mapped.
                            {infraPOI.police && ` ${infraPOIData.filter(p => p.category === 'police').length} police stations.`}
                            {infraPOI.hospitals && ` ${infraPOIData.filter(p => p.category === 'hospitals').length} hospitals.`}
                            {infraPOI.pharmacies && ` ${infraPOIData.filter(p => p.category === 'pharmacies').length} pharmacies.`}
                            {' '}Data: BetterGenSan verified + OpenStreetMap.
                          </p>
                        </div>
                      )}

                      {!anyIncidentsOn && !anyInfraOn && !HAZARD_LAYERS.some(h => hazardLayers[h.key]) && !PHASE1_OCEAN.some(l => oceanLayers[l.key]) && !showFlights && !anyInfraPOIOn && (
                        <div className="p-2 bg-gray-50 border border-gray-200 rounded text-[10px] text-gray-500 text-center">
                          Enable layers to see intelligence
                        </div>
                      )}
                    </div>

                    {/* Layer sources */}
                    <div className="px-2.5 pb-2.5">
                      <div className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">Active Sources</div>
                      <div className="space-y-0.5">
                        {anyIncidentsOn && (
                          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-red-500" />
                            <span className="font-medium text-gray-700 flex-1">Incident Reports</span>
                            <span className="text-gray-400 font-mono">{filteredIncidents.length}</span>
                          </div>
                        )}
                        {anyInfraOn && (
                          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-emerald-500" />
                            <span className="font-medium text-gray-700 flex-1">Infrastructure (bisto.ph)</span>
                            <span className="text-gray-400 font-mono">{filteredInfraProjects.length}</span>
                          </div>
                        )}
                        {HAZARD_LAYERS.some(h => hazardLayers[h.key]) && (
                          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-500" />
                            <span className="font-medium text-gray-700 flex-1">Project NOAH</span>
                            <span className="text-gray-400 font-mono">{HAZARD_LAYERS.filter(h => hazardLayers[h.key]).length}</span>
                          </div>
                        )}
                        {PHASE1_OCEAN.some(l => oceanLayers[l.key]) && (
                          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-cyan-500" />
                            <span className="font-medium text-gray-700 flex-1">NASA GIBS / GEBCO</span>
                            <span className="text-gray-400 font-mono">{PHASE1_OCEAN.filter(l => oceanLayers[l.key]).length}</span>
                          </div>
                        )}
                        {showFlights && (
                          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-amber-400" />
                            <span className="font-medium text-gray-700 flex-1">ADSB.fi (live)</span>
                            <span className="text-gray-400 font-mono">{aircraft.length}</span>
                          </div>
                        )}
                        {showShips && (
                          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-indigo-400" />
                            <span className="font-medium text-gray-700 flex-1">OpenSeaMap (OSM)</span>
                            <span className="text-gray-400 font-mono">{nauticalFeatures.length}</span>
                          </div>
                        )}
                        {anyInfraPOIOn && (
                          <div className="flex items-center gap-1.5 px-1.5 py-1 rounded text-[10px]">
                            <span className="w-1.5 h-1.5 rounded-full flex-shrink-0 bg-indigo-500" />
                            <span className="font-medium text-gray-700 flex-1">Critical Infra (BG+OSM)</span>
                            <span className="text-gray-400 font-mono">{filteredInfraPOIData.length}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="px-2.5 pb-2.5">
                      <div className="p-2 bg-amber-50 border border-amber-200 rounded text-[9px] text-amber-700 flex items-start gap-1">
                        <AlertTriangle size={9} className="mt-0.5 flex-shrink-0" />
                        <span>All mapping is approximate. Locations are estimated from report text. Community-powered — not an official source.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
