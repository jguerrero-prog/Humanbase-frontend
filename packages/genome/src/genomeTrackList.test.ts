import { trackFile } from './GenomeBrowserEngine';
import { genomeTrackList, hiddenByDefault, suggestedTracks, userDataTrack } from './genomeTrackList';

describe('genomeTrackList', () => {
  it('lists the tracks in drawing order, with Conservation and GM12878 ChromHMM suggested on hg19 only', () => {
    const hg19 = genomeTrackList('hg19', suggestedTracks.hg19);
    expect(hg19.map((track) => track.id)).toEqual(['sequence', 'Conservation', 'GM12878 ChromHMM', 'genes']);
    expect(hg19[0]).toEqual({ id: 'sequence', name: 'Sequence', meta: 'GRCh37/hg19' });
    expect(hg19[2]).toEqual({ id: 'GM12878 ChromHMM', name: 'GM12878 ChromHMM', meta: 'Genome segmentation' });
    expect(suggestedTracks.hg19.map(trackFile)).toEqual(['https://humanbase.s3.amazonaws.com/tracks/phastCons46way.bw', 'https://humanbase.s3.amazonaws.com/tracks/gm12878.ChromHMM.bb']);
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
    expect(scores).toMatchObject({ name: 'rna', meta: 'example.org, −3.209 to 6.97', bigWigUrl: 'https://example.org/rna.bw', range: [-3.2094, 6.97] });
    expect(userDataTrack({ key: 'file:1/states.bb', name: 'states', kind: 'bigBed', source: 'Your file', bare: false })).toMatchObject({ name: 'states', meta: 'Your file', bigBedUrl: 'file:1/states.bb' });
  });
});
