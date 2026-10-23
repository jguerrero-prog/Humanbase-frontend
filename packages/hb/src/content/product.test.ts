import { analysisOptions, productFooter, productSectionFor, productSections } from './product';

describe('product navigation', () => {
  it('names the sections for what people bring, with Docs under Resources', () => {
    expect(productSections.map((section) => section.label)).toEqual(['Genes & gene sets', 'Variants & sequences', 'Resources', 'About']);
    expect(productFooter.groups.map((group) => group.heading)).toEqual(productSections.map((section) => section.label));
    expect(productFooter.groups[2]?.links.map((link) => link.label)).toEqual(['Data sources', 'Downloads', 'Humanbase API', 'Docs']);
  });

  it('marks the section that holds a page, including docs pages', () => {
    expect(productSectionFor('/docs/')).toBe('Resources');
    expect(productSectionFor('/docs/sei/')).toBe('Resources');
    expect(productSectionFor('/netwas/0a1b')).toBe('Genes & gene sets');
    expect(productSectionFor('/variant-effects')).toBe('Variants & sequences');
    expect(productSectionFor('/cite/')).toBe('About');
    expect(productSectionFor('/')).toBeUndefined();
  });

  it('offers each analysis by its route', () => {
    expect(analysisOptions.map((option) => option.value)).toEqual(['networks', 'modules', 'netwas', 'variant-effects', 'seqweaver', 'expression-effects']);
  });
});
