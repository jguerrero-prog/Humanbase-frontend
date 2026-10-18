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

  it('writes percentages and signed values with a true minus', () => {
    expect(format.percent(35)).toBe('35%');
    expect(format.signed(-2.41, 2)).toBe('−2.41');
    expect(format.signed(1.9, 2)).toBe('+1.90');
  });

  it('gives p-values a screen, spoken and raw form, never zero', () => {
    expect(format.pValue(1.2e-12)).toEqual({ text: '1.2 × 10⁻¹²', spoken: '1.2 times 10 to the minus 12', raw: '1.2e-12' });
    expect(format.pValue(0.0031).text).toBe('0.0031');
    expect(format.pValue(0).text).toBe('< 1 × 10⁻³⁰⁰');
  });
});
