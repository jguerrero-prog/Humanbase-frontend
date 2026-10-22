import { chromosomeColor } from './ChromosomeColor';
import { sequenceClassColor } from './SequenceClass';
import type { Variant } from './Variant';

/** Sei's Color style: by chromosome, or by the sequence class each variant changes most. */
export type PlotColorBy = 'chromosome' | 'sequence-class';

const other = '--viz-cat-other';

/** A point's fill, as on humanbase.io: its chromosome's color in both plot styles, or its sequence class group's. */
export const pointColor = (variant: Variant, colorBy: PlotColorBy) => (colorBy === 'sequence-class' ? sequenceClassColor(variant.topClass) : chromosomeColor(variant.chromosome)) ?? other;

/** A chromosome's overview band: its own color, or humanbase.io's dark and light grey alternation while points show sequence classes. */
export const bandColor = (chromosome: string, index: number, colorBy: PlotColorBy) => {
  if (colorBy === 'chromosome') return chromosomeColor(chromosome) ?? other;
  return index % 2 ? '--viz-band-light' : '--viz-band-dark';
};

/** Rank's overview has one band, humanbase.io's light grey. */
export const rankBandColor = '--viz-band-neutral';
