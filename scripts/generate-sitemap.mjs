#!/usr/bin/env node
// generate-sitemap.mjs — writes dist/sitemap.xml at build time.
// Run after `vite build` so the dist/ directory already exists.

import { writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST = join(__dirname, '..', 'dist');
const DOMAIN = 'https://bettergensan.org';
const TODAY = new Date().toISOString().slice(0, 10);

// [path, changefreq, priority]
const ROUTES = [
  ['/', 'weekly', '1.0'],
  ['/services', 'weekly', '0.8'],
  ['/services/business', 'weekly', '0.9'],
  ['/services/tax-payments', 'weekly', '0.8'],
  ['/services/certificates', 'weekly', '0.8'],
  ['/services/health-services', 'weekly', '0.7'],
  ['/services/social-welfare', 'weekly', '0.7'],
  ['/services/education', 'monthly', '0.6'],
  ['/services/disaster-preparedness', 'weekly', '0.7'],
  ['/services/agriculture-fisheries', 'monthly', '0.6'],
  ['/services/infrastructure-public-works', 'monthly', '0.6'],
  ['/services/environment', 'monthly', '0.6'],
  ['/services/housing-land-use', 'monthly', '0.6'],
  ['/eboss', 'weekly', '0.9'],
  ['/jobs', 'daily', '0.8'],
  ['/procurement', 'daily', '0.7'],
  ['/eo', 'weekly', '0.6'],
  ['/splis', 'weekly', '0.6'],
  ['/government', 'monthly', '0.7'],
  ['/government/departments', 'monthly', '0.7'],
  ['/government/officials', 'monthly', '0.6'],
  ['/city-profile', 'monthly', '0.5'],
  ['/population', 'monthly', '0.5'],
  ['/city-map', 'monthly', '0.5'],
  ['/about', 'monthly', '0.4'],
  ['/faq', 'monthly', '0.4'],
  ['/terms', 'yearly', '0.2'],
  ['/privacy', 'yearly', '0.2'],
  ['/accessibility', 'yearly', '0.2'],
];

const urls = ROUTES.map(
  ([path, freq, priority]) => `  <url>
    <loc>${DOMAIN}${path}</loc>
    <lastmod>${TODAY}</lastmod>
    <changefreq>${freq}</changefreq>
    <priority>${priority}</priority>
  </url>`
).join('\n');

const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

writeFileSync(join(DIST, 'sitemap.xml'), xml, 'utf8');
console.log(`Sitemap written → dist/sitemap.xml (${ROUTES.length} URLs)`);
