import { ConnectionEvidence } from '../connections/Connection';
import { GeneFunction, type AnnotationRecord, type PredictionRecord, type TermRecord } from './GeneFunction';
import { SampleClient } from '../sample/SampleClient';
import { TermEnrichment, type AnnotatedTermRecord } from './TermEnrichment';
import { TermService } from './TermService';

const database = { name: 'Gene Ontology (BP)', slug: 'gene-ontology-bp' };
const term = (identifier: string, title: string): TermRecord => ({ identifier, title, database });

describe('GeneFunction.fromRecords', () => {
  const annotations: AnnotationRecord[] = [
    { term: term('GO:1', 'epithelial cell differentiation'), database: { name: 'UniProt-GOA', slug: 'uniprot-goa' }, evidence: 'IGI', pub: null },
    { term: term('GO:1', 'epithelial cell differentiation'), database: { name: 'UniProt-GOA', slug: 'uniprot-goa' }, evidence: 'IDA', pub: null },
  ];
  const predictions: PredictionRecord[] = [
    { term: term('GO:1', 'epithelial cell differentiation'), score: 0.4 },
    { term: term('GO:2', 'cell activation'), score: 0.9 },
  ];

  it('puts experimental terms first at confidence 1, with every source', () => {
    const [first, second] = GeneFunction.fromRecords(annotations, predictions);
    expect(first?.identifier).toBe('GO:1');
    expect(first?.confidence).toBe(1);
    expect(first?.evidence).toHaveLength(2);
    expect(second).toMatchObject({ confidence: 0.9, isExperimental: false });
  });

  it('names evidence codes', () => {
    expect(GeneFunction.evidenceName('IGI')).toBe('Inferred from genetic interaction');
    expect(GeneFunction.evidenceName('XYZ')).toBe('XYZ');
  });
});

describe('TermEnrichment', () => {
  it('computes the hypergeometric upper tail', () => {
    // Drawing 3 of 10 genes, 4 of them in the term: P(2 or more) = (6·6 + 4·1) / 120.
    expect(TermEnrichment.hypergeometricTail(10, 4, 3, 2)).toBeCloseTo(40 / 120, 10);
  });

  const record = (identifier: string, size: number, annotations: number[]): AnnotatedTermRecord => ({
    identifier,
    title: identifier,
    database,
    total_term_annotations: size,
    total_gene_annotations: 8000,
    annotations,
  });
  const enrichment = new TermEnrichment([record('a', 25, [1, 2, 3]), record('b', 280, [1, 2, 3]), record('common', 6000, [1, 2, 3]), record('single', 3, [4]), record('other', 50, [5])]);

  it('lists terms with two or more shown genes and an adjusted p-value of 0.05 or less, most significant first', () => {
    const hits = enrichment.enriched(new Set([1, 2, 3, 4]));
    expect(hits.map((hit) => hit.title)).toEqual(['a', 'b']);
    expect(hits[0]?.pValue).toBeLessThan(hits[1]?.pValue ?? 0);
    expect(hits[0]?.genes).toEqual([1, 2, 3]);
  });

  it('reproduces humanbase.io on the IL1B global network', async () => {
    const network = [3553, 3554, 5329, 5743, 7130, 3383, 3569, 2919, 6347, 6364, 597, 3557, 7128, 3575, 6351, 5341, 9308, 7097, 5791, 3576, 5552, 7127, 1839, 2920, 2207, 8870, 8638, 834, 8843, 4688, 80149, 54210, 6648, 5055, 3627, 963, 1848, 2921, 3055, 366, 10135, 6775, 22822, 6280, 8942, 5271, 5054, 6515, 4790, 960, 602];
    const terms = await new TermService(SampleClient.bundled()).annotated(network, TermService.processDatabases);
    const rows = terms.enriched(new Set(network.slice(0, 15))).map((hit) => [hit.title, hit.genes.length, hit.pValue?.toExponential(1)]);
    // humanbase.io's Enriched function table for IL1B, global, 15 genes. Terms with equal p-values come in the API's order.
    const live = [
      ['cytokine-mediated signaling pathway', 6, '4.8e-5'],
      ['cellular response to cytokine stimulus', 6, '4.2e-4'],
      ['cellular response to lipopolysaccharide', 4, '6.7e-4'],
      ['cellular response to molecule of bacterial origin', 4, '7.3e-4'],
      ['regulation of leukocyte migration', 4, '7.7e-4'],
      ['response to lipopolysaccharide', 4, '7.7e-4'],
      ['cellular response to biotic stimulus', 4, '7.7e-4'],
      ['regulation of lymphocyte migration', 3, '8.7e-4'],
      ['response to molecule of bacterial origin', 4, '8.7e-4'],
      ['lipopolysaccharide-mediated signaling pathway', 3, '8.7e-4'],
      ['regulation of endothelial cell apoptotic process', 3, '9.8e-4'],
      ['inflammatory response', 4, '9.8e-4'],
      ['negative regulation of apoptotic signaling pathway', 4, '9.8e-4'],
      ['lymphocyte migration', 3, '9.8e-4'],
    ];
    const byValue = (list: unknown[][]) => list.map(([title, genes, q]) => `${String(q)} ${String(genes)} ${String(title)}`).sort();
    expect(rows.slice(0, 4)).toEqual(live.slice(0, 4));
    expect(byValue(rows.slice(4, 10))).toEqual(byValue(live.slice(4, 10)));
    expect(byValue(rows.filter(([, , q]) => q === '9.8e-4'))).toEqual(expect.arrayContaining(byValue(live.slice(10))));
    expect(rows[live.length + 1]?.[2]).toBe('1.4e-3');
  });

  it('only counts the genes that are shown', () => {
    expect(enrichment.byGeneCount(new Set([1, 5])).map((hit) => [hit.title, hit.genes.length])).toEqual([
      ['a', 1],
      ['b', 1],
      ['common', 1],
      ['other', 1],
    ]);
  });
});

describe('ConnectionEvidence', () => {
  const evidence = new ConnectionEvidence({
    datatypes: [
      { title: 'Co-expression', weight: 0.42 },
      { title: 'Interaction', weight: 0 },
      { title: 'GSEA perturbations', weight: 0.58 },
    ],
    datasets: [
      { identifier: 'a', title: 'Small', etype: { title: 'Co-expression', slug: 'co-expression' }, posterior: 0.004 },
      { identifier: 'b', title: 'MSigDB CGP', etype: { title: 'GSEA perturbations', slug: 'gsea-perturbations' }, posterior: 0.2 },
    ],
  });

  it('lists supporting data types and datasets, strongest first', () => {
    expect(evidence.dataTypes).toEqual(['GSEA perturbations', 'Co-expression']);
    expect(evidence.datasets.map((dataset) => dataset.title)).toEqual(['MSigDB CGP', 'Small']);
  });
});
