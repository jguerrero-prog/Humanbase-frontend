// Also imported by scripts/record-samples.mjs, so it imports only packages and uses only syntax Node can strip.
import type { Assembly } from './GenomeLocation';

/** Each assembly's files on the Humanbase tracks bucket, as the live genome browser reads them. */
export const trackFiles: Record<Assembly, { genes: string; geneIndex: string; sequence: string }> = {
  hg19: { genes: 'gencode.bb', geneIndex: 'geneIndex', sequence: 'hg19.2bit' },
  hg38: { genes: 'GRCh38/gencode.v21.annotation.bb', geneIndex: 'GRCh38/gencode.v21.annotation', sequence: 'GRCh38/hg38.2bit' },
};

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
  /** The file's score for the transcript whose type this is, 0 to 1000. */
  score: number;
  exons: readonly [number, number][];
  coding: readonly [number, number][];
}

/** A score over a stretch, or at one position when start and end are equal. */
export interface ScorePoint {
  start: number;
  end: number;
  value: number;
}

/** One stretch of a segmentation, such as a chromatin state: the file's name for it and its own color. */
export interface Segment {
  start: number;
  end: number;
  name: string;
  /** The file's itemRgb, such as #FF6969; empty when the file gives none. */
  color: string;
  /** The file's score for the segment, 0 to 1000. */
  score: number;
}

/** A stretch of the reference sequence. */
export interface SequenceSpan {
  start: number;
  bases: string;
}

/** Reads what a genome browser draws: gene models, scores from bigWig files, segments from bigBed files and the reference sequence. */
export interface GenomeTracks {
  genes(assembly: Assembly, span: GenomeSpan): Promise<GeneModel[]>;
  /** Scores in the span; with bins, nearby values are summarised to about that many. */
  scores(bigWigUrl: string, span: GenomeSpan, bins?: number): Promise<ScorePoint[]>;
  /** The segments in a bigBed file that overlap the span, in order. */
  segments(bigBedUrl: string, span: GenomeSpan): Promise<Segment[]>;
  /** The bases in the span, or undefined where none are available. */
  sequence(assembly: Assembly, span: GenomeSpan): Promise<SequenceSpan | undefined>;
  /** Whether reads in the span can be answered, for one file or, without one, the genes and sequence. False only past the recorded sample windows. */
  covers(assembly: Assembly, span: GenomeSpan, file?: string): Promise<boolean>;
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
  score: number;
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
    const shown = group.find((transcript) => transcript.type === 'protein_coding') ?? group[0];
    return {
      name,
      strand: strand === '+' || strand === '-' ? strand : '',
      start: Math.min(...group.map((transcript) => transcript.start)),
      end: Math.max(...group.map((transcript) => transcript.end)),
      type: shown?.type ?? '',
      score: shown?.score ?? 0,
      exons: merge(group.flatMap((transcript) => transcript.blocks)),
      coding: merge(coding),
    };
  });
}

/** Reads one bigBed line in the GENCODE layout the Humanbase track files use. */
export function transcriptOf(feature: { start: number; end: number; rest?: string }): Transcript {
  const [, score = '0', strand = '', thickStart = '0', thickEnd = '0', , , sizes = '', starts = '', , geneName, type = ''] = (feature.rest ?? '').split('\t');
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
    score: Number(score),
    blocks: offsets.length ? offsets.map((offset, index) => [start + offset, start + offset + (lengths[index] ?? 0) - 1]) : [[start, feature.end]],
  };
}

const hex = (channel: string) => Math.max(0, Math.min(255, Number(channel) || 0)).toString(16).padStart(2, '0').toUpperCase();

/** Reads one bed9 line, such as a ChromHMM segment: name, score, strand, thickStart, thickEnd, then itemRgb; 1-based. */
export function segmentOf(feature: { start: number; end: number; rest?: string }): Segment {
  const [name = '', score = '0', , , , rgb = ''] = (feature.rest ?? '').split('\t');
  const [red = '0', green = '0', blue = '0'] = rgb.split(',');
  // UCSC writes itemRgb 0, or leaves it out, for no color.
  const color = rgb.includes(',') ? `#${hex(red)}${hex(green)}${hex(blue)}` : '';
  return { start: feature.start + 1, end: feature.end, name, color, score: Number(score) };
}
