// Also imported by scripts/record-samples.mjs, so it imports only packages and uses only syntax Node can strip.
import type { Assembly } from './GenomeLocation';

/** A stretch of one chromosome, 1-based and inclusive, with the chr prefix. */
export interface GenomeSpan {
  chrom: string;
  start: number;
  end: number;
}

/** One gene drawn as its transcripts merged: exons, and the coding part of them. */
export interface GeneModel {
  name: string;
  strand: '+' | '-' | '';
  start: number;
  end: number;
  /** The transcript type, such as protein_coding or processed_pseudogene. */
  type: string;
  exons: readonly [number, number][];
  coding: readonly [number, number][];
}

/** A score over a stretch, or at one position when start and end are equal. */
export interface ScorePoint {
  start: number;
  end: number;
  value: number;
}

/** A stretch of the reference sequence. */
export interface SequenceSpan {
  start: number;
  bases: string;
}

/** Reads what a genome browser draws: gene models, scores from bigWig files and the reference sequence. */
export interface GenomeTracks {
  genes(assembly: Assembly, span: GenomeSpan): Promise<GeneModel[]>;
  /** Scores in the span; with bins, nearby values are summarised to about that many. */
  scores(bigWigUrl: string, span: GenomeSpan, bins?: number): Promise<ScorePoint[]>;
  /** The bases in the span, or undefined where none are available. */
  sequence(assembly: Assembly, span: GenomeSpan): Promise<SequenceSpan | undefined>;
}

/** One GENCODE transcript as the gene model files store it, 1-based. */
export interface Transcript {
  name: string;
  strand: string;
  start: number;
  end: number;
  thickStart: number;
  thickEnd: number;
  type: string;
  blocks: [number, number][];
}

function merge(spans: readonly [number, number][]): [number, number][] {
  const merged: [number, number][] = [];
  for (const [start, end] of [...spans].sort((a, b) => a[0] - b[0])) {
    const last = merged.at(-1);
    if (last && start <= last[1] + 1) last[1] = Math.max(last[1], end);
    else merged.push([start, end]);
  }
  return merged;
}

/** Merges a gene's transcripts into one model, as the live genome browser draws them. */
export function geneModels(transcripts: readonly Transcript[]): GeneModel[] {
  const byGene = Map.groupBy(transcripts, (transcript) => transcript.name);
  return [...byGene].map(([name, group]) => {
    const coding = group.flatMap((transcript) =>
      transcript.thickEnd > transcript.thickStart
        ? transcript.blocks.map(([start, end]): [number, number] => [Math.max(start, transcript.thickStart), Math.min(end, transcript.thickEnd)]).filter(([start, end]) => start <= end)
        : [],
    );
    const strand = group[0]?.strand;
    return {
      name,
      strand: strand === '+' || strand === '-' ? strand : '',
      start: Math.min(...group.map((transcript) => transcript.start)),
      end: Math.max(...group.map((transcript) => transcript.end)),
      type: group.some((transcript) => transcript.type === 'protein_coding') ? 'protein_coding' : (group[0]?.type ?? ''),
      exons: merge(group.flatMap((transcript) => transcript.blocks)),
      coding: merge(coding),
    };
  });
}

/** Reads one bigBed line in the GENCODE layout the Humanbase track files use. */
export function transcriptOf(feature: { start: number; end: number; rest?: string }): Transcript {
  const [, , strand = '', thickStart = '0', thickEnd = '0', , , sizes = '', starts = '', , geneName, type = ''] = (feature.rest ?? '').split('\t');
  const offsets = starts.split(',').filter(Boolean).map(Number);
  const lengths = sizes.split(',').filter(Boolean).map(Number);
  const start = feature.start + 1;
  return {
    name: geneName ?? '',
    strand,
    start,
    end: feature.end,
    thickStart: Number(thickStart) + 1,
    thickEnd: Number(thickEnd),
    type,
    blocks: offsets.length ? offsets.map((offset, index) => [start + offset, start + offset + (lengths[index] ?? 0) - 1]) : [[start, feature.end]],
  };
}
