import { SampleClient } from '../sample/SampleClient';
import { geneModels, segmentOf, transcriptOf } from './GenomeTracks';
import { SampleGenomeTracks } from './SampleGenomeTracks';

const dna = 'https://s3-us-west-2.amazonaws.com/humanbase/tracks/dis_dna.bw';
const view = { chrom: 'chr1', start: 2_230_000, end: 2_440_000 };
const chromHmm = 'https://humanbase.s3.amazonaws.com/tracks/gm12878.ChromHMM.bb';

describe('geneModels', () => {
  it('reads GENCODE lines 1-based and merges a gene’s transcripts', () => {
    const first = transcriptOf({ start: 99, end: 400, rest: 'ENST1\t1000\t+\t149\t350\t0,0,0\t2\t101,101\t0,200\tENSG1\tGENE1\tprotein_coding' });
    const second = transcriptOf({ start: 249, end: 500, rest: 'ENST2\t1000\t+\t0\t0\t0,0,0\t2\t51,51\t0,200\tENSG1\tGENE1\tretained_intron' });
    expect(first).toMatchObject({ name: 'GENE1', start: 100, end: 400, thickStart: 150, thickEnd: 350, blocks: [[100, 200], [300, 400]] });
    expect(geneModels([first, second])).toEqual([
      { name: 'GENE1', strand: '+', start: 100, end: 500, type: 'protein_coding', score: 1000, exons: [[100, 200], [250, 400], [450, 500]], coding: [[150, 200], [300, 350]] },
    ]);
  });
});

describe('segmentOf', () => {
  it('reads a ChromHMM line 1-based, with its code and the file’s own color', () => {
    expect(segmentOf({ start: 109_816_600, end: 109_818_400, rest: 'ReprW\t1000\t.\t109816600\t109818400\t127,127,127' })).toEqual({ start: 109_816_601, end: 109_818_400, name: 'ReprW', color: '#7F7F7F', score: 1000 });
    expect(segmentOf({ start: 0, end: 200, rest: 'Tss\t1000\t.\t0\t200\t255,0,0' }).color).toBe('#FF0000');
  });

  it('leaves the color empty for a file with no itemRgb, so the browser draws its own track color', () => {
    expect(segmentOf({ start: 0, end: 200, rest: 'Peak1\t500\t+' }).color).toBe('');
    expect(segmentOf({ start: 0, end: 200, rest: 'Peak1\t500\t+\t0\t200\t0' }).color).toBe('');
  });
});

describe('SampleGenomeTracks', () => {
  const tracks = new SampleGenomeTracks(SampleClient.bundled());

  it('answers the ASD Browser’s first view from the recorded window', async () => {
    const genes = await tracks.genes('hg19', view);
    expect(genes.map((gene) => gene.name)).toEqual(expect.arrayContaining(['SKI', 'MORN1', 'RER1', 'PEX10', 'PLCH2']));
    const scores = await tracks.scores(dna, view);
    expect(scores).toHaveLength(34);
    expect(scores.find((point) => point.start === 2_337_101)?.value).toBeCloseTo(3.427);
  });

  it('answers GM12878 ChromHMM segments from the recorded windows', async () => {
    const segments = await tracks.segments(chromHmm, { chrom: 'chr1', start: 109_792_590, end: 109_842_590 });
    expect(segments).toHaveLength(39);
    expect(segments[0]).toEqual({ start: 109_792_001, end: 109_792_800, name: 'PromP', color: '#CF0BC6', score: 1000 });
    expect(segments.find((segment) => segment.start === 109_816_601)).toEqual({ start: 109_816_601, end: 109_818_400, name: 'ReprW', color: '#7F7F7F', score: 1000 });
    expect((await tracks.segments(chromHmm, view)).length).toBeGreaterThan(0);
  });

  it('reads sequence near the window’s center, and none elsewhere', async () => {
    expect((await tracks.sequence('hg19', { chrom: 'chr1', start: 2_335_000, end: 2_335_009 }))?.bases).toMatch(/^[ACGTN]{10}$/);
    expect(await tracks.sequence('hg19', { chrom: 'chr1', start: 2_240_000, end: 2_240_009 })).toBeUndefined();
  });

  it('fails outside the recorded windows, so the track says it didn’t load', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    await expect(tracks.genes('hg19', { chrom: 'chr3', start: 1, end: 100 })).rejects.toThrow();
    vi.restoreAllMocks();
  });
});
