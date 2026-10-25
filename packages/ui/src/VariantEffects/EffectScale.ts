import { ScoreScale, type ScaleSpec } from '../Heatmap/ScoreScale';

export interface EffectBins {
  strong: number;
  moderate: number;
  weak: number;
}

/** How one feature score reads: its legend, strength bins and the bars' axis. */
export interface EffectScale {
  legend: ScaleSpec;
  /** The axis title, such as z-score. */
  axis: string;
  /** Written before the strong threshold, as in "strong, z 5 or more". */
  prefix: string;
  /** None for a score humanbase.io only ranks, such as e-value, so it has no Strongest effects. */
  bins?: EffectBins | undefined;
  /** Smaller values are stronger, as for e-value. */
  reversed?: boolean | undefined;
  /** Values in this range aren't significant and are left out of the All features plot, as on humanbase.io. */
  insignificant?: readonly [number, number] | undefined;
  /** Bars stop here; larger values show a break. */
  cut: number;
  ticks: readonly number[];
  /** Decimal places for values. */
  digits: number;
}

export type BinnedEffectScale = EffectScale & { bins: EffectBins };

/** The z-score legend every DeepSEA feature uses: edges at |z| 2, 3 and 5. */
export const effectZScale: ScaleSpec = { title: 'z-score', kind: 'diverging', edges: [-5, -3, -2, 2, 3, 5], words: ['Lowers', 'Raises'] };

export const zEffects: BinnedEffectScale = { legend: effectZScale, axis: 'z-score', prefix: 'z ', bins: { strong: 5, moderate: 3, weak: 2 }, cut: 10, ticks: [0, 2, 3, 5, 10], digits: 1 };

/** The ASD Browser's DNA or RNA feature scores on the live site's −3 to 3 legend. Their unit is unconfirmed, so they read as Score; the edges at 1, 2 and 3 are placeholders to confirm. */
export const asdEffects = (set: 'DNA' | 'RNA'): BinnedEffectScale => ({
  legend: { title: `${set} features`, kind: 'diverging', edges: [-3, -2, -1, 1, 2, 3], words: ['Lowers', 'Raises'] },
  axis: 'score',
  prefix: 'score ',
  bins: { strong: 3, moderate: 2, weak: 1 },
  cut: 5,
  ticks: [0, 1, 2, 3, 5],
  digits: 2,
});

/** Sei's sequence class scores, with step edges at 0.5, 1 and 2 to confirm with the Sei team. */
export const sequenceClassEffects: BinnedEffectScale = {
  legend: { title: 'Sequence class score', kind: 'diverging', edges: [-2, -1, -0.5, 0.5, 1, 2], words: ['Lowers', 'Raises'] },
  axis: 'class score',
  prefix: '',
  bins: { strong: 2, moderate: 1, weak: 0.5 },
  cut: 2.5,
  ticks: [0, 0.5, 1, 2, 2.5],
  digits: 2,
};

/** ExPecto's job results, in log fold change: edges at 0.02, 0.05 and 0.1, as decided on Heatmaps and score legends. */
export const expressionEffects: BinnedEffectScale = {
  legend: { title: 'ExPecto, expression effect (log fold change)', kind: 'diverging', edges: [-0.1, -0.05, -0.02, 0.02, 0.05, 0.1], words: ['Decreases', 'Increases expression'] },
  axis: 'effect',
  prefix: '',
  bins: { strong: 0.1, moderate: 0.05, weak: 0.02 },
  cut: 0.5,
  ticks: [0, 0.05, 0.1, 0.5],
  digits: 2,
};

/** Seqweaver's gnomAD browser, in log e-value from 0 to 5 as humanbase.io draws it; larger is stronger. The edges at 1 to 4 are a proposal to confirm with the Seqweaver team. */
export const seqweaverGnomadEffects: BinnedEffectScale = {
  legend: { title: 'Seqweaver (log e-value)', kind: 'sequential', edges: [1, 2, 3, 4], ends: [0, 5], words: ['Weaker', 'Stronger'] },
  axis: 'log e-value',
  prefix: '',
  bins: { strong: 4, moderate: 3, weak: 2 },
  cut: 5,
  ticks: [0, 1, 2, 3, 4, 5],
  digits: 2,
};

/** A feature score on humanbase.io's range for it, such as Probability diffs at −0.3, 0 and 0.3, or e-value from 0 to 0.05 with smaller stronger. Stepped like every legend, with no strength bins. */
export function rangeEffects(title: string, range: readonly number[], { reversed = false, insignificant }: { reversed?: boolean | undefined; insignificant?: readonly number[] | undefined } = {}): EffectScale {
  const [low = 0, middle = 0, high = middle] = range;
  const span = Math.max(Math.abs(low), Math.abs(high));
  const digits = Math.max(1, Math.ceil(2 - Math.log10(span || 1)));
  const legend: ScaleSpec =
    range.length > 2
      ? ScoreScale.fromStops(title, [low, middle, high], ['Lowers', 'Raises'])
      : sequentialFrom(title, low, middle, reversed);
  const [lowest, highest] = insignificant ?? [];
  return { legend, axis: title, prefix: '', reversed, ...(lowest !== undefined && highest !== undefined && { insignificant: [lowest, highest] as const }), cut: span, ticks: [0, span], digits };
}

/** Four even steps from start to end; reversed draws the smallest values darkest. */
function sequentialFrom(title: string, start: number, end: number, reversed: boolean): ScaleSpec {
  const at = (share: number) => start + (end - start) * share;
  const edges = [0.2, 0.4, 0.6, 0.8].map(at);
  return reversed
    ? { title, kind: 'sequential', edges: edges.reverse(), ends: [end, start], words: ['Weaker', 'Stronger'] }
    : { title, kind: 'sequential', edges, ends: [start, end], words: ['Weaker', 'Stronger'] };
}
