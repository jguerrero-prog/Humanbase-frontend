import type { EffectExperiment, StrengthCounts, Variant } from '@humanbase/ui';

// The Seqweaver example job from October 16, 2026, as Figma records it.
export const exampleVariants: Variant[] = [
  { id: 'chr16-85833314', chromosome: 'chr16', position: 85_833_314, change: 'G>T', name: 'COX4I1', scores: { impact: 2.05, evalue: 1.33 } },
  { id: 'chr19-1854681', chromosome: 'chr19', position: 1_854_681, change: 'C>G', name: 'REXO1', scores: { impact: 1.92, evalue: 1.12 } },
  { id: 'chr19-55999138', chromosome: 'chr19', position: 55_999_138, change: 'G>A', name: 'SSC5D', scores: { impact: 1.61, evalue: 1.02 } },
  { id: 'chr19-59070227', chromosome: 'chr19', position: 59_070_227, change: 'C>A', name: 'UBE2M', scores: { impact: 1.26, evalue: 1.13 } },
  { id: 'chr16-209709', chromosome: 'chr16', position: 209_709, change: 'T>C', name: '[known_GATA1_binding_increase]', scores: { impact: 1.05, evalue: 0.7 } },
  { id: 'chr1-109817590', chromosome: 'chr1', position: 109_817_590, change: 'G>T', name: '[known_CEBP_binding_increase]', scores: { impact: 1, evalue: 0.9 } },
  { id: 'chr17-76352731', chromosome: 'chr17', position: 76_352_731, change: 'G>A', name: 'SOCS3', scores: { impact: 0.96, evalue: 0.82 } },
  { id: 'chr16-83947129', chromosome: 'chr16', position: 83_947_129, change: 'T>A', name: 'MLYCD', scores: { impact: 0.64, evalue: 0.36 } },
  { id: 'chr10-23508363', chromosome: 'chr10', position: 23_508_363, change: 'A>G', name: '[known_FOXA2_binding_decrease]', scores: { impact: 0.59, evalue: 0.42 } },
];

export const selectedVariant = 'chr1-109817590';

const experiment = (cell: string, feature: string, value: number, replicate?: string): EffectExperiment => ({
  feature,
  cell,
  context: replicate ? `${cell} ${replicate}` : cell,
  label: replicate ? `${cell} / ${feature} (${replicate})` : `${cell} / ${feature}`,
  value,
});

// The top 20 of 232 features for chr1:109,817,590 G>T, in z-scores.
export const topExperiments: EffectExperiment[] = [
  experiment('H9', 'LIN28A', 28.0),
  { feature: 'AGO', cell: 'Brain', context: 'Brain BA4', label: 'Brain BA4 / AGO', value: 10.3 },
  { feature: 'AGO', cell: 'Brain', context: 'Brain cingulate gyrus', label: 'Brain cingulate gyrus / AGO', value: 9.7 },
  experiment('Adrenal gland', 'HNRNPU', 9.3),
  experiment('HepG2', 'SMNDC1', 6.4),
  experiment('K562', 'LARP4', 4.4, 'rep 2'),
  experiment('HepG2', 'LARP4', 4.4, 'rep 1'),
  experiment('K562', 'QKI', 3.9),
  experiment('K562', 'LSM11', 3.6),
  experiment('HepG2', 'LARP4', 3.5, 'rep 2'),
  experiment('HepG2', 'SLTM', 3.4),
  experiment('K562', 'LARP4', 2.8, 'rep 1'),
  experiment('K562', 'RPS5', 2.7),
  experiment('K562', 'RBM27', 2.6),
  experiment('HepG2', 'RBM15', 2.6),
  experiment('K562', 'SLTM', 2.5),
  experiment('K562', 'XRN2', 2.5),
  { feature: 'SRSF3', cell: 'P19', context: 'P19, mouse', label: 'P19 / SRSF3 (mouse)', value: 2.3 },
  experiment('K562', 'PUM2', 2.2, 'rep 2'),
  experiment('K562', 'PUM2', 2.2, 'rep 1'),
];

// Counted over all 232 features, so they include weak effects below the top 20.
export const strengthCounts: StrengthCounts = { strong: 5, moderate: 6, weak: 12, lowered: 0 };

export const featureTotal = 232;

// Ranks 1 to 212 follow the shape of the live plot; their values weren't captured.
export const illustrativeRanks: number[] = Array.from({ length: featureTotal - topExperiments.length }, (_, index) => {
  const share = index / (featureTotal - topExperiments.length - 1);
  return Number((-1.2 + share ** 2 * 3.2).toFixed(2));
});
