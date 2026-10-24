// Also imported by scripts/record-samples.mjs, so it imports only packages and uses only syntax Node can strip.
import type { Assembly } from './GenomeLocation';
import { trackFiles } from './GenomeTracks.ts';

/** Where a gene sits on the genome: the span of its transcripts. */
export interface GeneSpan {
  chrom: string;
  start: number;
  end: number;
}

/** Finds a gene's span by name on an assembly, hg19 unless named. */
export interface GeneLocator {
  locate(name: string, assembly?: Assembly): Promise<GeneSpan | undefined>;
}

const transcriptsRead = 10;

/** Looks genes up in the static files the live genome browser reads: the assembly's gene name index, then its GENCODE transcripts. */
export class S3GeneLocator implements GeneLocator {
  private readonly tracks: string;

  constructor(tracks = 'https://humanbase.s3.amazonaws.com/tracks/') {
    this.tracks = tracks;
  }

  async locate(name: string, assembly: Assembly = 'hg19'): Promise<GeneSpan | undefined> {
    // The readers load only when someone searches a gene.
    const [{ default: Trix }, { BigBed }, { RemoteFile }] = await Promise.all([import('@gmod/trix'), import('@gmod/bbi'), import('generic-filehandle2')]);
    const word = name.trim().toLowerCase();
    const files = trackFiles[assembly];
    const index = new Trix(new RemoteFile(`${this.tracks}${files.geneIndex}.ixx`), new RemoteFile(`${this.tracks}${files.geneIndex}.ix`));
    const transcripts = (await index.search(word)).filter(([found]) => found === word).map(([, id]) => id.split(',')[0] ?? id);
    if (!transcripts.length) return undefined;
    const genes = new BigBed({ filehandle: new RemoteFile(`${this.tracks}${files.genes}`) });
    const { refsByNumber } = await genes.getHeader();
    const found = (await Promise.all(transcripts.slice(0, transcriptsRead).map((id) => genes.searchExtraIndex(id)))).flat();
    const chromId = found[0]?.chromId;
    const chrom = chromId === undefined ? undefined : refsByNumber[chromId]?.name;
    if (!chrom) return undefined;
    const onChrom = found.filter((feature) => feature.chromId === chromId);
    return { chrom, start: Math.min(...onChrom.map((feature) => feature.start)), end: Math.max(...onChrom.map((feature) => feature.end)) };
  }
}
