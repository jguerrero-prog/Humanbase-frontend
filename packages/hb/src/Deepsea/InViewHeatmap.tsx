import type { FeatureEffect, GenomeLocation } from '@humanbase/data';
import { Button, Heatmap, type EffectScale } from '@humanbase/ui';

export interface VariantInView {
  key: string;
  /** The variant in words, such as chr1:2,337,101 A>C. */
  name: string;
  position: number;
  /** Its place in a genome browser. */
  href?: string | undefined;
  /** Its effect on every feature, in the model's feature order; undefined when the response has no prediction for it. */
  effects: readonly FeatureEffect[] | undefined;
}

export interface InViewHeatmapProps {
  location: GenomeLocation;
  /** Every variant in the genome browser's view, in genome order. */
  variants: readonly VariantInView[];
  /** The center variant, whose effects rank the rows. */
  selected: number;
  /** The center variant's effects that the search and filters leave. */
  shown: readonly FeatureEffect[];
  limit: number;
  /** Smallest effects first; humanbase.io's Reverse Sort. */
  reversed: boolean;
  density: 'full' | 'compact';
  scale: EffectScale;
  scoreName: string;
  featurePlural: string;
  onShowMore: () => void;
}

const count = new Intl.NumberFormat('en-US');
const tickSteps = [1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000];

/** One column per variant in view, in genome order; rows ranked by the size of the center variant's effect, as on humanbase.io. */
export function InViewHeatmap({ location, variants, selected, shown, limit, reversed, density, scale, scoreName, featurePlural, onShowMore }: InViewHeatmapProps) {
  const center = variants[selected];
  const indexOf = new Map((center?.effects ?? []).map((effect, index) => [effect, index]));
  const ranked = [...shown].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  if (reversed) ranked.reverse();
  const top = ranked.slice(0, limit);
  const step = tickSteps.find((size) => location.width / size <= 5) ?? location.width / 4;
  const ticks = Array.from({ length: Math.floor(location.width / step) + 1 }, (_, index) => index * step);
  const showing = top.length === ranked.length ? `all ${count.format(ranked.length)}` : `the ${reversed ? 'bottom' : 'top'} ${top.length} of ${count.format(ranked.length)}`;

  return (
    <div className="effects-heatmap">
      <Heatmap
        title={`${scoreName}. Showing ${showing} ${featurePlural}, ranked by ${center?.name ?? 'the selected variant'}.`}
        summary="One column per variant in the genome browser’s view, in genomic order; rows ranked by the size of the outlined variant’s effect."
        scale={scale.legend}
        columns={variants.map((variant) => ({ label: variant.key, position: variant.position, name: variant.name, ...(variant.href && { href: variant.href }) }))}
        rows={top.map((effect) => ({ label: effect.label, values: variants.map((variant) => variant.effects?.[indexOf.get(effect) ?? -1]?.value ?? null) }))}
        rowHeader="Feature"
        columnHeader="Variant"
        valueLabel={scoreName}
        axis={variants.length > 1 ? { title: `Position on ${location.chrom}, ${location.assemblyName}`, offset: location.start, ticks } : undefined}
        decimals={scale.digits}
        density={density}
        showValues={variants.length === 1}
        selectedColumn={selected}
      />
      {top.length < ranked.length && (
        <Button variant="ghost" size="small" onClick={onShowMore}>
          Show 20 more {featurePlural}
        </Button>
      )}
    </div>
  );
}
