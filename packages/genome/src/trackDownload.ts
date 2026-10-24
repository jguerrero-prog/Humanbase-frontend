import type { GenomeSpan, GenomeTracks, ScorePoint, Segment } from '@humanbase/data';
import { isSegmentTrack, trackFile, withChr, type Assembly, type GenomeDataTrack } from './GenomeBrowserEngine';

const rgbOf = (color: string) => {
  const hex = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  return hex ? hex.slice(1).map((channel) => Number.parseInt(channel, 16)).join(',') : '0';
};

/** Scores as bedGraph lines, 0-based and half-open, cut to the span. */
export function bedGraphLines(chrom: string, points: readonly ScorePoint[], span: GenomeSpan): string[] {
  return [...points]
    .sort((a, b) => a.start - b.start)
    .flatMap(({ start, end, value }) => {
      const [from, to] = [Math.max(start, span.start), Math.min(end, span.end)];
      return from <= to ? [`${chrom}\t${from - 1}\t${to}\t${value}`] : [];
    });
}

/** Segments as BED9 lines, 0-based and half-open, with each segment's own name, score and itemRgb. */
export function bedLines(chrom: string, segments: readonly Segment[]): string[] {
  return segments.map(({ start, end, name, score, color }) => [chrom, start - 1, end, name, score, '.', start - 1, end, rgbOf(color)].join('\t'));
}

/** One data track's data in a stretch, in the text format of its file type: bedGraph for a bigWig, BED for a bigBed. */
export class TrackDownload {
  constructor(
    private readonly track: GenomeDataTrack,
    private readonly assembly: Assembly,
  ) {}

  get format(): 'bedGraph' | 'BED' {
    return isSegmentTrack(this.track) ? 'BED' : 'bedGraph';
  }

  get fileType(): 'bigWig' | 'bigBed' {
    return isSegmentTrack(this.track) ? 'bigBed' : 'bigWig';
  }

  /** The whole file's address, when it has one to open; a file from the person's computer has none. */
  get sourceUrl(): string | undefined {
    const url = trackFile(this.track);
    return /^https?:\/\//.test(url) ? url : undefined;
  }

  /** A score file such as Conservation has a value at every base, so a download is kept to 1 Mb. */
  static readonly limit = 1_000_000;

  fits(span: GenomeSpan): boolean {
    return span.end - span.start + 1 <= TrackDownload.limit;
  }

  fileName(span: GenomeSpan): string {
    const name = this.track.name.replace(/[^\w.-]+/g, '-').replace(/^-|-$/g, '') || 'track';
    return `${name}_${this.assembly}_${withChr(span.chrom)}-${span.start}-${span.end}.${this.format === 'BED' ? 'bed' : 'bedgraph'}`;
  }

  /** Reads the stretch at full resolution through the same reader the tracks draw from. */
  async contents(files: GenomeTracks, span: GenomeSpan): Promise<string> {
    const chrom = withChr(span.chrom);
    const lines = isSegmentTrack(this.track) ? bedLines(chrom, await files.segments(this.track.bigBedUrl, span)) : bedGraphLines(chrom, await files.scores(this.track.bigWigUrl, span), span);
    return lines.map((line) => `${line}\n`).join('');
  }
}
