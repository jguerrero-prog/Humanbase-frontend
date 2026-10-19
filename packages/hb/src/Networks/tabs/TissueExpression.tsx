import { Alert, Button, Cell, Checkbox, HeaderCell, Heatmap, ScoreCell, SearchField, Table, TableMessage, TableSkeleton } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import type { ExpressionRow, QueryGene } from './expressionRows';
import { tissueConfidenceScale } from './scales';

export interface TissueExpressionProps {
  genes: readonly QueryGene[];
  /** Undefined while any gene's predictions load. */
  rows: readonly ExpressionRow[] | undefined;
  failed: boolean;
  onRetry: () => void;
  queryNames: string;
}

export function TissueExpression({ genes, rows, failed, onRetry, queryNames }: TissueExpressionProps) {
  const systems = useMemo(() => [...new Set(rows?.flatMap((row) => row.systems))].sort((a, b) => a.localeCompare(b)), [rows]);
  const [unchecked, setUnchecked] = useState<ReadonlySet<string>>(new Set());
  const [filter, setFilter] = useState('');
  const term = filter.trim().toLowerCase();
  const shown = rows?.filter((row) => (row.systems.length === 0 || row.systems.some((system) => !unchecked.has(system))) && (!term || row.tissue.toLowerCase().includes(term)));
  const title = `Where ${queryNames} ${genes.length === 1 ? 'is' : 'are'} expressed`;
  const toggle = (system: string) =>
    setUnchecked((current) => {
      const next = new Set(current);
      if (!next.delete(system)) next.add(system);
      return next;
    });
  const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

  return (
    <div className="tissue-expression">
      <fieldset className="tissue-systems" disabled={!rows}>
        <legend>Tissue system</legend>
        <p>Show tissues from the systems you check.</p>
        {systems.map((system) => (
          <Checkbox key={system} label={capitalize(system)} checked={!unchecked.has(system)} onChange={() => toggle(system)} />
        ))}
        {systems.length > 0 && (
          <Button variant="ghost" size="small" onClick={() => setUnchecked(unchecked.size === systems.length ? new Set() : new Set(systems))}>
            {unchecked.size === systems.length ? 'Check all' : 'Clear all'}
          </Button>
        )}
      </fieldset>
      <div className="tissue-expression-results">
        <h2 className="tab-heading">{title}</h2>
        <p className="result-note">Experimentally validated and computationally predicted expression in tissues and cell types. The table scrolls inside its panel.</p>
        <SearchField label="Filter tissues" placeholder="Filter tissues" size="medium" value={filter} onChange={(event) => setFilter(event.target.value)} onClear={() => setFilter('')} disabled={!rows} />
        {failed ? (
          <Alert tone="error" title="Tissue expression couldn’t load" action={{ label: 'Try again', onSelect: onRetry }}>
            The network tabs are unaffected.
          </Alert>
        ) : genes.length > 1 && shown && shown.length > 0 ? (
          <>
            <Heatmap
              title={title}
              summary={`${shown.length} tissues and cell types, highest average confidence first.`}
              scale={tissueConfidenceScale}
              columns={[...genes.map((gene) => ({ label: gene.symbol })), { label: 'Average' }]}
              rows={shown.map((row) => ({ label: row.tissue, values: [...row.values, row.average] }))}
              rowHeader="Tissue or cell type"
              columnHeader="Gene"
            />
            <p className="result-note">Each square shows how confident the prediction is that a gene is expressed in that tissue, on a five-step scale. Hover over or focus a square to see its value.</p>
          </>
        ) : (
          <Table caption={title} density="compact" columnWidths={['auto', '220px']} busy={!rows}>
            <thead>
              <tr>
                <HeaderCell>Tissue or cell type</HeaderCell>
                <HeaderCell align="end" sort="descending">{`${genes[0]?.symbol ?? 'Gene'} confidence`}</HeaderCell>
              </tr>
            </thead>
            <tbody>
              {!shown ? (
                <TableSkeleton columns={2} rows={8} />
              ) : shown.length === 0 ? (
                <TableMessage columns={2} title={term ? `No tissues match “${filter.trim()}”` : 'No tissues in the checked systems'} text={term ? 'Check the spelling, or clear the filter.' : 'Check more tissue systems.'} />
              ) : (
                shown.map((row) => (
                  <tr key={row.identifier}>
                    <Cell rowHeader>{row.tissue}</Cell>
                    <ScoreCell value={row.values[0]} />
                  </tr>
                ))
              )}
            </tbody>
          </Table>
        )}
      </div>
    </div>
  );
}
