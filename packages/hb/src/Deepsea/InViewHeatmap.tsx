import { GenomeLocation, type FeatureEffect } from '@humanbase/data';
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
const tickSteps = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1_000, 2_000, 5_000, 10_000, 20_000, 50_000, 100_000, 200_000, 500_000];
// humanbase.io gives each variant a 15px slot across the heatmap's width and ignores drag moves over 100px.
const slotWidth = 15;
const longestMove = 100;
// Before the heatmap is measured, humanbase.io assumes its 1170px page width.
const slotsIn = (width: number) => Math.floor((width > 0 ? width : 1170) / slotWidth);

/** humanbase.io's Compact View: one variant per slot; the center variant, or else the higher variant score, keeps a shared slot. */
function compactColumns(variants: readonly VariantInView[], selected: number, location: GenomeLocation, width: number): number[] {
  const slots = slotsIn(width);
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

/** humanbase.io's Full View: every variant while they fit one slot each; past that, the run of variants that keeps the center one at its own slot. */
function fullColumns(variants: readonly VariantInView[], selected: number, location: GenomeLocation, width: number): number[] {
  const slots = slotsIn(width);
  const all = variants.map((_, index) => index);
  const center = variants[selected];
  if (variants.length <= slots || !center) return all;
  const home = Math.min(slots - 1, Math.max(0, Math.floor((center.position - location.start) / (location.width / slots))));
  const first = Math.min(variants.length - slots, Math.max(0, selected - home));
  return all.slice(first, first + slots);
}

/** A ruler over the columns, from round ticks around the first and last, in about five steps. */
function columnRuler(first: number, last: number): { offset: number; ticks: number[] } {
  const step = tickSteps.find((size) => (last - first) / size <= 5) ?? tickSteps.at(-1) ?? 1;
  const offset = Math.floor(first / step) * step;
  const steps = Math.max(1, Math.ceil((last - offset) / step));
  return { offset, ticks: Array.from({ length: steps + 1 }, (_, index) => index * step) };
}

/** One column per variant in view, in genome order; rows ranked by the size of the center variant's effect, as on humanbase.io. */
export function InViewHeatmap({ location, variants: all, selected: center, shown, limit, reversed, compact, scale, scoreName, featurePlural, onShowMore, onSelect, onMove }: InViewHeatmapProps) {
  const [box, width] = useWidth();
  const kept = (compact ? compactColumns : fullColumns)(all, center, location, width);
  const variants = kept.flatMap((index) => all[index] ?? []);
  const selected = kept.indexOf(center);
  const centerVariant = all[center];
  const indexOf = new Map((centerVariant?.effects ?? []).map((effect, index) => [effect, index]));
  const ranked = [...shown].sort((a, b) => Math.abs(b.value) - Math.abs(a.value));
  if (reversed) ranked.reverse();
  const top = ranked.slice(0, limit);
  const first = variants[0]?.position ?? location.start;
  const last = variants.at(-1)?.position ?? location.end;
  // The ruler spans the columns, not the whole view, so each line reaches its own place even when the view is wide.
  const ruler = columnRuler(first, last);
  const columnsCover =
    !compact && kept.length < all.length
      ? `The ${count.format(variants.length)} columns are the variants around the outlined one, ${location.chrom}:${count.format(first)}-${count.format(last)} (${GenomeLocation.widthInWords(last - first + 1)}), out of ${count.format(all.length)} in the genome browser’s ${GenomeLocation.widthInWords(location.width)} view, in genomic order`
      : 'One column per variant in the genome browser’s view, in genomic order';
  const showing = top.length === ranked.length ? `all ${count.format(ranked.length)}` : `the ${reversed ? 'bottom' : 'top'} ${top.length} of ${count.format(ranked.length)}`;
  const drag = (dx: number) => {
    if (!onMove || !width || dx === 0 || Math.abs(dx) > longestMove) return;
    onMove(Math.floor((-dx * location.width) / width));
  };

  return (
    <div className="effects-heatmap" ref={box}>
      <Heatmap
        title={`${scoreName}. Showing ${showing} ${featurePlural}, ranked by ${centerVariant?.name ?? 'the selected variant'}.`}
        summary={`${columnsCover}; rows ranked by the size of the outlined variant’s effect.`}
        scale={scale.legend}
        columns={variants.map((variant) => ({ label: variant.key, position: variant.position, name: variant.name, ...(variant.href && { href: variant.href }) }))}
        rows={top.map((effect) => ({ label: effect.label, values: variants.map((variant) => variant.effects?.[indexOf.get(effect) ?? -1]?.value ?? null) }))}
        rowHeader="Feature"
        columnHeader="Variant"
        valueLabel={scoreName}
        axis={variants.length > 1 ? { title: `Position on ${location.chrom}, ${location.assemblyName}`, ...ruler } : undefined}
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
