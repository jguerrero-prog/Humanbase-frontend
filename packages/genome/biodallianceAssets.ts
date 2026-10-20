import { cpSync, createReadStream, existsSync, statSync } from 'node:fs';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Connect, Plugin } from 'vite';

/** The unmodified Biodalliance release this repository vendors. */
export const biodallianceDir = fileURLToPath(new URL('./vendor/biodalliance-0.13/', import.meta.url));
/** Where the web app serves it, under the app's base path. */
export const biodallianceFolder = 'biodalliance';

const types: Record<string, string> = {
  '.js': 'text/javascript', '.css': 'text/css', '.gif': 'image/gif', '.svg': 'image/svg+xml',
  '.woff': 'font/woff', '.ttf': 'font/ttf', '.otf': 'font/otf', '.eot': 'application/vnd.ms-fontobject',
};

function serve(base: string): Connect.NextHandleFunction {
  const prefix = `${base.replace(/\/$/, '')}/${biodallianceFolder}/`;
  return (request, response, next) => {
    const path = (request.url ?? '').split('?')[0] ?? '';
    if (!path.startsWith(prefix)) return next();
    const file = normalize(join(biodallianceDir, decodeURIComponent(path.slice(prefix.length))));
    if (!file.startsWith(biodallianceDir.replace(/[\\/]$/, '') + sep) || !existsSync(file) || !statSync(file).isFile()) return next();
    response.setHeader('Content-Type', types[extname(file)] ?? 'application/octet-stream');
    createReadStream(file).pipe(response);
  };
}

/** Serves the vendored Biodalliance from the app's own origin in dev and preview, and copies it into every build. */
export function biodallianceAssets(): Plugin {
  let base = '/';
  let outDir = 'dist';
  return {
    name: 'humanbase-biodalliance-assets',
    configResolved(config) {
      base = config.base;
      outDir = config.build.outDir;
    },
    configureServer(server) {
      server.middlewares.use(serve(base));
    },
    configurePreviewServer(server) {
      server.middlewares.use(serve(base));
    },
    closeBundle() {
      cpSync(biodallianceDir, join(outDir, biodallianceFolder), { recursive: true });
    },
  };
}
