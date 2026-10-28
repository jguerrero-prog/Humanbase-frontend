import { trackFile } from './GenomeBrowserEngine';
import { genomeTrackList, hiddenByDefault, inOrder, moveTrack, suggestedTracks, userDataTrack } from './genomeTrackList';

describe('genomeTrackList', () => {
  it('lists the tracks in drawing order, with Conservation and GM12878 ChromHMM suggested on hg19 only', () => {
    const hg19 = genomeTrackList('hg19', suggestedTracks.hg19);
    expect(hg19.map((track) => track.id)).toEqual(['sequence', 'Conservation', 'GM12878 ChromHMM', 'genes']);
    expect(hg19[0]).toEqual({ id: 'sequence', name: 'Sequence', meta: 'GRCh37/hg19' });
    expect(hg19[2]).toEqual({ id: 'GM12878 ChromHMM', name: 'GM12878 ChromHMM', meta: 'Genome segmentation' });
    expect(suggestedTracks.hg19.map(trackFile)).toEqual(['https://s3-us-west-2.amazonaws.com/humanbase/tracks/phastCons46way.bw', 'https://s3-us-west-2.amazonaws.com/humanbase/tracks/gm12878.ChromHMM.bb']);
    expect(hiddenByDefault('hg19')).toEqual(['Conservation', 'GM12878 ChromHMM']);
    expect(genomeTrackList('hg38', suggestedTracks.hg38)).toEqual([
      { id: 'sequence', name: 'Sequence', meta: 'GRCh38/hg38' },
      { id: 'genes', name: 'Genes', meta: 'GENCODE 21' },
    ]);
  });
});

describe('userDataTrack', () => {
  it('draws a bigWig someone added over its own range, with a true minus, and a bigBed as segments', () => {
    const scores = userDataTrack({ key: 'https://example.org/rna.bw', name: 'rna', kind: 'bigWig', source: 'example.org', range: [-3.2094, 6.97], bare: false });
    expect(scores).toMatchObject({ name: 'rna', meta: 'example.org, −3.209 to 6.97', bigWigUrl: 'https://example.org/rna.bw', range: [-3.209, 6.97] });
    expect(userDataTrack({ key: 'file:1/states.bb', name: 'states', kind: 'bigBed', source: 'Your file', bare: false })).toMatchObject({ name: 'states', meta: 'Your file', bigBedUrl: 'file:1/states.bb' });
    expect(userDataTrack({ key: 'file:1/states.bb', name: 'states', kind: 'bigBed', source: 'Your file', bare: false })).toMatchObject({ fallbackColor: 'var(--viz-seq-6)' });
  });
});

describe('track order', () => {
  const ids = ['sequence', 'DNA', 'RNA', 'genes'];

  it('keeps the stored order, and puts tracks it doesn’t list after the track before them', () => {
    expect(inOrder(ids, [])).toEqual(ids);
    expect(inOrder(ids, ['genes', 'sequence', 'RNA', 'DNA'])).toEqual(['genes', 'sequence', 'RNA', 'DNA']);
    expect(inOrder(ids, ['genes', 'sequence', 'gone'])).toEqual(['genes', 'sequence', 'DNA', 'RNA']);
    expect(inOrder(ids, ['RNA'])).toEqual(['sequence', 'DNA', 'RNA', 'genes']);
  });

  it('moves a track past the next shown one and stops at either end', () => {
    expect(moveTrack(ids, [], 'RNA', -1)).toEqual(['sequence', 'RNA', 'DNA', 'genes']);
    expect(moveTrack(ids, ['RNA'], 'DNA', 1)).toEqual(['sequence', 'genes', 'RNA', 'DNA']);
    expect(moveTrack(ids, [], 'sequence', -1)).toEqual(ids);
    expect(moveTrack(ids, [], 'genes', 1)).toEqual(ids);
  });
});
