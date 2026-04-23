import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { createHash } from 'node:crypto';
import { mkdir, readFile, stat, writeFile } from 'node:fs/promises';
import { dirname, join } from 'node:path';

// 24 hours in milliseconds
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

/**
 * Caching proxy for Regiment API.
 *
 * Browser calls /api/regiment/<module>/<tool>?<params>.
 * The middleware:
 *   1. Hashes the full path+query to a cache key.
 *   2. If a cached response exists and is fresher than CACHE_TTL_MS, serves it.
 *   3. Otherwise, fetches https://regiment.me/api/v1/modules/<module>/<tool>
 *      with the X-API-Key header, writes the response to disk, and serves it.
 *
 * The API key never reaches the browser, and the Regiment API is only hit
 * at most once per unique request every 24 hours.
 */
function regimentCachingProxy(apiKey: string | undefined): Plugin {
  const cacheDir = join(process.cwd(), '.cache', 'regiment');
  const UPSTREAM = 'https://regiment.me/api/v1/modules';

  const send = (
    res: import('node:http').ServerResponse,
    status: number,
    body: unknown,
    cacheStatus: 'HIT' | 'MISS' | 'BYPASS' = 'BYPASS'
  ) => {
    res.statusCode = status;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.setHeader('X-Regiment-Cache', cacheStatus);
    res.end(typeof body === 'string' ? body : JSON.stringify(body));
  };

  return {
    name: 'regiment-caching-proxy',
    configureServer(server) {
      server.middlewares.use('/api/regiment', async (req, res) => {
        try {
          const reqUrl = req.url ?? '/';
          const upstreamPath = reqUrl.replace(/^\/+/, '');
          const cacheKey = createHash('sha1').update(reqUrl).digest('hex');
          const cacheFile = join(cacheDir, `${cacheKey}.json`);

          // Try cache first
          try {
            const st = await stat(cacheFile);
            if (Date.now() - st.mtimeMs < CACHE_TTL_MS) {
              const cached = await readFile(cacheFile, 'utf8');
              return send(res, 200, cached, 'HIT');
            }
          } catch {
            // cache miss — fall through
          }

          if (!apiKey) {
            return send(
              res,
              500,
              { error: 'REGIMENT_API_KEY is not set in .env.local' },
              'BYPASS'
            );
          }

          // Fetch upstream
          const upstreamUrl = `${UPSTREAM}/${upstreamPath}`;
          const upstreamRes = await fetch(upstreamUrl, {
            headers: { 'X-API-Key': apiKey },
          });
          const text = await upstreamRes.text();

          if (!upstreamRes.ok) {
            return send(
              res,
              upstreamRes.status,
              { error: 'Regiment upstream error', status: upstreamRes.status },
              'BYPASS'
            );
          }

          // Persist and serve
          await mkdir(dirname(cacheFile), { recursive: true });
          await writeFile(cacheFile, text, 'utf8');
          return send(res, 200, text, 'MISS');
        } catch (err) {
          return send(
            res,
            500,
            { error: err instanceof Error ? err.message : 'Proxy error' },
            'BYPASS'
          );
        }
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env.local etc. so REGIMENT_API_KEY (no VITE_ prefix) is available
  // here at dev-server startup. It stays server-side and is never bundled.
  const env = loadEnv(mode, process.cwd(), '');
  const regimentKey = env.REGIMENT_API_KEY;

  const isProd = mode === 'production';

  return {
    plugins: [react(), tailwindcss(), regimentCachingProxy(regimentKey)],
    assetsInclude: ['**/*.md'],
    server: {
      proxy: {
        // ADSB.fi live aircraft positions — CORS proxy for dev.
        // Production should use a Supabase Edge Function proxy.
        '/api/adsb': {
          target: 'https://opendata.adsb.fi',
          changeOrigin: true,
          rewrite: path => path.replace(/^\/api\/adsb/, '/api/v2'),
        },
      },
    },
    // Production hardening:
    //   - Strip all `console.*` and `debugger` statements from the bundle so
    //     diagnostic warnings (gensanCache fallbacks, etc.) never reach the
    //     end user's DevTools.
    //   - Disable sourcemaps so internal file paths aren't shipped.
    //   - Drop legal comments to keep the bundle tight.
    // Source code is unchanged — devs still see warnings during `npm run dev`.
    esbuild: isProd
      ? {
          drop: ['console', 'debugger'],
          legalComments: 'none',
        }
      : undefined,
    build: {
      sourcemap: false,
      minify: 'esbuild',
    },
  };
});
