import type { NetworkEdge } from '@humanbase/data';
import { Button, Cell, HeaderCell, ScoreCell, Table, TableMessage } from '@humanbase/ui';
import { useMemo, useState } from 'react';

export interface ConnectionsTableProps {
  edges: readonly NetworkEdge[];
  caption: string;
  selected: { source: number; target: number } | undefined;
  onSelectConnection: (source: number, target: number) => void;
}

const firstRows = 8;
const step = 25;

// The graph's connections as a table, strongest first: the accessible equivalent of the graph.
export function ConnectionsTable({ edges, caption, selected, onSelectConnection }: ConnectionsTableProps) {
  const [visible, setVisible] = useState(firstRows);
  const rows = useMemo(() => [...edges].sort((a, b) => b.weight - a.weight || a.source.symbol.localeCompare(b.source.symbol)), [edges]);
  const more = Math.min(step, rows.length - visible);
  const isSelected = (edge: NetworkEdge) =>
    selected !== undefined && ((edge.source.entrez === selected.source && edge.target.entrez === selected.target) || (edge.source.entrez === selected.target && edge.target.entrez === selected.source));

  return (
    <>
      <Table caption={caption} density="compact" columnWidths={['auto', 'auto', '200px']}>
        <thead>
          <tr>
            <HeaderCell>Gene</HeaderCell>
            <HeaderCell>Connected to</HeaderCell>
            <HeaderCell align="end" sort="descending">
              Weight
            </HeaderCell>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <TableMessage columns={3} title="No connections at this confidence" text="Lower the minimum confidence or show more genes." />
          ) : (
            rows.slice(0, visible).map((edge) => (
              <tr key={`${edge.source.entrez}-${edge.target.entrez}`} data-selected={isSelected(edge) || undefined}>
                <Cell rowHeader type="gene">
                  <button type="button" className="result-gene-button" aria-label={`${edge.source.symbol} and ${edge.target.symbol}, connection details`} onClick={() => onSelectConnection(edge.source.entrez, edge.target.entrez)}>
                    {edge.source.symbol}
                  </button>
                </Cell>
                <Cell type="gene">{edge.target.symbol}</Cell>
                <ScoreCell value={edge.weight} />
              </tr>
            ))
          )}
        </tbody>
      </Table>
      {more > 0 && (
        <Button variant="ghost" size="small" icon="chevron-down" onClick={() => setVisible(visible + step)}>
          {`Show ${more} more ${more === 1 ? 'connection' : 'connections'}`}
        </Button>
      )}
      {rows.length > 0 && (
        <p className="result-note" role="status">
          Showing {Math.min(visible, rows.length)} of {rows.length} connections
        </p>
      )}
    </>
  );
}
