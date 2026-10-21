import type { LegendItem } from '../Legend/Legend';

interface SequenceClassGroup extends LegendItem {
  /** The start every class name in the group shares, such as PC for PC1 Polycomb / Heterochromatin. */
  prefix: string;
}

// humanbase.io's Color style groups, in its legend order; PC comes before P so PC1 isn't read as a promoter.
const groups: readonly SequenceClassGroup[] = [
  { prefix: 'E', label: 'Enhancer', color: '--viz-seqclass-enhancer' },
  { prefix: 'CTCF', label: 'CTCF', color: '--viz-seqclass-ctcf' },
  { prefix: 'PC', label: 'Polycomb', color: '--viz-seqclass-polycomb' },
  { prefix: 'P ', label: 'Promoter', color: '--viz-seqclass-promoter' },
  { prefix: 'HET', label: 'Heterochromatin', color: '--viz-seqclass-heterochromatin' },
  { prefix: 'TN', label: 'Transcription', color: '--viz-seqclass-transcription' },
  { prefix: 'TF', label: 'Transcription factor', color: '--viz-seqclass-tf' },
  { prefix: 'L', label: 'Low signal', color: '--viz-seqclass-low' },
];

/** The legend for a plot colored by Sei sequence class. */
export const sequenceClassLegend: readonly LegendItem[] = groups.map(({ label, color }) => ({ label, color }));

/** The color of a Sei sequence class, such as P Promoter, by its group. */
export const sequenceClassColor = (name: string | undefined) => (name ? groups.find((group) => name.startsWith(group.prefix))?.color : undefined);
