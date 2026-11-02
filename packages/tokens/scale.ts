// Draws a 50–900 color scale around one brand color, shaped like a reference scale: each step keeps the
// reference's lightness spacing and relative chroma, in OKLCH, with the brand color's own hue.
export type Scale = Record<string, string>;

interface Oklch {
  l: number;
  c: number;
  h: number;
}

const toLinear = (v: number) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const toGamma = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

function toOklch(hex: string): Oklch {
  const [r = 0, g = 0, b = 0] = [1, 3, 5].map((start) => toLinear(parseInt(hex.slice(start, start + 2), 16) / 255));
  const [l, m, s] = [
    0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b,
    0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b,
    0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b,
  ].map(Math.cbrt) as [number, number, number];
  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const bb = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;
  return { l: L, c: Math.hypot(a, bb), h: Math.atan2(bb, a) };
}

function toRgb({ l: L, c, h }: Oklch): [number, number, number] {
  const a = c * Math.cos(h), b = c * Math.sin(h);
  const [l, m, s] = [L + 0.3963377774 * a + 0.2158037573 * b, L - 0.1055613458 * a - 0.0638541728 * b, L - 0.0894841775 * a - 1.291485548 * b].map((v) => v ** 3) as [number, number, number];
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ].map(toGamma) as [number, number, number];
}

/** The color as hex; chroma is reduced until it fits in sRGB, so the hue and lightness hold. */
function toHex(color: Oklch): string {
  let rgb = toRgb(color);
  for (let c = color.c; rgb.some((v) => v < -0.0005 || v > 1.0005) && c > 0; c -= 0.002) rgb = toRgb({ ...color, c: Math.max(c, 0) });
  return '#' + rgb.map((v) => Math.round(Math.min(1, Math.max(0, v)) * 255).toString(16).padStart(2, '0')).join('').toUpperCase();
}

/**
 * The scale with `brand` exactly at `anchor`. Steps lighter than the anchor spread toward the reference's lightest
 * step, darker ones toward its darkest, in the same proportions as the reference.
 */
export function drawScale(brand: string, anchor: string, reference: Scale): Scale {
  const ref = Object.entries(reference).map(([step, hex]) => ({ step, ...toOklch(hex) }));
  const base = toOklch(brand.toUpperCase());
  const at = ref.find((entry) => entry.step === anchor);
  const lightest = ref[0], darkest = ref.at(-1);
  if (!at || !lightest || !darkest) throw new Error(`The reference scale has no step ${anchor}`);
  return Object.fromEntries(
    ref.map(({ step, l, c }) => {
      if (step === anchor) return [step, brand.toUpperCase()];
      const end = l > at.l ? lightest.l : darkest.l;
      const lightness = base.l + ((l - at.l) / (end - at.l)) * (end - base.l);
      const chroma = at.c > 0.01 ? base.c * (c / at.c) : base.c;
      return [step, toHex({ l: lightness, c: chroma, h: base.h })];
    }),
  );
}
