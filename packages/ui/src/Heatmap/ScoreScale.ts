export type ScaleKind = 'diverging' | 'sequential' | 'one-sided';

export interface ScaleSpec {
  title: string;
  kind: ScaleKind;
  /** Where steps meet, in the order the legend draws them. */
  edges: readonly number[];
  /** The legend's outer values, when it has them, such as 0 and 1 for confidence. */
  ends?: readonly [number, number];
  /** The score's own words for the two ends, such as Lowers and Raises. */
  words: readonly [string, string];
}

const palettes: Record<ScaleKind, readonly string[]> = {
  diverging: ['--viz-div-n3', '--viz-div-n2', '--viz-div-n1', '--viz-div-0', '--viz-div-p1', '--viz-div-p2', '--viz-div-p3'],
  sequential: ['--viz-seq-2', '--viz-seq-3', '--viz-seq-5', '--viz-seq-6', '--viz-seq-7'],
  'one-sided': ['--viz-sig-1', '--viz-sig-2', '--viz-sig-3', '--viz-sig-4'],
};

const plain = new Intl.NumberFormat('en-US', { maximumFractionDigits: 3 });

export class ScoreScale {
  readonly steps: number;
  private readonly descending: boolean;

  constructor(readonly spec: ScaleSpec) {
    this.steps = spec.edges.length + 1;
    const [first = 0, last = 0] = [spec.edges[0], spec.edges.at(-1)];
    this.descending = first > last;
  }

  /** A diverging scale from three stops, as a smooth low, middle, high ramp would color it: the outer edges sit at low and high, the inner ones a third and two thirds of the way out from the middle. */
  static fromStops(title: string, [low, middle, high]: readonly [number, number, number], words: readonly [string, string]): ScaleSpec {
    const toward = (end: number, share: number) => middle + (end - middle) * share;
    return { title, kind: 'diverging', edges: [low, toward(low, 2 / 3), toward(low, 1 / 3), toward(high, 1 / 3), toward(high, 2 / 3), high], words };
  }

  static number(value: number): string {
    return plain.format(value).replace('-', '−');
  }

  color(step: number): string {
    return palettes[this.spec.kind][step - 1] ?? palettes[this.spec.kind][0] ?? '';
  }

  /** The step a value falls in, from 1; values past the ends take the end step. */
  step(value: number | null): number | null {
    if (value === null || Number.isNaN(value)) return null;
    const passed = this.spec.edges.filter((edge) => (this.descending ? value <= edge : value >= edge)).length;
    return passed + 1;
  }

  /** The legend end a value lies beyond, or undefined when it's inside the legend. */
  pastEnd(value: number): number | undefined {
    const [low, high] = this.spec.ends ?? [this.spec.edges[0], this.spec.edges.at(-1)];
    if (low === undefined || high === undefined) return undefined;
    const [min, max] = low < high ? [low, high] : [high, low];
    if (value < min) return min;
    if (value > max) return max;
    return undefined;
  }

  /** The range a step covers, in words, such as "−3 to −2" or "below 0.5". */
  range(step: number): string {
    const before = this.spec.edges[step - 2];
    const after = this.spec.edges[step - 1];
    const text = ScoreScale.number;
    if (before === undefined) return `${this.descending ? 'above' : 'below'} ${text(after ?? 0)}`;
    if (after === undefined) return this.descending ? `below ${text(before)}` : `${text(before)} and up`;
    return this.descending ? `${text(after)} to ${text(before)}` : `${text(before)} to ${text(after)}`;
  }

  describe(value: number | null, format: (value: number) => string = ScoreScale.number): string {
    if (value === null) return 'Not available';
    const end = this.pastEnd(value);
    return end === undefined ? format(value) : `${format(value)}, past the end of the legend (${ScoreScale.number(end)})`;
  }
}
