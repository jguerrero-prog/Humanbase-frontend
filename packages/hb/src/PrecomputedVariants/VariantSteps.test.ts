import { VariantSteps } from './VariantSteps';

const variant = (chromosome: string, position: number) => ({ chromosome, position, ref_allele: 'C', alt_allele: 'T' });

describe('VariantSteps', () => {
  const first = variant('chr17', 73_839_907);
  const second = variant('chrX', 37_639_264);
  const third = variant('chr1', 8_021_919);
  const steps = new VariantSteps([first, second, third]);

  it('steps through the list in its own order, across chromosomes', () => {
    expect(steps.next('chr17-73839907-C-T')).toBe(second);
    expect(steps.next('chrX-37639264-C-T')).toBe(third);
    expect(steps.previous('chrX-37639264-C-T')).toBe(first);
  });

  it('stops at either end, and has no step from a variant outside the list', () => {
    expect(steps.previous('chr17-73839907-C-T')).toBeUndefined();
    expect(steps.next('chr1-8021919-C-T')).toBeUndefined();
    expect(steps.next('chr2-1-C-T')).toBeUndefined();
    expect(steps.next(undefined)).toBeUndefined();
  });
});
