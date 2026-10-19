import type { TermDatabaseRecord } from './GeneFunction';

export interface AnnotatedTermRecord {
  title: string;
  identifier: string;
  database: TermDatabaseRecord;
  /** Genes annotated to the term across the whole database. */
  total_term_annotations: number;
  /** Genes annotated to any term in the database. */
  total_gene_annotations: number;
  /** The requested genes annotated to the term. */
  annotations: readonly number[];
}

export interface TermHit {
  title: string;
  identifier: string;
  database: string;
  /** The shown genes annotated to the term. */
  genes: number[];
  /** Adjusted enrichment p-value, when the term was tested. */
  pValue?: number;
}

const logFactorials: number[] = [0];
const logFactorial = (n: number) => {
  for (let i = logFactorials.length; i <= n; i++) logFactorials[i] = (logFactorials[i - 1] ?? 0) + Math.log(i);
  return logFactorials[n] ?? 0;
};
const logChoose = (n: number, k: number) => logFactorial(n) - logFactorial(k) - logFactorial(n - k);

// Ranks the terms behind a network's genes, computed in the browser from GET /api/terms/annotated/.
export class TermEnrichment {
  /** Term sizes tested for enrichment, which reproduces the live site's ranking. */
  static readonly testedSizes = [20, 300] as const;

  constructor(private readonly terms: readonly AnnotatedTermRecord[]) {}

  /** Chance of drawing `hits` or more of a term's `termSize` genes when `draws` genes are picked from `population`. */
  static hypergeometricTail(population: number, termSize: number, draws: number, hits: number): number {
    let p = 0;
    for (let i = hits; i <= Math.min(termSize, draws); i++) p += Math.exp(logChoose(termSize, i) + logChoose(population - termSize, draws - i) - logChoose(population, draws));
    return Math.min(1, p);
  }

  private hits(shown: ReadonlySet<number>): (TermHit & { record: AnnotatedTermRecord })[] {
    return this.terms.flatMap((record) => {
      const genes = record.annotations.filter((entrez) => shown.has(entrez));
      return genes.length ? [{ record, title: record.title, identifier: record.identifier, database: record.database.name, genes }] : [];
    });
  }

  /** Terms over-represented among the shown genes, most significant first (hypergeometric test, Benjamini-Hochberg adjusted). */
  enriched(shown: ReadonlySet<number>): TermHit[] {
    const annotated = new Set(this.terms.flatMap((term) => term.annotations).filter((entrez) => shown.has(entrez)));
    const [smallest, largest] = TermEnrichment.testedSizes;
    const tested = this.hits(shown)
      .filter(({ record }) => record.total_term_annotations >= smallest && record.total_term_annotations <= largest)
      .map((hit) => ({ ...hit, raw: TermEnrichment.hypergeometricTail(hit.record.total_gene_annotations, hit.record.total_term_annotations, annotated.size, hit.genes.length) }))
      .sort((a, b) => a.raw - b.raw);
    let lowest = 1;
    for (let rank = tested.length; rank >= 1; rank--) {
      const hit = tested[rank - 1];
      if (!hit) continue;
      lowest = Math.min(lowest, (hit.raw * tested.length) / rank);
      hit.raw = lowest;
    }
    return tested
      .sort((a, b) => a.raw - b.raw || b.genes.length - a.genes.length || a.title.localeCompare(b.title))
      .map(({ title, identifier, database, genes, raw }) => ({ title, identifier, database, genes, pValue: raw }));
  }

  /** Terms by how many shown genes they include, most first. */
  byGeneCount(shown: ReadonlySet<number>): TermHit[] {
    return this.hits(shown)
      .map(({ title, identifier, database, genes }) => ({ title, identifier, database, genes }))
      .sort((a, b) => b.genes.length - a.genes.length || a.title.localeCompare(b.title));
  }
}
