import { AsdVariant } from './AsdVariant';

const row = { chromosome: 'chr1', position: 665_024, ref: 'A', alt: 'G', individual: '14405-p1', dnaScore: -0.197, nearestGene: 'SAMD11', tssDistance: 212_469, rnaScore: 0.18, rnaGene: 'RP5-857K21.4, RP11-206L10.2' };

describe('AsdVariant', () => {
  it('writes positions, changes and distances as the table shows them', () => {
    const variant = new AsdVariant(row);
    expect(variant.position).toBe('chr1:665,024');
    expect(variant.change).toBe('A>G');
    expect(variant.tssDistance).toBe('212,469');
  });

  it('keeps the sign with a true minus and three decimals', () => {
    expect(AsdVariant.score(-0.197)).toBe('−0.197');
    expect(AsdVariant.score(0.18)).toBe('0.180');
    expect(AsdVariant.score(-0.0001)).toBe('0.000');
  });

  it('says Not available for blanks instead of zero', () => {
    const variant = new AsdVariant({ ...row, rnaScore: null, rnaGene: '', tssDistance: null });
    expect(AsdVariant.score(variant.row.rnaScore)).toBe('Not available');
    expect(variant.rnaGene).toBe('Not available');
    expect(variant.tssDistance).toBe('Not available');
  });

  it('marks scores of 1.5 or more as strong', () => {
    expect(AsdVariant.isStrong(1.5)).toBe(true);
    expect(AsdVariant.isStrong(1.49)).toBe(false);
    expect(AsdVariant.isStrong(null)).toBe(false);
  });
});
