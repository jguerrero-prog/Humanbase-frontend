// A small preference saved in this browser. Storage can be blocked, so reads fall back and writes may not stick.
export class BrowserSetting<T extends string> {
  constructor(
    private readonly key: string,
    private readonly fallback: T,
    private readonly allowed: readonly T[],
  ) {}

  get(): T {
    try {
      const saved = localStorage.getItem(this.key);
      return this.allowed.find((value) => value === saved) ?? this.fallback;
    } catch {
      return this.fallback;
    }
  }

  set(value: T): void {
    try {
      localStorage.setItem(this.key, value);
    } catch {
      // The choice then lasts only for this page.
    }
  }
}
