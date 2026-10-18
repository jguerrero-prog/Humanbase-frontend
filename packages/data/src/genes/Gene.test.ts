import { Gene, type GeneRecord } from './Gene';

const record = (versions: string[]): GeneRecord => ({
  url: '',
  entrez: 3553,
  systematic_name: 'IL1B',
  standard_name: 'IL1B',
  description: 'interleukin 1 beta',
  xrefs: [],
  aliases: ['IL1F2', 'IL1beta'],
  versions_available: versions,
});

describe('Gene', () => {
  it('is in a network when the API lists at least one data version', () => {
    const gene = new Gene(record(['v1', 'v3']));
    expect(gene.isInAnyNetwork).toBe(true);
    expect(gene.isInVersion('v3')).toBe(true);
  });

  it('is in no network when versions_available is empty, as AUTS12 is', () => {
    expect(new Gene(record([])).isInAnyNetwork).toBe(false);
  });
});
