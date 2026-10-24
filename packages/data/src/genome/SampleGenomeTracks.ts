import { ApiError } from '../ApiError';
import type { DataClient } from '../DataClient';
import type { Assembly } from './GenomeLocation';
import type { GeneModel, GenomeSpan, GenomeTracks, ScorePoint, Segment, SequenceSpan } from './GenomeTracks';

/** A recorded stretch of the track files, as pnpm samples:record saves it. */
export interface RecordedWindow extends GenomeSpan {
  assembly: Assembly;
  genes: GeneModel[];
  scores: Record<string, ScorePoint[]>;
  segments?: Record<string, Segment[]>;
  sequence?: SequenceSpan;
}

const overlaps = (item: { start: number; end: number }, span: GenomeSpan) => item.end >= span.start && item.start <= span.end;

/** Answers track reads from recorded windows, so the genome browser makes no request while the API is off. */
export class SampleGenomeTracks implements GenomeTracks {
  constructor(private readonly client: DataClient) {}

  async genes(assembly: Assembly, span: GenomeSpan): Promise<GeneModel[]> {
    return (await this.window(span, (window) => window.assembly === assembly)).genes.filter((gene) => overlaps(gene, span));
  }

  async scores(bigWigUrl: string, span: GenomeSpan): Promise<ScorePoint[]> {
    const recorded = (await this.window(span, (window) => bigWigUrl in window.scores)).scores[bigWigUrl] ?? [];
    return recorded.filter((point) => overlaps(point, span));
  }

  async segments(bigBedUrl: string, span: GenomeSpan): Promise<Segment[]> {
    const recorded = (await this.window(span, (window) => bigBedUrl in (window.segments ?? {}))).segments?.[bigBedUrl] ?? [];
    return recorded.filter((segment) => overlaps(segment, span));
  }

  async sequence(assembly: Assembly, span: GenomeSpan): Promise<SequenceSpan | undefined> {
    const recorded = (await this.window(span, (window) => window.assembly === assembly)).sequence;
    if (!recorded || span.start < recorded.start || span.end >= recorded.start + recorded.bases.length) return undefined;
    return { start: span.start, bases: recorded.bases.slice(span.start - recorded.start, span.end - recorded.start + 1) };
  }

  /** Whether a recorded window holds the whole span: of the file, or of the assembly's genes and sequence without one. */
  async covers(assembly: Assembly, span: GenomeSpan, file?: string): Promise<boolean> {
    return Boolean(await this.find(span, file ? (window) => file in window.scores || file in (window.segments ?? {}) : (window) => window.assembly === assembly));
  }

  private async find(span: GenomeSpan, fits: (window: RecordedWindow) => boolean): Promise<RecordedWindow | undefined> {
    const { windows } = await this.client.get<{ windows: RecordedWindow[] }>('genome/tracks');
    return windows.find((window) => fits(window) && window.chrom === span.chrom && window.start <= span.start && window.end >= span.end);
  }

  private async window(span: GenomeSpan, fits: (window: RecordedWindow) => boolean): Promise<RecordedWindow> {
    const found = await this.find(span, fits);
    if (!found) throw new ApiError(404, `sample:genome/tracks ${span.chrom}:${span.start}-${span.end}`);
    return found;
  }
}
