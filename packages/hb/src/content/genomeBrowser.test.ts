import { GenomeBrowserLink, genomeBrowserPreview } from './genomeBrowser';

const read = (query: string) => GenomeBrowserLink.read(new URLSearchParams(query));

describe('GenomeBrowserLink', () => {
  it('links a gene and a variant to /genome/ while the preview is on', () => {
    expect(genomeBrowserPreview).toBe(true);
    expect(GenomeBrowserLink.gene('IL1B')).toBe('/genome/?gene=IL1B');
    expect(GenomeBrowserLink.variant('5', 150226123)).toBe('/genome/?location=chr5:150226123');
  });

  it('opens humanbase.io’s /genome view on GRCh37/hg19 when the link names nothing', () => {
    expect(read('')).toEqual({ assembly: 'hg19', gene: undefined, location: undefined, variant: undefined });
    expect(GenomeBrowserLink.start('hg19').format()).toBe('chr1:2,230,000-2,440,000');
  });

  it('reads a gene, a range and an assembly', () => {
    const view = read('gene=IL1B&location=chr2:113,587,327-113,594,480&assembly=hg38');
    expect(view.gene).toBe('IL1B');
    expect(view.assembly).toBe('hg38');
    expect(view.location?.format()).toBe('chr2:113,587,327-113,594,480');
    expect(view.variant).toBeUndefined();
  });

  it('centers 50 kb on a variant position and marks it', () => {
    const view = read('location=chr1:877047');
    expect(view.location?.format()).toBe('chr1:852,047-902,047');
    expect(view.variant?.start).toBe(877047);
  });

  it('keeps the marked variant once the view has moved', () => {
    const view = read('location=chr1:900,000-950,000&variant=chr1:877047');
    expect(view.location?.format()).toBe('chr1:900,000-950,000');
    expect(view.variant?.start).toBe(877047);
  });

  it('leaves out a place it can’t read', () => {
    expect(read('location=chr30:1-100').location).toBeUndefined();
    expect(read('location=nowhere').location).toBeUndefined();
  });
});
