#!/usr/bin/env node
/**
 * clean-boundaries.mjs
 *
 * Cleans barangay polygons and regenerates the city boundary from them.
 * Barangays are the source of truth; the city border is derived.
 *
 * Usage:  node scripts/clean-boundaries.mjs
 * Output: src/data/gensan_barangays_clean.geojson
 *         src/data/gensan_city_boundary_regenerated.geojson
 *         scripts/boundary-report.txt
 */

import fs from 'fs';
import path from 'path';
import * as turf from '@turf/turf';

// ── Load source data ────────────────────────────────────────────────

// Extract the JSON from the TS file (find matching braces)
const brgyTs = fs.readFileSync('src/data/gensanBarangays.ts', 'utf8');
const brgyStart = brgyTs.indexOf('{"type"');
let brgyDepth = 0, brgyEnd = brgyStart;
for (let i = brgyStart; i < brgyTs.length; i++) {
  if (brgyTs[i] === '{') brgyDepth++;
  if (brgyTs[i] === '}') brgyDepth--;
  if (brgyDepth === 0) { brgyEnd = i + 1; break; }
}
const brgyCollection = JSON.parse(brgyTs.slice(brgyStart, brgyEnd));

const boundaryTs = fs.readFileSync('src/data/gensanBoundary.ts', 'utf8');

const report = [];
const log = (msg) => { report.push(msg); console.log(msg); };

log('=== GenSan Boundary Cleaning Report ===');
log(`Date: ${new Date().toISOString()}`);
log(`Input barangays: ${brgyCollection.features.length}`);
log('');

// ── Step 1: Validate & repair each barangay ─────────────────────────

const fixes = [];
const cleanFeatures = [];

for (const feature of brgyCollection.features) {
  const name = feature.properties?.name || 'UNNAMED';
  const issues = [];

  let geom = feature.geometry;

  // Normalize MultiPolygon with single ring to Polygon
  if (geom.type === 'MultiPolygon' && geom.coordinates.length === 1) {
    geom = { type: 'Polygon', coordinates: geom.coordinates[0] };
    issues.push('converted single-ring MultiPolygon to Polygon');
  }

  // Ensure rings are closed
  if (geom.type === 'Polygon') {
    for (const ring of geom.coordinates) {
      const first = ring[0];
      const last = ring[ring.length - 1];
      if (first[0] !== last[0] || first[1] !== last[1]) {
        ring.push([...first]);
        issues.push('closed unclosed ring');
      }
    }
  } else if (geom.type === 'MultiPolygon') {
    for (const poly of geom.coordinates) {
      for (const ring of poly) {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          ring.push([...first]);
          issues.push('closed unclosed ring in MultiPolygon');
        }
      }
    }
  }

  // Remove duplicate consecutive vertices
  const removeDupes = (ring) => {
    const clean = [ring[0]];
    for (let i = 1; i < ring.length; i++) {
      if (ring[i][0] !== ring[i - 1][0] || ring[i][1] !== ring[i - 1][1]) {
        clean.push(ring[i]);
      }
    }
    return clean;
  };

  if (geom.type === 'Polygon') {
    const origLen = geom.coordinates[0].length;
    geom.coordinates = geom.coordinates.map(removeDupes);
    const newLen = geom.coordinates[0].length;
    if (newLen < origLen) issues.push(`removed ${origLen - newLen} duplicate vertices`);
  } else if (geom.type === 'MultiPolygon') {
    for (let p = 0; p < geom.coordinates.length; p++) {
      geom.coordinates[p] = geom.coordinates[p].map(removeDupes);
    }
  }

  // Check minimum vertices (need at least 4 for a valid polygon ring: 3 + close)
  let valid = true;
  if (geom.type === 'Polygon') {
    if (geom.coordinates[0].length < 4) {
      issues.push('INVALID: fewer than 4 vertices in outer ring');
      valid = false;
    }
  }

  // Ensure correct winding order (outer ring counter-clockwise per GeoJSON spec)
  try {
    const rewound = turf.rewind({ type: 'Feature', properties: feature.properties, geometry: geom }, { mutate: false });
    geom = rewound.geometry;
  } catch (e) {
    issues.push(`rewind failed: ${e.message}`);
  }

  // Try to create a valid turf feature to detect self-intersections
  try {
    const testFeature = turf.feature(geom);
    // Use buffer(0) trick to fix self-intersections
    const buffered = turf.buffer(testFeature, 0, { units: 'meters' });
    if (buffered && buffered.geometry) {
      // Check if buffer changed the geometry (indicates self-intersection was fixed)
      const origArea = turf.area(testFeature);
      const buffArea = turf.area(buffered);
      if (Math.abs(origArea - buffArea) > 1) { // >1 sq meter difference
        issues.push(`fixed self-intersection (area delta: ${Math.abs(origArea - buffArea).toFixed(1)} m²)`);
        geom = buffered.geometry;
      }
    }
  } catch (e) {
    issues.push(`buffer(0) repair failed: ${e.message}`);
  }

  if (issues.length > 0) {
    fixes.push({ name, issues });
  }

  if (valid) {
    cleanFeatures.push({
      type: 'Feature',
      properties: { name },
      geometry: geom,
    });
  } else {
    log(`  SKIPPED ${name}: invalid geometry`);
  }
}

log(`Cleaned ${cleanFeatures.length} barangays`);
if (fixes.length > 0) {
  log(`\nFixes applied:`);
  for (const f of fixes) {
    log(`  ${f.name}: ${f.issues.join('; ')}`);
  }
}
log('');

// ── Step 2: Check for overlaps between barangays ────────────────────

log('Checking for overlaps...');
let overlapCount = 0;
const overlapPairs = [];

for (let i = 0; i < cleanFeatures.length; i++) {
  for (let j = i + 1; j < cleanFeatures.length; j++) {
    try {
      const a = cleanFeatures[i];
      const b = cleanFeatures[j];

      // Quick bbox check first
      const bboxA = turf.bbox(a);
      const bboxB = turf.bbox(b);
      if (bboxA[2] < bboxB[0] || bboxB[2] < bboxA[0] ||
          bboxA[3] < bboxB[1] || bboxB[3] < bboxA[1]) continue;

      const intersection = turf.intersect(turf.featureCollection([a, b]));
      if (intersection) {
        const area = turf.area(intersection);
        if (area > 100) { // >100 sq meters
          overlapCount++;
          overlapPairs.push({
            a: a.properties.name,
            b: b.properties.name,
            area: area,
          });
        }
      }
    } catch {
      // intersect can fail on degenerate geometries
    }
  }
}

if (overlapPairs.length > 0) {
  log(`Found ${overlapPairs.length} overlapping pairs:`);
  for (const p of overlapPairs) {
    log(`  ${p.a} ↔ ${p.b}: ${(p.area / 1000000).toFixed(4)} km²`);
  }
} else {
  log('No significant overlaps found.');
}
log('');

// ── Step 3: Union all barangays to create city boundary ─────────────

log('Building city boundary from barangay union...');

let cityBoundary = cleanFeatures[0];
for (let i = 1; i < cleanFeatures.length; i++) {
  try {
    const result = turf.union(turf.featureCollection([cityBoundary, cleanFeatures[i]]));
    if (result) cityBoundary = result;
  } catch (e) {
    log(`  WARNING: union failed for ${cleanFeatures[i].properties.name}: ${e.message}`);
    // Try buffer trick to fix and retry
    try {
      const fixed = turf.buffer(cleanFeatures[i], 0.001, { units: 'kilometers' });
      const result = turf.union(turf.featureCollection([cityBoundary, fixed]));
      if (result) {
        cityBoundary = result;
        log(`    → fixed with buffer and retried successfully`);
      }
    } catch {
      log(`    → retry also failed, skipping`);
    }
  }
}

// Clean up slivers from the dissolved boundary
try {
  cityBoundary = turf.buffer(cityBoundary, 0, { units: 'meters' });
} catch { /* noop */ }

// Set properties
cityBoundary.properties = { name: 'General Santos City' };

// ── Step 4: Check for gaps ──────────────────────────────────────────

log('Checking for gaps...');
const cityArea = turf.area(cityBoundary);
let sumBarangayArea = 0;
for (const f of cleanFeatures) {
  sumBarangayArea += turf.area(f);
}
const gapArea = cityArea - sumBarangayArea;
// Positive gap means city is bigger (gaps between barangays)
// Negative means overlaps make barangay sum bigger than city
log(`City boundary area: ${(cityArea / 1000000).toFixed(4)} km²`);
log(`Sum of barangay areas: ${(sumBarangayArea / 1000000).toFixed(4)} km²`);
log(`Difference (gaps - overlaps): ${(gapArea / 1000000).toFixed(4)} km²`);
if (Math.abs(gapArea) < 10000) {
  log('Gap/overlap negligible (<0.01 km²)');
} else if (gapArea > 0) {
  log(`WARNING: ${(gapArea / 1000000).toFixed(4)} km² of gaps between barangays`);
} else {
  log(`NOTE: ${(Math.abs(gapArea) / 1000000).toFixed(4)} km² of overlap between barangays`);
}
log('');

// ── Step 5: Verify no barangay extends outside city border ──────────

log('Verifying containment...');
let escapees = 0;
for (const f of cleanFeatures) {
  try {
    const diff = turf.difference(turf.featureCollection([f, cityBoundary]));
    if (diff) {
      const diffArea = turf.area(diff);
      if (diffArea > 10) { // >10 sq meters
        log(`  ${f.properties.name} extends ${diffArea.toFixed(0)} m² outside city border`);
        escapees++;
      }
    }
  } catch { /* noop */ }
}
if (escapees === 0) log('All barangays contained within city boundary. ✓');
log('');

// ── Step 6: Export ──────────────────────────────────────────────────

const cleanCollection = {
  type: 'FeatureCollection',
  features: cleanFeatures,
};

const outDir = 'src/data';
fs.writeFileSync(
  path.join(outDir, 'gensan_barangays_clean.geojson'),
  JSON.stringify(cleanCollection),
);
fs.writeFileSync(
  path.join(outDir, 'gensan_city_boundary_regenerated.geojson'),
  JSON.stringify({
    type: 'FeatureCollection',
    features: [cityBoundary],
  }),
);

log('Exported:');
log(`  ${outDir}/gensan_barangays_clean.geojson (${cleanFeatures.length} features)`);
log(`  ${outDir}/gensan_city_boundary_regenerated.geojson`);

// Write report
fs.writeFileSync('scripts/boundary-report.txt', report.join('\n') + '\n');
log('\nReport saved to scripts/boundary-report.txt');
