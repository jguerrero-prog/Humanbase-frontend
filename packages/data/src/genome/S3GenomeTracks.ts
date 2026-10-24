// Also imported by scripts/record-samples.mjs, so it imports only packages and uses only syntax Node can strip.
import type { BigBed, BigWig } from '@gmod/bbi';
import type { TwoBitFile } from '@gmod/twobit';
import type { Assembly } from './GenomeLocation';
import { geneModels, segmentOf, trackFiles, transcriptOf, type GeneModel, type GenomeSpan, type GenomeTracks, type ScorePoint, type Segment, type SequenceSpan } from './GenomeTracks.ts';

// The readers load only when a genome browser first draws.
const readers = () => Promise.all([import('@gmod/bbi'), import('@gmod/twobit'), import('generic-filehandle2')]);

/** Reads the static track files the live genome browser reads, in byte ranges. */
export class S3GenomeTracks implements GenomeTracks {
  private readonly tracks: string;
  private readonly opened = new Map<string, Promise<BigBed | BigWig | TwoBitFile>>();
  private readonly segmentReads = new Map<string, Promise<Segment[]>>();

  constructor(tracks = 'https://humanbase.s3.amazonaws.com/tracks/') {
    this.tracks = tracks;
  }

  async genes(assembly: Assembly, span: GenomeSpan): Promise<GeneModel[]> {
    const file = (await this.open(`${this.tracks}${trackFiles[assembly].genes}`, 'bigBed')) as BigBed;
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

  segments(bigBedUrl: string, span: GenomeSpan): Promise<Segment[]> {
    // The track and its table ask for the same view, so the last few reads are kept.
    const key = `${bigBedUrl} ${span.chrom}:${span.start}-${span.end}`;
    let read = this.segmentReads.get(key);
    if (!read) {
      read = this.readSegments(bigBedUrl, span);
      this.segmentReads.set(key, read);
      read.catch(() => this.segmentReads.delete(key));
      if (this.segmentReads.size > 8) this.segmentReads.delete(this.segmentReads.keys().next().value ?? key);
    }
    return read;
  }

  private async readSegments(bigBedUrl: string, span: GenomeSpan): Promise<Segment[]> {
    const file = (await this.open(bigBedUrl, 'bigBed')) as BigBed;
    const features = await file.getFeatures(span.chrom, span.start - 1, span.end);
    return features.map(segmentOf).sort((a, b) => a.start - b.start);
  }

  async sequence(assembly: Assembly, span: GenomeSpan): Promise<SequenceSpan | undefined> {
    const file = (await this.open(`${this.tracks}${trackFiles[assembly].sequence}`, 'twoBit')) as TwoBitFile;
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
