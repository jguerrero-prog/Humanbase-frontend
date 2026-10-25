import { termsTsv } from './termsTsv';

describe('termsTsv', () => {
  const term = { title: 'cytokine-mediated signaling pathway', identifier: 'GO:0019221', database: 'Gene Ontology (BP)', genes: [3553, 3554, 3569] };
  const hit = { ...term, pValue: 0.0000481234567891 };

  it('writes the adjusted p-value the Processes table shows, at full precision', () => {
    expect(termsTsv('processes', [hit]).split('\n')).toEqual([
      'term\tidentifier\tdatabase\tgenes\tadjusted_p_value_benjamini_hochberg',
      'cytokine-mediated signaling pathway\tGO:0019221\tGene Ontology (BP)\t3\t4.81234567891e-5',
    ]);
  });

  it('writes gene counts only for tissues', () => {
    expect(termsTsv('tissues', [term]).split('\n')[1]).toBe('cytokine-mediated signaling pathway\tGO:0019221\tGene Ontology (BP)\t3');
  });
});
