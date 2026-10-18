import type { TokenEntry } from '@humanbase/tokens/catalog';
import type { ColorValue } from '@humanbase/tokens/color';

interface Length {
  value: number;
  unit: string;
}

interface ShadowLayer {
  color: ColorValue;
  offsetX: Length;
  offsetY: Length;
  blur: Length;
  spread: Length;
}

const length = ({ value, unit }: Length) => (value === 0 ? '0' : `${value}${unit}`);

const channels = (hex: string) => [1, 3, 5].map((start) => parseInt(hex.slice(start, start + 2), 16)).join(',');

/** A color written the way the Figma tables write it: hex, or "rgba(26,26,26,.06)" when it has an alpha. */
export const displayColor = ({ hex, alpha }: ColorValue) => (alpha === undefined ? hex : `rgba(${channels(hex)},${alpha.toFixed(2).replace(/^0/, '')})`);

/** A shadow in Figma's short form, such as "y 1, blur 2, 6% + y 2, blur 6, 6%". */
export function shadowSummary({ token: { $value } }: TokenEntry): string {
  return ($value as ShadowLayer[]).map((l) => `y ${l.offsetY.value}, blur ${l.blur.value}, ${Math.round((l.color.alpha ?? 1) * 100)}%`).join(' + ');
}

/** A raw token value written the way designers read it, such as "0 1px 2px rgba(26,26,26,.06)". */
export function displayValue({ token: { $type, $value } }: TokenEntry): string {
  if ($type === 'color') return displayColor($value as ColorValue);
  if ($type === 'dimension') return length($value as Length);
  if ($type === 'shadow') {
    const layers = $value as ShadowLayer[];
    return layers.length === 0 ? 'none' : layers.map((l) => `${[l.offsetX, l.offsetY, l.blur, l.spread].map(length).join(' ')} ${displayColor(l.color)}`).join(', ');
  }
  return String($value);
}
