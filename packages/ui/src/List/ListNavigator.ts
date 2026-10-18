export interface NavigableOption {
  label: string;
  disabled?: boolean | undefined;
}

const typeAheadPause = 500;

export class ListNavigator {
  private typed = '';
  private typedAt = 0;

  constructor(
    private readonly options: readonly NavigableOption[],
    private readonly columns: readonly (readonly number[])[] = [options.map((_, index) => index)],
  ) {}

  first(): number {
    return this.step(-1, 1);
  }

  last(): number {
    return this.step(this.options.length, -1);
  }

  next(from: number): number {
    return this.step(from, 1, from);
  }

  previous(from: number): number {
    return this.step(from, -1, from);
  }

  sideways(from: number, direction: 1 | -1): number {
    const column = this.columns.findIndex((indexes) => indexes.includes(from));
    const target = this.columns[column + direction];
    if (column < 0 || !target) return from;
    const row = this.columns[column]?.indexOf(from) ?? 0;
    const enabled = target.filter((index) => !this.options[index]?.disabled);
    return enabled[Math.min(row, enabled.length - 1)] ?? from;
  }

  typeAhead(from: number, key: string, now = Date.now()): number {
    this.typed = now - this.typedAt > typeAheadPause ? key : this.typed + key;
    this.typedAt = now;
    const search = this.typed.toLowerCase();
    const count = this.options.length;
    for (let offset = 1; offset <= count; offset++) {
      const index = (from + offset) % count;
      const option = this.options[index];
      if (option && !option.disabled && option.label.toLowerCase().startsWith(search)) return index;
    }
    return from;
  }

  private step(from: number, direction: 1 | -1, fallback = -1): number {
    for (let index = from + direction; index >= 0 && index < this.options.length; index += direction) {
      if (!this.options[index]?.disabled) return index;
    }
    return fallback;
  }
}
