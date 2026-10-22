import { byGenomePosition, type Variant } from './Variant';

export type PlotBy = 'genome' | 'rank';

export interface PlotPoint {
  variant: Variant;
  /** Genome: the variant's place on the joined chromosome regions. Rank: 1 for the highest score. */
  x: number;
  y: number;
}

/** One chromosome's stretch of the genome axis, from its first variant to its last. */
export interface ChromosomeRegion {
  chromosome: string;
  begin: number;
  end: number;
  firstPosition: number;
  lastPosition: number;
}

export type Domain = readonly [number, number];

const tickCount = 7;
// The points nearest each end sit this many pixels inside the plot.
const edgePadding = 12;

const scoreOf = (variant: Variant, key: string) => variant.scores[key] ?? 0;

/** Where humanbase.io's variant score plot puts each variant, and how its axes read. */
export class ScorePlotLayout {
  readonly points: readonly PlotPoint[];
  readonly regions: readonly ChromosomeRegion[];

  private constructor(
    readonly by: PlotBy,
    points: PlotPoint[],
    regions: ChromosomeRegion[],
  ) {
    this.points = points;
    this.regions = regions;
  }

  static of(variants: readonly Variant[], key: string, by: PlotBy) {
    return by === 'genome' ? ScorePlotLayout.genome(variants, key) : ScorePlotLayout.rank(variants, key);
  }

  /** Chromosomes side by side, each as long as its variants span, with a gap of 18/800 of the total span between them. */
  static genome(variants: readonly Variant[], key: string) {
    const sorted = [...variants].sort(byGenomePosition);
    const spans = new Map<string, [number, number]>();
    for (const { chromosome, position } of sorted) spans.set(chromosome, [spans.get(chromosome)?.[0] ?? position, position]);
    const total = [...spans.values()].reduce((sum, [first, last]) => sum + last - first, 0);
    const gap = Math.max(1, Math.trunc((total / 800) * 18));
    const regions: ChromosomeRegion[] = [];
    let begin = 0;
    for (const [chromosome, [firstPosition, lastPosition]] of spans) {
      regions.push({ chromosome, begin, end: begin + lastPosition - firstPosition, firstPosition, lastPosition });
      begin += lastPosition - firstPosition + gap;
    }
    const byName = new Map(regions.map((region) => [region.chromosome, region]));
    const points = sorted.map((variant) => {
      const region = byName.get(variant.chromosome);
      return { variant, x: region ? region.begin + variant.position - region.firstPosition : 0, y: scoreOf(variant, key) };
    });
    return new ScorePlotLayout('genome', points, regions);
  }

  /** Highest score first, at 1, 2, 3 and so on. */
  static rank(variants: readonly Variant[], key: string) {
    const sorted = [...variants].sort((a, b) => scoreOf(b, key) - scoreOf(a, key));
    return new ScorePlotLayout(
      'rank',
      sorted.map((variant, index) => ({ variant, x: index + 1, y: scoreOf(variant, key) })),
      [],
    );
  }

  /** The whole x axis, with 12px to spare beyond the first and last point at this plot width. */
  domain(width: number): Domain {
    const first = this.points[0]?.x ?? 0;
    const last = this.points.at(-1)?.x ?? 0;
    const span = last - first;
    if (span === 0) return [first - 1, last + 1];
    const pad = (edgePadding * span) / Math.max(width, 1);
    return [first - pad, last + pad];
  }

  /** The y axis always includes 0. */
  scoreDomain(): Domain {
    const values = this.points.map((point) => point.y);
    const low = Math.min(0, ...values);
    const high = Math.max(0, ...values);
    return low === high ? [0, 1] : [low, high];
  }

  /** Seven evenly spaced ticks across the view, at whole units. */
  static ticks([start, end]: Domain) {
    return Array.from({ length: tickCount }, (_, index) => Math.trunc(((end - start) / (tickCount - 1)) * index + start));
  }

  /** Genome ticks name a chromosome and position, such as chr3:12598855; between chromosomes, the nearer edge. The last tick has no label. */
  tickLabel(value: number, index: number) {
    if (index === tickCount - 1) return '';
    if (this.by === 'rank') return String(Math.trunc(value));
    const inside = this.regions.find((region) => value >= region.begin && value <= region.end);
    if (inside) return `${inside.chromosome}:${Math.trunc(inside.firstPosition + value - inside.begin)}`;
    const after = this.regions.findIndex((region) => region.begin > value);
    const next = this.regions[after];
    const previous = this.regions[after - 1];
    if (next && previous) return value - previous.end < next.begin - value ? `${previous.chromosome}:${previous.lastPosition}` : `${next.chromosome}:${next.firstPosition}`;
    const edge = next ?? this.regions.at(-1);
    if (!edge) return '';
    return next ? `${edge.chromosome}:${edge.firstPosition}` : `${edge.chromosome}:${edge.lastPosition}`;
  }

  /** Each chromosome's band in the overview, meeting its neighbors halfway across the gap; Rank has one band. */
  bands([start, end]: Domain) {
    return this.regions.map((region, index) => {
      const previous = this.regions[index - 1];
      const next = this.regions[index + 1];
      return {
        region,
        index,
        from: previous ? (previous.end + region.begin) / 2 : start,
        to: next ? (region.end + next.begin) / 2 : end,
      };
    });
  }
}
