import type { GeneFunction } from '@humanbase/data';

export interface QueryGene {
  entrez: number;
  symbol: string;
}

export interface ExpressionRow {
  identifier: string;
  tissue: string;
  /** Organ systems the tissue belongs to. */
  systems: readonly string[];
  /** One confidence per query gene, null where the gene has none. */
  values: (number | null)[];
  average: number;
}

/** One row per tissue across the query genes, highest average confidence first. */
export function expressionRows(perGene: readonly (readonly GeneFunction[] | undefined)[]): ExpressionRow[] {
  const rows = new Map<string, ExpressionRow>();
  perGene.forEach((functions, column) => {
    for (const row of functions ?? []) {
      const entry = rows.get(row.identifier) ?? { identifier: row.identifier, tissue: row.name, systems: row.groups, values: perGene.map(() => null), average: 0 };
      entry.values[column] = row.confidence;
      rows.set(row.identifier, entry);
    }
  });
  // A gene with no prediction for a tissue counts as 0, so the average favors tissues every gene shares.
  for (const row of rows.values()) row.average = row.values.reduce<number>((sum, value) => sum + (value ?? 0), 0) / Math.max(1, row.values.length);
  return [...rows.values()].sort((a, b) => b.average - a.average || a.tissue.localeCompare(b.tissue));
}

export function expressionTsv(genes: readonly QueryGene[], rows: readonly ExpressionRow[]): string {
  const header = ['tissue', 'identifier', ...genes.map((gene) => `${gene.symbol}_confidence`), 'average_confidence'].join('\t');
  const lines = rows.map((row) => [row.tissue, row.identifier, ...row.values.map((value) => (value === null ? '' : value.toFixed(3))), row.average.toFixed(3)].join('\t'));
  return [header, ...lines].join('\n');
}
