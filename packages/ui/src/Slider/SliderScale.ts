export class SliderScale {
  readonly decimals: number;

  constructor(
    readonly min: number,
    readonly max: number,
    readonly step: number,
  ) {
    this.decimals = (String(step).split('.')[1] ?? '').length;
  }

  clamp(value: number): number {
    return Math.min(this.max, Math.max(this.min, value));
  }

  snap(value: number): number {
    const steps = Math.round((this.clamp(value) - this.min) / this.step);
    return Number(this.clamp(this.min + steps * this.step).toFixed(this.decimals));
  }

  /** The value a key press reaches, counted from the value as shown, so a value between steps never seems stuck. */
  next(value: number, direction: 1 | -1, steps = 1): number {
    return this.snap(this.snap(value) + direction * steps * this.step);
  }

  percent(value: number): number {
    return ((value - this.min) / (this.max - this.min)) * 100;
  }

  format(value: number): string {
    return value.toFixed(this.decimals);
  }

  parse(text: string): { value: number; note?: string } | undefined {
    const typed = Number(text.trim().replace(',', '.'));
    if (text.trim() === '' || Number.isNaN(typed)) return undefined;
    if (typed > this.max) return { value: this.max, note: `Set to ${this.format(this.max)}, the maximum` };
    if (typed < this.min) return { value: this.min, note: `Set to ${this.format(this.min)}, the minimum` };
    return { value: this.snap(typed) };
  }
}
