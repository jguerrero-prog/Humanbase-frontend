import { bbiTestFile, type TestFile } from './bbiTestFile';
import { GenomeLocation } from './GenomeLocation';
import type { GenomeTracks } from './GenomeTracks';
import { UserTrackError, UserTracks, assemblyProblem } from './UserTracks';
import { UserTrackStore } from './UserTrackStore';

const hg19 = GenomeLocation.chromosomes('hg19');
const hg38 = GenomeLocation.chromosomes('hg38');
const on = (sizes: Readonly<Record<string, number>>, bare = false) => ['chr1', 'chr2'].map((chrom) => ({ name: bare ? chrom.slice(3) : chrom, length: sizes[chrom] ?? 0 }));

const fileOf = (name: string, spec: TestFile) => new File([bbiTestFile(spec).slice().buffer], name);
const signal = (bare = false): TestFile => ({
  kind: 'bigWig',
  chromosomes: on(hg19, bare),
  items: [
    { chrom: bare ? '1' : 'chr1', start: 1_000, end: 1_010, value: 2.5 },
    { chrom: bare ? '1' : 'chr1', start: 1_010, end: 1_020, value: -1 },
  ],
});

const base: GenomeTracks = {
  genes: () => Promise.resolve([]),
  scores: () => Promise.reject(new Error('base')),
  segments: () => Promise.reject(new Error('base')),
  sequence: () => Promise.resolve(undefined),
  covers: () => Promise.resolve(false),
};

describe('assemblyProblem', () => {
  it('accepts chromosomes with the assembly’s lengths, named chr1 or 1', () => {
    expect(assemblyProblem(on(hg19), 'hg19', 'a.bw')).toBeUndefined();
    expect(assemblyProblem([...on(hg19, true), { name: 'GL000192.1', length: 547_496 }], 'hg19', 'a.bw')).toBeUndefined();
  });

  it('names the other assembly when the file is on it', () => {
    expect(assemblyProblem(on(hg38), 'hg19', 'a.bw')).toBe('“a.bw” is on GRCh38/hg38, and this browser shows GRCh37/hg19. Add a GRCh37/hg19 copy of the file.');
  });

  it('says which chromosome is off, or that none can be placed', () => {
    expect(assemblyProblem([{ name: 'chr1', length: 1_000 }], 'hg38', 'a.bb')).toBe('“a.bb” doesn’t match GRCh38/hg38: chr1 is 1,000 bases in the file and 248,956,422 on GRCh38/hg38.');
    expect(assemblyProblem([{ name: 'scaffold_1', length: 1_000 }], 'hg19', 'a.bb')).toMatch(/no chromosomes named like chr1 or 1/);
  });
});

describe('UserTracks', () => {
  it('reads a bigWig from the person’s own file, with its range, and remembers it for that browser', async () => {
    const tracks = new UserTracks(base, undefined, new UserTrackStore());
    const { track, remembered } = await tracks.add('asd:hg19', fileOf('H3K27ac.bw', signal()), 'hg19', ['H3K27ac']);
    expect(remembered).toBe(true);
    expect(track).toMatchObject({ name: 'H3K27ac (2)', kind: 'bigWig', source: 'Your file', range: [-1, 2.5], bare: false });
    const scores = await tracks.scores(track.key, { chrom: 'chr1', start: 1, end: 5_000 });
    expect(scores).toEqual([
      { start: 1_001, end: 1_010, value: 2.5 },
      { start: 1_011, end: 1_020, value: -1 },
    ]);
    expect(await tracks.covers('hg19', { chrom: 'chr3', start: 1, end: 5_000 }, track.key)).toBe(true);
    expect(await tracks.covers('hg19', { chrom: 'chr3', start: 1, end: 5_000 })).toBe(false);
    expect((await tracks.list('asd:hg19')).map((one) => one.key)).toEqual([track.key]);
    expect(await tracks.list('variant-results:hg19')).toEqual([]);
    await tracks.remove('asd:hg19', track.key);
    expect(await tracks.list('asd:hg19')).toEqual([]);
  });

  it('forgets a removed track’s file for the rest of the visit too', async () => {
    const tracks = new UserTracks(base, undefined, new UserTrackStore());
    const { track } = await tracks.add('asd:hg19', fileOf('H3K27ac.bw', signal()), 'hg19', []);
    await tracks.remove('asd:hg19', track.key);
    expect(await tracks.covers('hg19', { chrom: 'chr1', start: 1, end: 5_000 }, track.key)).toBe(false);
    await expect(tracks.scores(track.key, { chrom: 'chr1', start: 1, end: 5_000 })).rejects.toThrow('base');
  });

  it('reads files that name chromosomes without chr, and bigBed segments in their own colors', async () => {
    const tracks = new UserTracks(base, undefined, new UserTrackStore());
    const { track } = await tracks.add('asd:hg19', fileOf('bare.bw', signal(true)), 'hg19', []);
    expect(track.bare).toBe(true);
    expect(await tracks.scores(track.key, { chrom: 'chr1', start: 1_001, end: 1_005 })).toHaveLength(1);
    const states = fileOf('states.bb', { kind: 'bigBed', chromosomes: on(hg19), items: [{ chrom: 'chr2', start: 99, end: 400, rest: 'Tss\t0\t.\t99\t400\t255,0,0' }] });
    const { track: segments } = await tracks.add('asd:hg19', states, 'hg19', []);
    expect(segments).toMatchObject({ name: 'states', kind: 'bigBed', range: undefined });
    expect(await tracks.segments(segments.key, { chrom: 'chr2', start: 1, end: 1_000 })).toEqual([{ start: 100, end: 400, name: 'Tss', color: '#FF0000', score: 0 }]);
  });

  it('says why a file or address can’t be added', async () => {
    const tracks = new UserTracks(base, undefined, new UserTrackStore());
    const reason = (source: File | string, assembly: 'hg19' | 'hg38' = 'hg19') => tracks.add('asd:hg19', source, assembly, []).then(() => '', (error: unknown) => (error instanceof UserTrackError ? error.message : `not a UserTrackError: ${String(error)}`));
    expect(await reason(new File(['chr1\t0\t10\t1\n'], 'peaks.bedGraph'))).toMatch(/^“peaks.bedGraph” is a text file. .*bedGraphToBigWig/);
    expect(await reason(new File(['x'], 'reads.bam'))).toBe('“reads.bam” can’t be shown here yet. Add a bigWig or bigBed file.');
    expect(await reason(new File(['not a track file at all'], 'odd.bw'))).toBe('“odd.bw” isn’t a bigWig or bigBed file.');
    expect(await reason(fileOf('H3K27ac.bw', signal()), 'hg38')).toMatch(/^“H3K27ac.bw” is on GRCh37\/hg19, and this browser shows GRCh38\/hg38/);
    expect(await reason('ftp://example.org/a.bw')).toBe('Enter the full address of a bigWig or bigBed file, starting with https://.');
  });

  it('leaves Humanbase’s own files to the reader underneath', async () => {
    const tracks = new UserTracks(base, undefined, new UserTrackStore());
    await expect(tracks.scores('https://humanbase.s3.amazonaws.com/tracks/dis_dna.bw', { chrom: 'chr1', start: 1, end: 10 })).rejects.toThrow('base');
  });
});
