const base = import.meta.env.BASE_URL.replace(/\/$/, '');

/** Prefixes a site path with the base the docs are served under, such as /Humanbase-frontend/ on GitHub Pages. */
export const withBase = (path: string): string => (path.startsWith('/') ? `${base}${path}` : path);
