import type { GenomeTracks } from '@humanbase/data';
import { chromHmmTrack as chromHmm } from './humanbaseFiles';
import { userDataTrack } from './genomeTrackList';
import { scoreTrack } from './scoreTrack';
import { bedGraphLines, bedLines, TrackDownload } from './trackDownload';

const span = { chrom: 'chr1', start: 2_230_000, end: 2_440_000 };
const conservation = scoreTrack({ name: 'Conservation', source: 'phastCons 46-way', bigWigUrl: 'https://humanbase.s3.amazonaws.com/tracks/phastCons46way.bw', range: [0, 1] });
const impact = scoreTrack({ name: 'DNA disease impact score', source: 'Model score', bigWigUrl: 'https://humanbase.s3.amazonaws.com/tracks/asd/dna.bw', range: [-0.5, 3] });

describe('bedGraphLines', () => {
  it('writes scores 0-based and half-open, in order, cut to the span, at full precision', () => {
    const points = [
      { start: 2_346_202, end: 2_346_202, value: 3.6189358234405518 },
      { start: 2_229_990, end: 2_230_009, value: 0.5 },
      { start: 2_439_995, end: 2_440_020, value: -0.25 },
      { start: 2_440_100, end: 2_440_200, value: 1 },
    ];
    expect(bedGraphLines('chr1', points, span)).toEqual(['chr1\t2229999\t2230009\t0.5', 'chr1\t2346201\t2346202\t3.6189358234405518', 'chr1\t2439994\t2440000\t-0.25']);
  });
});

describe('bedLines', () => {
  it('writes BED9 with each segment’s name, score and itemRgb, and 0 for no color', () => {
    const segments = [
      { start: 109_816_601, end: 109_818_400, name: 'ReprW', color: '#C0C0C0', score: 0 },
      { start: 109_818_401, end: 109_819_000, name: 'Quies', color: '', score: 1000 },
    ];
    expect(bedLines('chr1', segments)).toEqual(['chr1\t109816600\t109818400\tReprW\t0\t.\t109816600\t109818400\t192,192,192', 'chr1\t109818400\t109819000\tQuies\t1000\t.\t109818400\t109819000\t0']);
  });
});

describe('TrackDownload', () => {
  it('names the file after the track, assembly and stretch, in the format of the track’s file', () => {
    const scores = new TrackDownload(conservation, 'hg19');
    expect([scores.format, scores.fileType, scores.fileName(span)]).toEqual(['bedGraph', 'bigWig', 'Conservation_hg19_chr1-2230000-2440000.bedgraph']);
    const segments = new TrackDownload(chromHmm, 'hg19');
    expect([segments.format, segments.fileType, segments.fileName(span)]).toEqual(['BED', 'bigBed', 'GM12878-ChromHMM_hg19_chr1-2230000-2440000.bed']);
    expect(new TrackDownload(impact, 'hg38').fileName({ ...span, chrom: '1' })).toBe('DNA-disease-impact-score_hg38_chr1-2230000-2440000.bedgraph');
  });

  it('links the whole file only when it has an address', () => {
    expect(new TrackDownload(conservation, 'hg19').sourceUrl).toBe('https://humanbase.s3.amazonaws.com/tracks/phastCons46way.bw');
    const yours = userDataTrack({ key: 'file:1234/H3K27ac.bw', name: 'H3K27ac', kind: 'bigWig', source: 'Your file', range: [0, 10], bare: false });
    expect(new TrackDownload(yours, 'hg19').sourceUrl).toBeUndefined();
  });

  it('keeps a download to 1 Mb', () => {
    const download = new TrackDownload(conservation, 'hg19');
    expect(download.fits({ chrom: 'chr1', start: 1, end: 1_000_000 })).toBe(true);
    expect(download.fits({ chrom: 'chr1', start: 1, end: 1_000_001 })).toBe(false);
  });

  it('reads the stretch at full resolution through the tracks’ own reader', async () => {
    const files = {
      scores: vi.fn(() => Promise.resolve([{ start: 2_346_202, end: 2_346_202, value: 3.5 }])),
      segments: vi.fn(() => Promise.resolve([{ start: 2_230_001, end: 2_231_000, name: 'Quies', color: '#FFFFFF', score: 0 }])),
    } as unknown as GenomeTracks;
    expect(await new TrackDownload(impact, 'hg19').contents(files, span)).toBe('chr1\t2346201\t2346202\t3.5\n');
    expect(files.scores).toHaveBeenCalledWith(impact.bigWigUrl, span);
    expect(await new TrackDownload(chromHmm, 'hg19').contents(files, span)).toBe('chr1\t2230000\t2231000\tQuies\t0\t.\t2230000\t2231000\t255,255,255\n');
  });
});
