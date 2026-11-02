import { describe, expect, it } from 'vitest';
import { lightness } from './color.ts';
import { drawScale } from './scale.ts';
import themeTwo from './src/theme-2.tokens.json';

const primary = Object.fromEntries(Object.entries(themeTwo.color.primary).map(([step, token]) => [step, token.$value.hex]));

describe('drawScale', () => {
  it('keeps the brand color at its step and darkens from 50 to 900', () => {
    const scale = drawScale('#0f766e', '600', primary);
    expect(scale['600']).toBe('#0F766E');
    expect(Object.keys(scale)).toEqual(Object.keys(primary));
    const steps = Object.values(scale).map(lightness);
    expect(steps).toEqual([...steps].sort((a, b) => b - a));
  });

  it("redraws Theme 2's blue from its own 600", () => {
    const scale = drawScale(primary['600'] ?? '', '600', primary);
    for (const [step, hex] of Object.entries(primary)) expect(Math.abs(lightness(scale[step] ?? '') - lightness(hex))).toBeLessThan(1.5);
  });
});
