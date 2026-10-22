import { GenomeLocation, type GeneModel, type ScorePoint, type Segment } from '@humanbase/data';
import type { ItemDetails } from '@humanbase/ui';

// The fields humanbase.io's genome browser lists when an item is clicked, checked October 22, 2026.
// Adding a field needs a research ticket for subject-matter experts first.
const location = (chrom: string, item: { start: number; end: number }) => new GenomeLocation(chrom, item.start, item.end).format();

/** A gene's details: its transcript type, where it is, and the file's score. */
export const geneDetails = (chrom: string, gene: GeneModel): ItemDetails => [
  ['Method', gene.type],
  ['Location', location(chrom, gene)],
  ['Score', String(gene.score)],
];

/** A segment's details, such as a ChromHMM state's: where it is, and the file's score. */
export const segmentDetails = (chrom: string, segment: Segment): ItemDetails => [
  ['Location', location(chrom, segment)],
  ['Score', String(segment.score)],
];

/** A score bar's details, such as a disease impact score's: where it is, and the value read from the file at full precision. */
export const scoreDetails = (chrom: string, point: ScorePoint): ItemDetails => [
  ['Location', location(chrom, point)],
  ['Score', String(point.value)],
];
