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

// Ranks the terms behind a network's genes, computed in the browser from GET /api/terms/annotated/ as humanbase.io does.
export class TermEnrichment {
  /** Raw p-values a term needs to be a candidate, and adjusted ones it needs to be listed. */
  static readonly cutoff = 0.05;
  /** Adjusted p-values never go below this. */
  static readonly floor = 1e-12;

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

  /** Shown genes annotated to any term, counted per database. */
  private drawsByDatabase(hits: readonly (TermHit & { record: AnnotatedTermRecord })[]): Map<string, number> {
    const genes = new Map<string, Set<number>>();
    for (const { record, genes: hitGenes } of hits) {
      const set = genes.get(record.database.slug) ?? new Set<number>();
      hitGenes.forEach((entrez) => set.add(entrez));
      genes.set(record.database.slug, set);
    }
    return new Map([...genes].map(([slug, set]) => [slug, set.size]));
  }

  /** Terms over-represented among the shown genes, most significant first (hypergeometric test, Benjamini-Hochberg adjusted). */
  enriched(shown: ReadonlySet<number>): TermHit[] {
    const hits = this.hits(shown);
    const draws = this.drawsByDatabase(hits);
    const candidates = hits
      .filter((hit) => hit.genes.length >= 2)
      .map((hit) => ({ ...hit, raw: TermEnrichment.hypergeometricTail(hit.record.total_gene_annotations, hit.record.total_term_annotations, draws.get(hit.record.database.slug) ?? 0, hit.genes.length) }))
      .filter((hit) => hit.raw < TermEnrichment.cutoff)
      .sort((a, b) => a.raw - b.raw);
    const adjusted = candidates.map((hit, index) => Math.max(TermEnrichment.floor, (hit.raw * hits.length) / (index + 1)));
    for (let index = adjusted.length - 2; index >= 0; index--) adjusted[index] = Math.min(adjusted[index] ?? 1, adjusted[index + 1] ?? 1);
    return candidates
      .map(({ title, identifier, database, genes }, index) => ({ title, identifier, database, genes, pValue: adjusted[index] ?? 1 }))
      .filter((hit) => hit.pValue <= TermEnrichment.cutoff);
  }

  /** Terms by how many shown genes they include, most first. */
  byGeneCount(shown: ReadonlySet<number>): TermHit[] {
    return this.hits(shown)
      .map(({ title, identifier, database, genes }) => ({ title, identifier, database, genes }))
      .sort((a, b) => b.genes.length - a.genes.length || a.title.localeCompare(b.title));
  }
}
