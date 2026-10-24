import { assemblyNames, GenomeLocation, type Assembly } from './GenomeLocation';
import type { GeneModel, GenomeSpan, GenomeTracks, ScorePoint, Segment, SequenceSpan } from './GenomeTracks';
import { S3GenomeTracks, type TrackFileHeader } from './S3GenomeTracks';
import { UserTrackStore } from './UserTrackStore';

/** A track someone added from their own file or by its address; it stays in their browser. */
export interface UserTrack {
  /** What its reads go by: the address, or file: and an id for a file from their computer. */
  key: string;
  name: string;
  kind: TrackFileHeader['kind'];
  /** "Your file", or the address's host. */
  source: string;
  /** A bigWig's lowest and highest values, so its bars fit the track. */
  range?: [number, number] | undefined;
  /** The file names chromosomes 1, 2 and X rather than chr1. */
  bare: boolean;
}

/** Says, in words for the person, why a track can't be added. */
export class UserTrackError extends Error {}

export const yourFile = 'Your file';

const count = new Intl.NumberFormat('en-US');
const assemblies: readonly Assembly[] = ['hg19', 'hg38'];
const indexed = /\.(bw|bigwig|bb|bigbed)$/i;
const textTracks = /\.(bed|bedgraph|bg|wig|txt)(\.gz)?$/i;
const notYet = /\.(bam|bai|cram|vcf|vcf\.gz|tbi|gff|gff3|gtf)$/i;

const mainChromosome = (name: string) => {
  const bare = name.replace(/^chr/i, '').toUpperCase();
  return /^([1-9]|1\d|2[0-2]|X|Y)$/.test(bare) ? `chr${bare}` : undefined;
};

/** Why a file's chromosomes don't fit the browser's assembly, or undefined when they do. chrM is left out, as GRCh37 and hg19 differ there. */
export function assemblyProblem(chromosomes: readonly { name: string; length: number }[], assembly: Assembly, name: string): string | undefined {
  const main = chromosomes.flatMap(({ name: chrom, length }) => {
    const known = mainChromosome(chrom);
    return known ? [{ chrom: known, length }] : [];
  });
  const shown = assemblyNames[assembly];
  if (!main.length) return `“${name}” has no chromosomes named like chr1 or 1, so it can’t be placed on ${shown}.`;
  const fits = (on: Assembly) => main.every(({ chrom, length }) => GenomeLocation.chromosomes(on)[chrom] === length);
  if (fits(assembly)) return undefined;
  const other = assemblies.find((on) => on !== assembly && fits(on));
  if (other) return `“${name}” is on ${assemblyNames[other]}, and this browser shows ${shown}. Add a ${shown} copy of the file.`;
  const sizes = GenomeLocation.chromosomes(assembly);
  const wrong = main.find(({ chrom, length }) => sizes[chrom] !== length) ?? main[0];
  return `“${name}” doesn’t match ${shown}: ${wrong?.chrom ?? ''} is ${count.format(wrong?.length ?? 0)} bases in the file and ${count.format(sizes[wrong?.chrom ?? ''] ?? 0)} on ${shown}.`;
}

function fileProblem(name: string): string | undefined {
  if (textTracks.test(name)) return `“${name}” is a text file. Convert BED to bigBed with bedToBigBed, or bedGraph and WIG to bigWig with bedGraphToBigWig or wigToBigWig, then add that file.`;
  if (notYet.test(name)) return `“${name}” can’t be shown here yet. Add a bigWig or bigBed file.`;
  return undefined;
}

function readProblem(name: string, address: URL | undefined, error: unknown): string {
  const message = error instanceof Error ? error.message : String(error);
  if (/not a BigWig\/BigBed/i.test(message)) return `“${name}” isn’t a bigWig or bigBed file.`;
  if (!address) return `“${name}” couldn’t be read. ${message}`;
  if (/expected 206/.test(message)) return `${address.host} sent the whole file instead of the parts asked for. Its server has to answer byte-range requests.`;
  const status = /HTTP (\d{3})/.exec(message)?.[1];
  if (status) return `${address.host} answered HTTP ${status}. Check the address.`;
  return `Humanbase couldn’t read the file at ${address.host}. Its server has to let other sites read it (CORS) and answer byte-range requests, or it may be offline.`;
}

const withoutExtension = (name: string) => name.replace(indexed, '') || name;

const uniqueName = (name: string, taken: readonly string[]) => {
  let unique = name;
  for (let copy = 2; taken.includes(unique); copy += 1) unique = `${name} (${copy})`;
  return unique;
};

const rangeOf = ({ scoreMin, scoreMax }: TrackFileHeader): [number, number] => {
  const range: [number, number] = [Math.min(0, scoreMin), Math.max(0, scoreMax)];
  return range[0] === range[1] ? [0, 1] : range;
};

/**
 * The genome browsers' file reader with the person's own tracks added: their reads go to the file or
 * address, everything else to the reader underneath. Added tracks are remembered per browser and assembly.
 */
export class UserTracks implements GenomeTracks {
  private readonly added = new Map<string, UserTrack>();

  constructor(
    private readonly base: GenomeTracks,
    private readonly reader = new S3GenomeTracks(),
    private readonly store = new UserTrackStore(),
  ) {}

  /** The tracks added to this browser before, in the order they were added. */
  async list(group: string): Promise<UserTrack[]> {
    const stored = await this.store.list(group);
    return stored.flatMap(({ track, file }) => {
      if (track.source === yourFile && !file) return [];
      this.keep(track, file);
      return [track];
    });
  }

  /** Checks a file or address and adds it; remembered is false when the browser wouldn't store it, so it lasts this visit only. */
  async add(group: string, source: File | string, assembly: Assembly, taken: readonly string[]): Promise<{ track: UserTrack; remembered: boolean }> {
    const track = await this.check(source, assembly, taken);
    try {
      await this.store.put(group, track, typeof source === 'string' ? undefined : source);
      return { track, remembered: true };
    } catch {
      return { track, remembered: false };
    }
  }

  remove(group: string, key: string): Promise<void> {
    return this.store.remove(group, key);
  }

  genes(assembly: Assembly, span: GenomeSpan): Promise<GeneModel[]> {
    return this.base.genes(assembly, span);
  }

  sequence(assembly: Assembly, span: GenomeSpan): Promise<SequenceSpan | undefined> {
    return this.base.sequence(assembly, span);
  }

  scores(bigWigUrl: string, span: GenomeSpan, bins?: number): Promise<ScorePoint[]> {
    const track = this.added.get(bigWigUrl);
    return track ? this.reader.scores(bigWigUrl, this.inFile(track, span), bins) : this.base.scores(bigWigUrl, span, bins);
  }

  segments(bigBedUrl: string, span: GenomeSpan): Promise<Segment[]> {
    const track = this.added.get(bigBedUrl);
    return track ? this.reader.segments(bigBedUrl, this.inFile(track, span)) : this.base.segments(bigBedUrl, span);
  }

  private async check(source: File | string, assembly: Assembly, taken: readonly string[]): Promise<UserTrack> {
    const file = typeof source === 'string' ? undefined : source;
    const address = typeof source === 'string' ? URL.parse(source.trim()) ?? undefined : undefined;
    const problem = file ? fileProblem(file.name) : !address || !/^https?:$/.test(address.protocol) ? 'Enter the full address of a bigWig or bigBed file, starting with https://.' : undefined;
    if (problem) throw new UserTrackError(problem);
    const name = file?.name ?? decodeURIComponent(address?.pathname.split('/').at(-1) || address?.host || '');
    const key = file ? `file:${crypto.randomUUID()}/${file.name}` : (address?.href ?? '');
    if (file) this.reader.addFile(key, file);
    let header: TrackFileHeader;
    try {
      header = await this.reader.header(key);
    } catch (error) {
      throw new UserTrackError(readProblem(name, address, error));
    }
    const mismatch = assemblyProblem(header.chromosomes, assembly, name);
    if (mismatch) throw new UserTrackError(mismatch);
    const track: UserTrack = {
      key,
      name: uniqueName(withoutExtension(name), taken),
      kind: header.kind,
      source: address?.host ?? yourFile,
      range: header.kind === 'bigWig' ? rangeOf(header) : undefined,
      bare: !header.chromosomes.some((chrom) => chrom.name.startsWith('chr')),
    };
    this.keep(track, file);
    return track;
  }

  private keep(track: UserTrack, file: Blob | undefined) {
    this.added.set(track.key, track);
    if (file) this.reader.addFile(track.key, file);
  }

  private inFile(track: UserTrack, span: GenomeSpan): GenomeSpan {
    if (!track.bare) return span;
    const chrom = span.chrom.replace(/^chr/, '');
    return { ...span, chrom: chrom === 'M' ? 'MT' : chrom };
  }
}
