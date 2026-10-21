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
});
