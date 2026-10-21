import { SampleClient } from '../sample/SampleClient';
import { geneModels, transcriptOf } from './GenomeTracks';
import { SampleGenomeTracks } from './SampleGenomeTracks';

const dna = 'https://s3-us-west-2.amazonaws.com/humanbase/tracks/dis_dna.bw';
const view = { chrom: 'chr1', start: 2_230_000, end: 2_440_000 };

describe('geneModels', () => {
  it('reads GENCODE lines 1-based and merges a gene’s transcripts', () => {
    const first = transcriptOf({ start: 99, end: 400, rest: 'ENST1\t1000\t+\t149\t350\t0,0,0\t2\t101,101\t0,200\tENSG1\tGENE1\tprotein_coding' });
    const second = transcriptOf({ start: 249, end: 500, rest: 'ENST2\t1000\t+\t0\t0\t0,0,0\t2\t51,51\t0,200\tENSG1\tGENE1\tretained_intron' });
    expect(first).toMatchObject({ name: 'GENE1', start: 100, end: 400, thickStart: 150, thickEnd: 350, blocks: [[100, 200], [300, 400]] });
    expect(geneModels([first, second])).toEqual([
      { name: 'GENE1', strand: '+', start: 100, end: 500, type: 'protein_coding', exons: [[100, 200], [250, 400], [450, 500]], coding: [[150, 200], [300, 350]] },
    ]);
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
