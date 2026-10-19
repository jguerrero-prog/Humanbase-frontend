import { Button } from '../Button/Button';
import { Heatmap } from '../Heatmap/Heatmap';
import type { EffectExperiment } from './EffectGroups';
import { zEffects, type EffectScale } from './EffectScale';
import './VariantEffects.css';

export interface EffectsHeatmapProps {
  /** The variants in the genome browser's range, one column each. */
  variants: readonly string[];
  /** Each experiment's value for each variant, in the same order. */
  rows: readonly { experiment: EffectExperiment; values: readonly (number | null)[] }[];
  /** How many features the score has, such as 232. */
  total: number;
  density?: 'full' | 'compact' | undefined;
  lowestFirst?: boolean | undefined;
  onShowMore?: (() => void) | undefined;
  initialActive?: readonly [row: number, column: number] | undefined;
  scale?: EffectScale | undefined;
}

export function EffectsHeatmap({ variants, rows, total, density = 'full', lowestFirst = false, onShowMore, initialActive, scale = zEffects }: EffectsHeatmapProps) {
  const sorted = [...rows].sort((a, b) => (lowestFirst ? -1 : 1) * ((b.values[0] ?? 0) - (a.values[0] ?? 0)));
  const summary = `Showing the top ${sorted.length} of ${total} features for this variant.`;
  return (
    <div className="effects-heatmap">
      <Heatmap
        title={`${scale.legend.title} of the strongest features for ${variants.join(', ')}`}
        summary={summary}
        scale={scale.legend}
        columns={variants.map((label) => ({ label }))}
        rows={sorted.map(({ experiment, values }) => ({ label: experiment.label, values }))}
        rowHeader="Experiment"
        columnHeader="Variant"
        decimals={1}
        density={density}
        showValues={variants.length === 1}
        initialActive={initialActive}
      />
      {sorted.length < total && (
        <Button variant="ghost" size="small" onClick={onShowMore}>
          Show 20 more features
        </Button>
      )}
    </div>
  );
}
