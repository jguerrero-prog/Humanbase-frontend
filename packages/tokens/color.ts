import { aliasPath, flattenTokens, type TokenEntry, type TokenGroup } from './catalog.ts';

export interface ColorValue {
  hex: string;
  alpha?: number;
}

export type ContrastRating = 'Pass' | 'Large text only' | 'Decorative only';

const channel = (value: number) => (value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4);

function luminance(hex: string): number {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) => channel(parseInt(hex.slice(start, start + 2), 16) / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contrastRatio(foreground: string, background: string): number {
  const [light, dark] = [luminance(foreground), luminance(background)].sort((a, b) => b - a) as [number, number];
  return (light + 0.05) / (dark + 0.05);
}

export function contrastRating(ratio: number): ContrastRating {
  if (ratio >= 4.5) return 'Pass';
  return ratio >= 3 ? 'Large text only' : 'Decorative only';
}

export class ColorCatalog {
  readonly #entries = new Map<string, TokenEntry>();

  constructor(...groups: TokenGroup[]) {
    for (const entry of groups.flatMap((group) => flattenTokens(group))) {
      if (entry.token.$type === 'color') this.#entries.set(entry.path.join('.'), entry);
    }
  }

  entry(path: string): TokenEntry {
    const entry = this.#entries.get(path);
    if (!entry) throw new Error(`No color token named ${path}`);
    return entry;
  }

  /** The token an alias points at, such as "color.emerald.600", or undefined for a raw value. */
  target(path: string): string | undefined {
    const value = this.entry(path).token.$value;
    return typeof value === 'string' ? aliasPath(value).join('.') : undefined;
  }

  value(path: string): ColorValue {
    const target = this.target(path);
    return target ? this.value(target) : (this.entry(path).token.$value as ColorValue);
  }

  hex(path: string): string {
    return this.value(path).hex;
  }

  contrast(foreground: string, background: string): number {
    return contrastRatio(this.hex(foreground), this.hex(background));
  }
}
