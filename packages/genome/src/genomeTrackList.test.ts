import { genomeTrackList, hiddenByDefault, suggestedTracks } from './genomeTrackList';

describe('genomeTrackList', () => {
  it('lists the tracks in drawing order, with Conservation suggested on hg19 only', () => {
    const hg19 = genomeTrackList('hg19', suggestedTracks.hg19);
    expect(hg19.map((track) => track.id)).toEqual(['sequence', 'Conservation', 'genes']);
    expect(hg19[0]).toEqual({ id: 'sequence', name: 'Sequence', meta: 'GRCh37/hg19' });
    expect(suggestedTracks.hg19[0]?.bigWigUrl).toBe('https://humanbase.s3.amazonaws.com/tracks/phastCons46way.bw');
    expect(hiddenByDefault('hg19')).toEqual(['Conservation']);
    expect(genomeTrackList('hg38', suggestedTracks.hg38)).toEqual([
      { id: 'sequence', name: 'Sequence', meta: 'GRCh38/hg38' },
      { id: 'genes', name: 'Genes', meta: 'GENCODE 21' },
    ]);
  });
});
