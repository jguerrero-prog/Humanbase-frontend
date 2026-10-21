import type { ScaleSpec } from '../Heatmap/ScoreScale';

/** How one feature score reads: its legend, strength bins and the bars' axis. */
export interface EffectScale {
  legend: ScaleSpec;
  /** The axis title, such as z-score. */
  axis: string;
  /** Written before the strong threshold, as in "strong, z 5 or more". */
  prefix: string;
  bins: { strong: number; moderate: number; weak: number };
  /** Bars stop here; larger values show a break. */
  cut: number;
  ticks: readonly number[];
  /** Decimal places for values. */
  digits: number;
}

/** The z-score legend every DeepSEA feature uses: edges at |z| 2, 3 and 5. */
export const effectZScale: ScaleSpec = { title: 'z-score', kind: 'diverging', edges: [-5, -3, -2, 2, 3, 5], words: ['Lowers', 'Raises'] };

export const zEffects: EffectScale = { legend: effectZScale, axis: 'z-score', prefix: 'z ', bins: { strong: 5, moderate: 3, weak: 2 }, cut: 10, ticks: [0, 2, 3, 5, 10], digits: 1 };

/** The ASD Browser's DNA or RNA feature scores on the live site's −3 to 3 legend. Their unit is unconfirmed, so they read as Score; the edges at 1, 2 and 3 are placeholders to confirm. */
export const asdEffects = (set: 'DNA' | 'RNA'): EffectScale => ({
  legend: { title: `${set} features`, kind: 'diverging', edges: [-3, -2, -1, 1, 2, 3], words: ['Lowers', 'Raises'] },
  axis: 'score',
  prefix: 'score ',
  bins: { strong: 3, moderate: 2, weak: 1 },
  cut: 5,
  ticks: [0, 1, 2, 3, 5],
  digits: 2,
});

/** Sei's sequence class scores, with step edges at 0.5, 1 and 2 to confirm with the Sei team. */
export const sequenceClassEffects: EffectScale = {
  legend: { title: 'Sequence class score', kind: 'diverging', edges: [-2, -1, -0.5, 0.5, 1, 2], words: ['Lowers', 'Raises'] },
  axis: 'class score',
  prefix: '',
  bins: { strong: 2, moderate: 1, weak: 0.5 },
  cut: 2.5,
  ticks: [0, 0.5, 1, 2, 2.5],
  digits: 2,
};

/** ExPecto's job results, in log fold change: edges at 0.02, 0.05 and 0.1, as decided on Heatmaps and score legends. */
export const expressionEffects: EffectScale = {
  legend: { title: 'ExPecto, expression effect (log fold change)', kind: 'diverging', edges: [-0.1, -0.05, -0.02, 0.02, 0.05, 0.1], words: ['Decreases', 'Increases expression'] },
  axis: 'effect',
  prefix: '',
  bins: { strong: 0.1, moderate: 0.05, weak: 0.02 },
  cut: 0.5,
  ticks: [0, 0.05, 0.1, 0.5],
  digits: 2,
};
