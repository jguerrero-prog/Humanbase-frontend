import { zEffects, type EffectScale } from './EffectScale';

export interface EffectExperiment {
  /** The feature, such as the RNA-binding protein LIN28A. */
  feature: string;
  /** The cell type or tissue, such as K562. */
  cell: string;
  /** What tells experiments of one feature apart, such as K562 rep 2. */
  context: string;
  /** The row label in a heatmap, such as K562 / LARP4 (rep 2). */
  label: string;
  value: number;
}

export interface EffectGroup {
  feature: string;
  experiments: EffectExperiment[];
  /** The strongest value, which sorts the group. */
  peak: number;
  low: number;
  high: number;
  cells: string[];
}

export interface StrengthCounts {
  strong: number;
  moderate: number;
  weak: number;
  lowered: number;
}

export class EffectGroups {
  constructor(
    readonly experiments: readonly EffectExperiment[],
    readonly scale: EffectScale = zEffects,
  ) {}

  strength(value: number): keyof StrengthCounts | null {
    const { strong, moderate, weak } = this.scale.bins;
    if (value <= -weak) return 'lowered';
    if (value >= strong) return 'strong';
    if (value >= moderate) return 'moderate';
    if (value >= weak) return 'weak';
    return null;
  }

  counts(): StrengthCounts {
    const counts: StrengthCounts = { strong: 0, moderate: 0, weak: 0, lowered: 0 };
    for (const { value } of this.experiments) {
      const bin = this.strength(value);
      if (bin) counts[bin] += 1;
    }
    return counts;
  }

  /** Experiments at or beyond the threshold in either direction; null keeps every one. */
  atLeast(threshold: number | null): EffectGroups {
    if (threshold === null) return this;
    return new EffectGroups(this.experiments.filter(({ value }) => Math.abs(value) >= threshold), this.scale);
  }

  /** Experiments of one feature fold into one group, strongest group first. */
  groups(direction: 'raises' | 'lowers'): EffectGroup[] {
    const sign = direction === 'raises' ? 1 : -1;
    const byFeature = new Map<string, EffectExperiment[]>();
    for (const experiment of this.experiments) {
      if (Math.sign(experiment.value) !== sign) continue;
      byFeature.set(experiment.feature, [...(byFeature.get(experiment.feature) ?? []), experiment]);
    }
    return [...byFeature].map(([feature, list]) => {
      const sorted = [...list].sort((a, b) => sign * (b.value - a.value));
      const values = sorted.map(({ value }) => value);
      return { feature, experiments: sorted, peak: values[0] ?? 0, low: Math.min(...values), high: Math.max(...values), cells: [...new Set(sorted.map(({ cell }) => cell))] };
    }).sort((a, b) => sign * (b.peak - a.peak));
  }
}
