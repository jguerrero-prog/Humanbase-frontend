import type { Crumb, DocsNavGroup, DocsSection, ImageSizes } from '@humanbase/ui';

export type DocsGroup = 'get-started' | 'network-analysis' | 'sequence-analysis' | 'use-cases';

export interface DocsPage {
  title: string;
  slug: string;
  group: DocsGroup;
  /** The sidebar label; use cases have none, since they sit under Use cases. */
  label?: string;
  order: number;
  /** The page on humanbase.readthedocs.io it was imported from. */
  live: string;
  sections: DocsSection[];
  images: ImageSizes;
  markdown: string;
  route: string;
}

const groupLabels: Record<Exclude<DocsGroup, 'use-cases'>, string> = {
  'get-started': 'Get started',
  'network-analysis': 'Network analysis',
  'sequence-analysis': 'Sequence analysis',
};

const useCasesSlug = 'use-cases';

export const docsRoute = (slug: string) => (slug ? `/docs/${slug}/` : '/docs/');

/** Splits a page file into its JSON front matter and the Markdown after it. */
export function parsePage(file: string): DocsPage {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(file);
  if (!match?.[1]) throw new Error('A docs page is missing its front matter.');
  const front = JSON.parse(match[1]) as Omit<DocsPage, 'markdown' | 'route'>;
  return { ...front, markdown: file.slice(match[0].length), route: docsRoute(front.slug) };
}

/** The docs imported from readthedocs: pages by route, the sidebar, breadcrumbs and old .html addresses. */
export class DocsLibrary {
  readonly pages: readonly DocsPage[];
  private readonly bySlug: Map<string, DocsPage>;

  constructor(files: readonly string[]) {
    this.pages = files.map(parsePage).sort((a, b) => a.order - b.order);
    this.bySlug = new Map(this.pages.map((page) => [page.slug, page]));
  }

  page(slug: string): DocsPage | undefined {
    return this.bySlug.get(slug.replace(/^\/+|\/+$/g, ''));
  }

  /** The clean route for a readthedocs address under /docs/, such as sei.html or use-cases/sei-use-case.html. */
  legacyRoute(path: string): string | undefined {
    const match = /^\/?(.*?)\.html$/.exec(path);
    if (!match) return undefined;
    const slug = match[1] === 'index' || match[1] === 'usage' ? '' : (match[1] ?? '');
    return this.bySlug.has(slug) ? docsRoute(slug) : undefined;
  }

  useCases(): DocsPage[] {
    return this.pages.filter((page) => page.group === 'use-cases');
  }

  navGroups(current: DocsPage | undefined): DocsNavGroup[] {
    return Object.entries(groupLabels).map(([group, label]) => ({
      label,
      items: this.pages
        .filter((page) => page.group === group && page.label)
        .map((page) => ({
          label: page.label ?? page.title,
          href: page.route,
          ...(page === current ? { current: 'page' as const } : current?.group === 'use-cases' && page.slug === useCasesSlug ? { current: 'true' as const } : {}),
        })),
    }));
  }

  breadcrumbs(page: DocsPage): Crumb[] {
    const docs = { label: 'Docs', href: docsRoute('') };
    if (!page.slug) return [{ label: 'Docs' }];
    const useCases = this.page(useCasesSlug);
    const parent = page.group === 'use-cases' && useCases ? [{ label: useCases.label ?? useCases.title, href: useCases.route }] : [];
    return [docs, ...parent, { label: page.title }];
  }
}

const files = import.meta.glob<string>('./pages/**/*.md', { query: '?raw', import: 'default', eager: true });

export const docsLibrary = new DocsLibrary(Object.values(files));
