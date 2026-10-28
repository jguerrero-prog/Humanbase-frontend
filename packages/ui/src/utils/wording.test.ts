import { describe, expect, it } from 'vitest';
import { genesWord, listJoin } from './wording';

describe('listJoin', () => {
  it('joins with commas and a final "and"', () => {
    expect(listJoin([])).toBe('');
    expect(listJoin(['TP53'])).toBe('TP53');
    expect(listJoin(['TP53', 'BRCA1'])).toBe('TP53 and BRCA1');
    expect(listJoin(['TP53', 'BRCA1', 'EGFR'])).toBe('TP53, BRCA1 and EGFR');
  });
});

describe('genesWord', () => {
  it('counts genes with a thousands separator', () => {
    expect(genesWord(1)).toBe('1 gene');
    expect(genesWord(0)).toBe('0 genes');
    expect(genesWord(1200)).toBe('1,200 genes');
  });
});
