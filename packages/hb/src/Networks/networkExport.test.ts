import { Network } from '@humanbase/data';
import { describe, expect, it } from 'vitest';
import { networkFileName, networkText } from './networkExport';

const gene = (entrez: number, symbol: string, query = false) => ({ entrez, systematic_name: symbol, standard_name: symbol, description: '', aliases: [], xrefs: [], query });

describe('network text', () => {
  it('lists every pair with its unrounded weight, as the live site saves it', () => {
    const network = new Network({ mincut: 0.5, genes: [gene(6348, 'CCL3', true), gene(6351, 'CCL4'), gene(4792, 'NFKBIA')], edges: [{ source: 0, target: 1, weight: 0.9924881536514399 }, { source: 0, target: 2, weight: 0.40877373861889016 }] });
    expect(networkText(network.edges)).toBe('GENE1,GENE2,WEIGHT\nCCL3,CCL4,0.9924881536514399\nCCL3,NFKBIA,0.40877373861889016\n');
    expect(networkText(network.subset({ shown: 15, minConfidence: 0.5, prioritizeUniqueness: false }).edges)).toBe('GENE1,GENE2,WEIGHT\nCCL3,CCL4,0.9924881536514399\n');
  });

  it('names the file after the network', () => {
    expect(networkFileName('global')).toBe('global');
    expect(networkFileName('adipose tissue')).toBe('adipose_tissue');
  });
});
