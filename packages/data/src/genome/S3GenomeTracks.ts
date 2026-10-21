// Also imported by scripts/record-samples.mjs, so it imports only packages and uses only syntax Node can strip.
import type { BigBed, BigWig } from '@gmod/bbi';
import type { TwoBitFile } from '@gmod/twobit';
import type { Assembly } from './GenomeLocation';
import { geneModels, transcriptOf, type GeneModel, type GenomeSpan, type GenomeTracks, type ScorePoint, type SequenceSpan } from './GenomeTracks.ts';

const files: Record<Assembly, { genes: string; sequence: string }> = {
  hg19: { genes: 'gencode.bb', sequence: 'hg19.2bit' },
  hg38: { genes: 'GRCh38/gencode.v21.annotation.bb', sequence: 'GRCh38/hg38.2bit' },
};

// The readers load only when a genome browser first draws.
const readers = () => Promise.all([import('@gmod/bbi'), import('@gmod/twobit'), import('generic-filehandle2')]);

/** Reads the static track files the live genome browser reads, in byte ranges. */
export class S3GenomeTracks implements GenomeTracks {
  private readonly tracks: string;
  private readonly opened = new Map<string, Promise<BigBed | BigWig | TwoBitFile>>();

  constructor(tracks = 'https://humanbase.s3.amazonaws.com/tracks/') {
    this.tracks = tracks;
  }

  async genes(assembly: Assembly, span: GenomeSpan): Promise<GeneModel[]> {
    const file = (await this.open(`${this.tracks}${files[assembly].genes}`, 'bigBed')) as BigBed;
    const features = await file.getFeatures(span.chrom, span.start - 1, span.end);
    return geneModels(features.map(transcriptOf));
  }

  async scores(bigWigUrl: string, span: GenomeSpan, bins?: number): Promise<ScorePoint[]> {
    const file = (await this.open(bigWigUrl, 'bigWig')) as BigWig;
    const scale = bins ? bins / (span.end - span.start + 1) : 1;
    const features = await file.getFeatures(span.chrom, span.start - 1, span.end, { scale });
    // A summary keeps the value furthest from 0, so a strong score is never averaged away.
    // The ASD files store each variant as an empty span whose start is already its 1-based position.
    return features.map((feature) => {
      const [high, low] = [feature.maxScore ?? feature.score ?? 0, feature.minScore ?? feature.score ?? 0];
      const start = feature.end > feature.start ? feature.start + 1 : feature.start;
      return { start, end: Math.max(start, feature.end), value: Math.abs(low) > Math.abs(high) ? low : high };
    });
  }

  async sequence(assembly: Assembly, span: GenomeSpan): Promise<SequenceSpan | undefined> {
    const file = (await this.open(`${this.tracks}${files[assembly].sequence}`, 'twoBit')) as TwoBitFile;
    const bases = await file.getSequence(span.chrom, span.start - 1, span.end);
    return bases ? { start: span.start, bases: bases.toUpperCase() } : undefined;
  }

  private open(url: string, kind: 'bigBed' | 'bigWig' | 'twoBit'): Promise<BigBed | BigWig | TwoBitFile> {
    let file = this.opened.get(url);
    if (!file) {
      file = readers().then(([{ BigBed, BigWig }, { TwoBitFile }, { RemoteFile }]) => {
        const filehandle = new RemoteFile(url);
        if (kind === 'twoBit') return new TwoBitFile({ filehandle });
        return kind === 'bigBed' ? new BigBed({ filehandle }) : new BigWig({ filehandle });
      });
      this.opened.set(url, file);
    }
    return file;
  }
}
