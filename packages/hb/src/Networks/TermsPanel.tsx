import type { TermHit } from '@humanbase/data';
import { Button, Cell, HeaderCell, IconButton, saveFile, SearchField, Table, TableMessage, TableSkeleton, ValueFormat } from '@humanbase/ui';
import { useState } from 'react';

export type TermsPanelKind = 'processes' | 'tissues';

export interface TermsPanelProps {
  kind: TermsPanelKind;
  /** Undefined while the terms load. */
  hits: readonly TermHit[] | undefined;
  failed: boolean;
  onRetry: () => void;
  caption: string;
  fileName: string;
}

const format = new ValueFormat();
const copy = {
  processes: {
    noun: 'processes',
    term: 'Process',
    value: 'p-value',
    note: 'Biological processes over-represented among the genes in the graph, most significant first. The table scrolls inside its panel.',
  },
  tissues: {
    noun: 'tissues',
    term: 'Tissue or cell type',
    value: 'Genes',
    note: 'Tissues and cell types the graph’s genes are annotated to, with how many of those genes each one has. The table scrolls inside its panel.',
  },
};
const genesLabel = (count: number) => `${count} ${count === 1 ? 'gene' : 'genes'}`;

export function TermsPanel({ kind, hits, failed, onRetry, caption, fileName }: TermsPanelProps) {
  const [filter, setFilter] = useState('');
  const text = copy[kind];
  const term = filter.trim().toLowerCase();
  const rows = hits?.filter((hit) => !term || hit.title.toLowerCase().includes(term));
  const filterLabel = `Filter ${text.noun}`;

  const download = () => {
    if (!hits) return;
    const header = kind === 'processes' ? 'term\tidentifier\tgenes\tp_value' : 'term\tidentifier\tgenes';
    const lines = hits.map((hit) => [hit.title, hit.identifier, hit.genes.length, ...(kind === 'processes' ? [hit.pValue?.toExponential(2) ?? ''] : [])].join('\t'));
    saveFile([header, ...lines].join('\n'), `${fileName}_${kind}.tsv`, 'text/tab-separated-values');
  };

  return (
    <>
      <div className="companion-search">
        <SearchField label={filterLabel} placeholder={filterLabel} size="medium" value={filter} onChange={(event) => setFilter(event.target.value)} onClear={() => setFilter('')} disabled={!hits} />
        <IconButton label={`Download ${text.noun}`} icon="download" onClick={download} disabled={!hits} />
      </div>
      <Table className="related-genes-table" caption={caption} density="compact" columnWidths={['auto', '112px']} busy={!hits && !failed}>
        <thead>
          <tr>
            <HeaderCell>{text.term}</HeaderCell>
            <HeaderCell align="end" sort={kind === 'processes' ? 'ascending' : 'descending'}>
              {text.value}
            </HeaderCell>
          </tr>
        </thead>
        <tbody>
          {failed ? (
            <TableMessage columns={2} title={`The ${text.noun} couldn’t load`} text="The graph and genes are unaffected." action={<Button variant="ghost" size="small" onClick={onRetry}>Try again</Button>} />
          ) : !rows ? (
            <TableSkeleton columns={2} rows={8} />
          ) : rows.length === 0 ? (
            <TableMessage columns={2} title={term ? `No ${text.noun} match “${filter.trim()}”` : `No ${text.noun} for these genes`} text={term ? 'Check the spelling, or clear the filter.' : 'Try showing more genes in the graph.'} />
          ) : (
            rows.map((hit) => (
              <tr key={hit.identifier}>
                <Cell rowHeader>
                  <span className="result-gene">
                    <strong>{hit.title}</strong>
                    <span>{kind === 'processes' ? `${hit.database}, ${genesLabel(hit.genes.length)}` : hit.database}</span>
                  </span>
                </Cell>
                <Cell type="number">{kind === 'processes' && hit.pValue !== undefined ? format.pValue(hit.pValue).text : hit.genes.length}</Cell>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <p className="result-note">{text.note}</p>
    </>
  );
}
