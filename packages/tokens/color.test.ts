import { describe, expect, it } from 'vitest';
import { ColorCatalog, contrastRatio, contrastRating } from './color.ts';

describe('contrastRatio', () => {
  it('matches the ratios documented in Figma', () => {
    expect(contrastRatio('#11713C', '#FFFFFF')).toBeCloseTo(6.08, 2);
    expect(contrastRatio('#FFD53D', '#11713C')).toBeCloseTo(4.3, 2);
    expect(contrastRatio('#1A1A1A', '#FFFFFF')).toBeCloseTo(17.4, 1);
  });

  it('rates ratios by the WCAG thresholds', () => {
    expect(contrastRating(6.08)).toBe('Pass');
    expect(contrastRating(3.91)).toBe('Large text only');
    expect(contrastRating(1.42)).toBe('Decorative only');
  });
});

describe('ColorCatalog', () => {
  const catalog = new ColorCatalog(
    { color: { emerald: { 600: { $type: 'color', $value: { hex: '#11713C' } } } } },
    { action: { primary: { $type: 'color', $value: '{color.emerald.600}' } } },
  );

  it('follows aliases to the primitive value', () => {
    expect(catalog.target('action.primary')).toBe('color.emerald.600');
    expect(catalog.hex('action.primary')).toBe('#11713C');
  });

  it('names a missing token', () => {
    expect(() => catalog.hex('action.missing')).toThrow('No color token named action.missing');
  });
});
