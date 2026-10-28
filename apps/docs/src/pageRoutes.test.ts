import { describe, expect, it } from 'vitest';
import { navigation } from './navigation';
import { docsRoutes } from './pageRoutes';

describe('docsRoutes', () => {
  const routes = docsRoutes();

  it('turns page files into the routes Astro serves', () => {
    expect(routes).toContain('/');
    expect(routes).toContain('/components/buttons/');
    expect(routes).toContain('/existing-and-proposed/');
    expect(routes).toContain('/existing-and-proposed/homepage/');
    expect(routes).not.toContain('/404/');
    expect(routes.every((route) => /^\/([a-z0-9-]+\/)*$/.test(route))).toBe(true);
    expect(new Set(routes).size).toBe(routes.length);
  });

  it('includes every page in the menu', () => {
    const hrefs = navigation.flatMap((section) => section.items).flatMap((item) => (item.href ? [item.href.replace(/#.*$/, '')] : []));
    expect(hrefs.length).toBeGreaterThan(50);
    for (const href of hrefs) expect(routes).toContain(href);
  });
});
