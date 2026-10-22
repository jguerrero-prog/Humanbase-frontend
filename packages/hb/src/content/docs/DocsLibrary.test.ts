import { docsLibrary } from './DocsLibrary';
import { DocsSearchIndex, snippet } from './DocsSearchIndex';

describe('docsLibrary', () => {
  it('holds every imported page, with the user guide at /docs/', () => {
    expect(docsLibrary.pages).toHaveLength(30);
    expect(docsLibrary.page('')?.title).toBe('Humanbase User Guide');
    expect(docsLibrary.page('sei')?.route).toBe('/docs/sei/');
    expect(docsLibrary.page('use-cases/sei-use-case/')?.title).toBe('Sei use case');
    expect(docsLibrary.page('nothing')).toBeUndefined();
  });

  it('groups the sidebar like the live docs and marks the open page', () => {
    const groups = docsLibrary.navGroups(docsLibrary.page('sei'));
    expect(groups.map((group) => group.label)).toEqual(['Get started', 'Network analysis', 'Sequence analysis']);
    expect(groups[0]?.items.map((item) => item.label)).toEqual(['Humanbase user guide', 'Use cases', 'Citations', 'Reproducing legacy results']);
    expect(groups[2]?.items.find((item) => item.label === 'Sei')?.current).toBe('page');
  });

  it('marks Use cases while a use case is open, and puts it in the breadcrumbs', () => {
    const page = docsLibrary.page('use-cases/sei-use-case');
    if (!page) throw new Error('Sei use case is missing');
    expect(docsLibrary.navGroups(page)[0]?.items[1]).toMatchObject({ label: 'Use cases', current: 'true' });
    expect(docsLibrary.breadcrumbs(page)).toEqual([{ label: 'Docs', href: '/docs/' }, { label: 'Use cases', href: '/docs/use-cases/' }, { label: 'Sei use case' }]);
  });

  it('lists each page’s h2 sections, with the open use case under its Use cases section', () => {
    const sei = docsLibrary.navGroups(docsLibrary.page('sei'))[2]?.items.find((item) => item.label === 'Sei');
    expect(sei?.sections?.map((section) => [section.label, section.href, section.id])).toEqual([
      ['Introduction', '/docs/sei/#introduction', 'introduction'],
      ['Input', '/docs/sei/#input', 'input'],
      ['Output', '/docs/sei/#output', 'output'],
    ]);
    const useCases = docsLibrary.navGroups(docsLibrary.page('use-cases/sei-use-case'))[0]?.items[1];
    expect(useCases?.sections?.map((section) => [section.label, section.level ?? 1, section.current ?? false])).toEqual([
      ['Sequence Analysis Use Cases', 1, false],
      ['Sei use case', 2, true],
      ['Network Analysis Use Cases', 1, false],
      ['Tutorials', 1, false],
    ]);
  });

  it('maps readthedocs addresses to clean routes', () => {
    expect(docsLibrary.legacyRoute('sei.html')).toBe('/docs/sei/');
    expect(docsLibrary.legacyRoute('use-cases/sei-use-case.html')).toBe('/docs/use-cases/sei-use-case/');
    expect(docsLibrary.legacyRoute('index.html')).toBe('/docs/');
    expect(docsLibrary.legacyRoute('usage.html')).toBe('/docs/');
    expect(docsLibrary.legacyRoute('missing.html')).toBeUndefined();
    expect(docsLibrary.legacyRoute('sei')).toBeUndefined();
  });

  it('keeps every live heading id in the front matter', () => {
    expect(docsLibrary.page('sei')?.sections.map((section) => section.id)).toEqual(['sei', 'introduction', 'input', 'large-submissions', 'output', 'sequence-classes', 'regulatory-feature-scores']);
  });
});

describe('DocsSearchIndex', () => {
  const index = new DocsSearchIndex(docsLibrary.pages);

  it('finds sections by heading and text, best first', () => {
    const [first] = index.search('sequence classes');
    expect(first).toMatchObject({ href: '/docs/sei/#sequence-classes', title: 'Sequence classes', page: 'Sei' });
  });

  it('needs every word to match', () => {
    expect(index.search('netwas zzzz')).toEqual([]);
    expect(index.search('  ')).toEqual([]);
  });

  it('shortens text around the match', () => {
    const text = `${'word '.repeat(60)}needle ${'tail '.repeat(60)}`;
    const result = snippet(text, ['needle']);
    expect(result).toContain('needle');
    expect(result.startsWith('…')).toBe(true);
    expect(result.endsWith('…')).toBe(true);
  });
});
