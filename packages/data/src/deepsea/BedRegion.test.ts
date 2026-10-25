import { describe, expect, it } from 'vitest';
import { BedRegion } from './BedRegion';

describe('BedRegion', () => {
  it('reads the Sei example’s single-base regions as the bases genome browsers number from 1', () => {
    const [region] = BedRegion.parse('chr1\t109817090\t109817091\t.\t0\t*\r\nchr10\t23507863\t23507864\t.\t0\t*\r\n');
    expect(region).toMatchObject({ chromosome: 'chr1', first: 109817091, width: 1, position: 109817091, label: 'chr1:109,817,091' });
  });

  it('marks the middle of a wider region and shows room around it', () => {
    const [region] = BedRegion.parse('track name=x\n#comment\n7\t1000\t301000\n');
    expect(region?.label).toBe('chr7:1,001-301,000');
    expect(region?.position).toBe(151000);
    expect(region?.view('hg38', 100_000).width).toBe(600_000);
  });

  it('skips lines the form refuses and keeps a view inside the chromosome', () => {
    expect(BedRegion.parse('chr1\t10\t5\nchr1\tx\t9\n')).toEqual([]);
    expect(BedRegion.parse('chr16\t209209\t209210\n')[0]?.view('hg19', 500_000).start).toBe(0);
  });
});
