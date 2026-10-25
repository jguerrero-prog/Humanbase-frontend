import type { TermHit } from '@humanbase/data';

/** The Processes or Tissues panel as a TSV; processes carry the adjusted p-value the table shows, unrounded. */
export function termsTsv(kind: 'processes' | 'tissues', hits: readonly TermHit[]): string {
  const processes = kind === 'processes';
  const header = ['term', 'identifier', 'database', 'genes', ...(processes ? ['adjusted_p_value_benjamini_hochberg'] : [])].join('\t');
  const lines = hits.map((hit) => [hit.title, hit.identifier, hit.database, hit.genes.length, ...(processes ? [hit.pValue === undefined ? '' : hit.pValue.toExponential()] : [])].join('\t'));
  return [header, ...lines].join('\n');
}
