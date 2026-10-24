import { DeepseaService, SampleClient, variantScoreTypes } from '@humanbase/data';
import { jobScoreTracks } from './jobScoreTracks';

const service = new DeepseaService(SampleClient.bundled());
const tracksOf = async (id: string) => {
  const job = await service.get(id);
  return jobScoreTracks(job, variantScoreTypes(job.model, await service.scoreTypes(id)));
};
const file = (id: string, score: string) => `https://s3-us-west-2.amazonaws.com/humanbase/deepsea/jobs/${id}/${id}_variant_${score}.bw`;

describe('jobScoreTracks', () => {
  it('draws the Seqweaver example’s two score files, as humanbase.io names them, over 0 to 3', async () => {
    const id = '76aea8fe-8ec7-4698-a193-a186c7665edb';
    const tracks = await tracksOf(id);
    expect(tracks.map(({ name, meta, bigWigUrl, range }) => ({ name, meta, bigWigUrl, range }))).toEqual([
      { name: 'Disease impact score', meta: 'This job, 0 to 3', bigWigUrl: file(id, 'dis'), range: [0, 3] },
      { name: 'Mean −log e-value', meta: 'This job, 0 to 3', bigWigUrl: file(id, 'mean-evalue'), range: [0, 3] },
    ]);
    expect(tracks[0]?.style).toEqual({ type: 'default', style: { glyph: 'HISTOGRAM', BGCOLOR: 'var(--viz-seq-6)', HEIGHT: 60, MIN: 0, MAX: 3 } });
  });

  it('draws only Sei’s summary score and only ExPecto’s signed expression effect', async () => {
    expect((await tracksOf('2e18fedf-3de7-4d08-a894-9a937a2b860b')).map((track) => track.name)).toEqual(['Max sequence class score']);
    const [expecto, ...others] = await tracksOf('e504e3cc-6a9a-4f35-99e3-9185d6f5c4a1');
    expect(others).toEqual([]);
    expect(expecto).toMatchObject({ name: 'Max ExPecto expression effect', meta: 'This job, −0.5 to 0.5', range: [-0.5, 0.5] });
  });
});
