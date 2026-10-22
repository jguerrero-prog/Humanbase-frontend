import type { FeatureEffect, GenomeLocation } from '@humanbase/data';
import { Button, Heatmap, useWidth, type EffectScale } from '@humanbase/ui';

export interface VariantInView {
  key: string;
  /** The variant in words, such as chr1:2,337,101 A>C. */
  name: string;
  position: number;
  /** Its place in a genome browser. */
  href?: string | undefined;
  /** Its effect on every feature, in the model's feature order; undefined when the response has no prediction for it. */
  effects: readonly FeatureEffect[] | undefined;
  /** Its score on the page's variant score, which decides who keeps a shared column in Compact view. */
  score?: number | undefined;
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
  compact: boolean;
  scale: EffectScale;
  scoreName: string;
  featurePlural: string;
  onShowMore: () => void;
  /** Clicking a column's line selects that variant and centers the browser on it, as on humanbase.io. */
  onSelect?: ((key: string) => void) | undefined;
  /** Dragging the cells moves the browser by this many bases. */
  onMove?: ((bases: number) => void) | undefined;
}

const count = new Intl.NumberFormat('en-US');
const tickSteps = [1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000];
// humanbase.io gives each variant a 15px slot across the heatmap's width and ignores drag moves over 100px.
const slotWidth = 15;
const longestMove = 100;

/** humanbase.io's Compact View: one variant per slot; the center variant, or else the higher variant score, keeps a shared slot. */
function compactColumns(variants: readonly VariantInView[], selected: number, location: GenomeLocation, width: number): number[] {
  const slots = Math.floor(width / slotWidth);
  if (slots < 1) return variants.map((_, index) => index);
  const size = location.width / slots;
  const kept = new Map<number, number>();
  variants.forEach((variant, index) => {
    const slot = Math.floor((variant.position - location.start) / size);
    const holder = kept.get(slot);
    const beats = holder !== undefined && holder !== selected && (variants[holder]?.score ?? Number.NaN) < (variant.score ?? Number.NaN);
    if (holder === undefined || index === selected || beats) kept.set(slot, index);
  });
  return [...kept.values()].sort((a, b) => a - b);
}

/** One column per variant in view, in genome order; rows ranked by the size of the center variant's effect, as on humanbase.io. */
export function InViewHeatmap({ location, variants: all, selected: center, shown, limit, reversed, compact, scale, scoreName, featurePlural, onShowMore, onSelect, onMove }: InViewHeatmapProps) {
  const [box, width] = useWidth();
  const kept = compact ? compactColumns(all, center, location, width) : all.map((_, index) => index);
  const variants = kept.flatMap((index) => all[index] ?? []);
  const selected = kept.indexOf(center);
  const centerVariant = all[center];
  const indexOf = new Map((centerVariant?.effects ?? []).map((effect, index) => [effect, index]));
  const ranked = [...shown].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  if (reversed) ranked.reverse();
  const top = ranked.slice(0, limit);
  const step = tickSteps.find((size) => location.width / size <= 5) ?? location.width / 4;
  const ticks = Array.from({ length: Math.floor(location.width / step) + 1 }, (_, index) => index * step);
  const showing = top.length === ranked.length ? `all ${count.format(ranked.length)}` : `the ${reversed ? 'bottom' : 'top'} ${top.length} of ${count.format(ranked.length)}`;
  const drag = (dx: number) => {
    if (!onMove || !width || dx === 0 || Math.abs(dx) > longestMove) return;
    onMove(Math.floor((-dx * location.width) / width));
  };

  return (
    <div className="effects-heatmap" ref={box}>
      <Heatmap
        title={`${scoreName}. Showing ${showing} ${featurePlural}, ranked by ${centerVariant?.name ?? 'the selected variant'}.`}
        summary="One column per variant in the genome browser’s view, in genomic order; rows ranked by the size of the outlined variant’s effect."
        scale={scale.legend}
        columns={variants.map((variant) => ({ label: variant.key, position: variant.position, name: variant.name, ...(variant.href && { href: variant.href }) }))}
        rows={top.map((effect) => ({ label: effect.label, values: variants.map((variant) => variant.effects?.[indexOf.get(effect) ?? -1]?.value ?? null) }))}
        rowHeader="Feature"
        columnHeader="Variant"
        valueLabel={scoreName}
        axis={variants.length > 1 ? { title: `Position on ${location.chrom}, ${location.assemblyName}`, offset: location.start, ticks } : undefined}
        decimals={scale.digits}
        showValues={variants.length === 1}
        selectedColumn={selected}
        {...(onSelect && { onColumnSelect: (column: number) => onSelect(variants[column]?.key ?? '') })}
        {...(onMove && { onDrag: drag })}
      />
      {top.length < ranked.length && (
        <Button variant="ghost" size="small" onClick={onShowMore}>
          Show 20 more {featurePlural}
        </Button>
      )}
    </div>
  );
}
