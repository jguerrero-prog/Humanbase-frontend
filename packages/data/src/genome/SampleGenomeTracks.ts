import { ApiError } from '../ApiError';
import type { DataClient } from '../DataClient';
import type { Assembly } from './GenomeLocation';
import type { GeneModel, GenomeSpan, GenomeTracks, ScorePoint, SequenceSpan } from './GenomeTracks';

/** A recorded stretch of the track files, as pnpm samples:record saves it. */
export interface RecordedWindow extends GenomeSpan {
  assembly: Assembly;
  genes: GeneModel[];
  scores: Record<string, ScorePoint[]>;
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

  async sequence(assembly: Assembly, span: GenomeSpan): Promise<SequenceSpan | undefined> {
    const recorded = (await this.window(span, (window) => window.assembly === assembly)).sequence;
    if (!recorded || span.start < recorded.start || span.end >= recorded.start + recorded.bases.length) return undefined;
    return { start: span.start, bases: recorded.bases.slice(span.start - recorded.start, span.end - recorded.start + 1) };
  }

  private async window(span: GenomeSpan, fits: (window: RecordedWindow) => boolean): Promise<RecordedWindow> {
    const { windows } = await this.client.get<{ windows: RecordedWindow[] }>('genome/tracks');
    const found = windows.find((window) => fits(window) && window.chrom === span.chrom && window.start <= span.start && window.end >= span.end);
    if (!found) throw new ApiError(404, `sample:genome/tracks ${span.chrom}:${span.start}-${span.end}`);
    return found;
  }
}
