import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const src = dirname(fileURLToPath(import.meta.url));
const pagesDir = join(src, 'pages');
const comparisonsDir = join(src, 'data', 'existing-and-proposed');

const comparisonSlugs = (): string[] =>
  readdirSync(comparisonsDir)
    .filter((file) => file.endsWith('.json'))
    .map((file) => (JSON.parse(readFileSync(join(comparisonsDir, file), 'utf8')) as { slug: string }).slug);

const routeOf = (file: string): string => `/${file.replace(/\.astro$/, '/').replace(/(^|\/)index\/$/, '$1')}`;

/** Every route the design system site builds, read from its page files, so a new page needs no list. */
export function docsRoutes(): string[] {
  return readdirSync(pagesDir, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('.astro') && file !== '404.astro')
    .sort()
    .flatMap((file) => {
      if (file === 'existing-and-proposed/[slug].astro') return comparisonSlugs().sort().map((slug) => `/existing-and-proposed/${slug}/`);
      if (file.includes('[')) throw new Error(`docsRoutes does not know the routes of ${file}; add them here.`);
      return [routeOf(file)];
    });
}
