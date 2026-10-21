import { GenomeLocation } from './GenomeLocation';

describe('GenomeLocation', () => {
  it('reads the new and today’s location formats, and gene names', () => {
    const view = GenomeLocation.parse('chr1:109,792,590-109,842,590') as GenomeLocation;
    expect(view.format()).toBe('chr1:109,792,590-109,842,590');
    expect((GenomeLocation.parse('1:109,767,590..109,867,590') as GenomeLocation).format()).toBe('chr1:109,767,590-109,867,590');
    expect(GenomeLocation.parse('SORT1')).toEqual({ gene: 'SORT1' });
    expect(GenomeLocation.parse('chr1:abc')).toBeUndefined();
  });

  it('links a position to the UCSC Genome Browser on its own assembly', () => {
    expect(GenomeLocation.at('10', 89622510).ucscUrl).toBe('https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=chr10:89622510');
    expect(GenomeLocation.at('chr3', 12598855, 'hg38').ucscUrl).toBe('https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg38&position=chr3:12598855');
  });

  it('says where the view is in words', () => {
    const view = new GenomeLocation('chr1', 109_792_590, 109_842_590);
    expect(view.help()).toBe('GRCh37/hg19. 50 kb shown. A gene name works too.');
    expect(view.regionLabel(3)).toBe('Genome browser, chr1:109,792,590-109,842,590, GRCh37/hg19, 3 tracks');
    expect(view.fileName()).toBe('chr1_109792590-109842590_hg19.svg');
    expect(GenomeLocation.widthInWords(200)).toBe('200 bp');
    expect(GenomeLocation.widthInWords(3_100_000)).toBe('3.1 Mb');
  });

  it('zooms by stops around the center and moves by a fraction of the view', () => {
    const view = new GenomeLocation('chr1', 109_792_590, 109_842_590);
    expect(view.zoom('in').width).toBe(2_000);
    expect(view.zoom('out').width).toBe(500_000);
    expect(view.zoom('in').center).toBe(view.center);
    expect(view.move(0.1).start).toBe(109_797_590);
  });

  it('stops at the end of the chromosome and says so', () => {
    const { location, message } = new GenomeLocation('chr1', 249_240_000, 249_290_000).clamp(249_250_621);
    expect(location.end).toBe(249_250_621);
    expect(message).toBe('chr1 ends at 249,250,621 on GRCh37/hg19. Showing up to the end.');
    expect(GenomeLocation.geneNotFound('ILB1')).toBe('No gene named “ILB1” on GRCh37/hg19. Check the spelling, or enter a position such as chr2:113,594,867.');
  });

  it('names a range as the chr_and_variant_range parameter and finds the variant nearest its center', () => {
    const view = new GenomeLocation('chr1', 2_230_000, 2_440_000);
    expect(view.variantRange).toBe('1:2230000:2440000');
    expect(view.includes('1', 2_337_101)).toBe(true);
    expect(view.includes('chr2', 2_337_101)).toBe(false);
    const variants = [{ chromosome: 'chr1', position: 2_250_000 }, { chromosome: 'chr1', position: 2_330_000 }, { chromosome: 'chr1', position: 2_500_000 }];
    expect(view.nearest(variants)).toBe(variants[1]);
    expect(new GenomeLocation('chr1', 2_480_000, 2_490_000).nearest(variants)).toBeUndefined();
  });

  // The requests humanbase.io sent on job 76aea8fe as its browser moved, October 21, 2026.
  it('reads predictions for the view as humanbase.io does', () => {
    const read = new GenomeLocation('chr1', 109_767_590, 109_867_590);
    const inside = new GenomeLocation('chr1', 109_781_044, 109_858_955);
    expect(new GenomeLocation('chr1', 109_767_590, 109_867_590).readRange(undefined).variantRange).toBe('1:109767590:109867590');
    expect(inside.readRange(read)).toBe(read);
    expect(new GenomeLocation('chr1', 109_765_632, 109_874_367).readRange(read).variantRange).toBe('1:109765632:109874367');
    expect(new GenomeLocation('chr1', 109_800_000, 109_900_000).readRange(read).variantRange).toBe('1:109767590:109950000');
    expect(new GenomeLocation('chr1', 109_740_000, 109_840_000).readRange(read).variantRange).toBe('1:109690000:109867590');
    expect(new GenomeLocation('chr10', 23_480_451, 23_536_275).readRange(read).variantRange).toBe('10:23480451:23536275');
  });
});
