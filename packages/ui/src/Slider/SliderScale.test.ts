import { SliderScale } from './SliderScale';

describe('SliderScale', () => {
  const confidence = new SliderScale(0, 1, 0.01);
  const genes = new SliderScale(5, 50, 5);

  it('snaps to the step and formats like the step', () => {
    expect(confidence.snap(0.8434262366342233)).toBe(0.84);
    expect(confidence.format(0.8)).toBe('0.80');
    expect(genes.snap(17)).toBe(15);
    expect(genes.format(15)).toBe('15');
  });

  it('clamps typed values to the range and says so', () => {
    expect(confidence.parse('1.4')).toEqual({ value: 1, note: 'Set to 1.00, the maximum' });
    expect(genes.parse('2')).toEqual({ value: 5, note: 'Set to 5, the minimum' });
    expect(genes.parse('22')).toEqual({ value: 20 });
    expect(confidence.parse('abc')).toBeUndefined();
  });

  it('gives the fill position as a percentage', () => {
    expect(genes.percent(15)).toBeCloseTo(22.22, 1);
  });

  it('steps from the value as shown, even when the value sits between steps', () => {
    const scale = new SliderScale(0, 1, 0.01);
    expect(scale.next(0.4769, 1)).toBe(0.49);
    expect(scale.next(0.4769, -1)).toBe(0.47);
    expect(scale.next(0.48, 1)).toBe(0.49);
    expect(scale.next(0.48, -1, 10)).toBe(0.38);
    expect(scale.next(1, 1)).toBe(1);
  });
});
