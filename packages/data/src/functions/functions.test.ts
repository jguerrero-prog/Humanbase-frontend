import { ConnectionEvidence } from '../connections/Connection';
import { GeneFunction, type AnnotationRecord, type PredictionRecord, type TermRecord } from './GeneFunction';
import { TermEnrichment, type AnnotatedTermRecord } from './TermEnrichment';

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
  const enrichment = new TermEnrichment([record('rare', 25, [1, 2, 3]), record('common', 280, [1, 2, 3]), record('huge', 900, [1, 2, 3, 4]), record('other', 50, [5])]);

  it('ranks tested terms by adjusted p-value and skips terms outside the tested sizes', () => {
    const hits = enrichment.enriched(new Set([1, 2, 3, 4]));
    expect(hits.map((hit) => hit.title)).toEqual(['rare', 'common']);
    expect(hits[0]?.pValue).toBeLessThan(hits[1]?.pValue ?? 0);
    expect(hits[0]?.genes).toEqual([1, 2, 3]);
  });

  it('only counts the genes that are shown', () => {
    expect(enrichment.byGeneCount(new Set([1, 5])).map((hit) => [hit.title, hit.genes.length])).toEqual([
      ['common', 1],
      ['huge', 1],
      ['other', 1],
      ['rare', 1],
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
