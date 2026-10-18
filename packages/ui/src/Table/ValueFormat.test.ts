import { ValueFormat } from './ValueFormat';

describe('ValueFormat', () => {
  const format = new ValueFormat();

  it('gives scores two decimals and a leading zero', () => {
    expect(format.score(0.9400001)).toBe('0.94');
    expect(format.score(1)).toBe('1.00');
  });

  it('writes p-values the way papers do', () => {
    expect(format.scientific(1.2e-12)).toBe('1.2 × 10⁻¹²');
    expect(format.scientific(0.00344)).toBe('3.4 × 10⁻³');
  });

  it('separates thousands and writes unambiguous dates', () => {
    expect(format.count(25825)).toBe('25,825');
    expect(format.date('2026-10-16')).toBe('Oct 16, 2026');
  });

  it('says a value is missing instead of showing zero', () => {
    expect(format.score(null)).toBe('Not available');
    expect(format.count(undefined)).toBe('Not available');
    expect(format.date('not a date')).toBe('Not available');
  });
});
