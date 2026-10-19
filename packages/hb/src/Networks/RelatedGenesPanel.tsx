import type { NetworkGene } from '@humanbase/data';
import { Cell, HeaderCell, IconButton, saveFile, ScoreCell, SearchField, Table, TableMessage, TableSkeleton } from '@humanbase/ui';
import { useState } from 'react';

export interface RelatedGenesPanelProps {
  /** Undefined while the network loads. */
  genes: readonly NetworkGene[] | undefined;
  caption: string;
  fileName: string;
  selected: number | undefined;
  onSelectGene: (entrez: number) => void;
  onAddGene: (gene: NetworkGene) => void;
}

const columns = 3;

export function RelatedGenesPanel({ genes, caption, fileName, selected, onSelectGene, onAddGene }: RelatedGenesPanelProps) {
  const [filter, setFilter] = useState('');
  const term = filter.trim().toLowerCase();
  const rows = genes?.filter((gene) => !term || gene.symbol.toLowerCase().includes(term) || gene.name.toLowerCase().includes(term));

  const download = () => {
    if (!genes) return;
    const lines = ['symbol\tentrez\tname\tscore', ...genes.map((gene) => `${gene.symbol}\t${gene.entrez}\t${gene.name}\t${gene.score.toFixed(3)}`)];
    saveFile(lines.join('\n'), `${fileName}.tsv`, 'text/tab-separated-values');
  };

  return (
    <>
      <div className="companion-search">
        <SearchField label="Filter genes" placeholder="Filter genes" size="medium" value={filter} onChange={(event) => setFilter(event.target.value)} onClear={() => setFilter('')} disabled={!genes} />
        <IconButton label="Download genes" icon="download" onClick={download} disabled={!genes} />
      </div>
      <Table className="related-genes-table" caption={caption} density="compact" columnWidths={['auto', '112px', '52px']} busy={!genes}>
        <thead>
          <tr>
            <HeaderCell>Gene</HeaderCell>
            <HeaderCell align="end" sort="descending">
              Score
            </HeaderCell>
            <HeaderCell>
              <span className="visually-hidden">Add to the query</span>
            </HeaderCell>
          </tr>
        </thead>
        <tbody>
          {!rows ? (
            <TableSkeleton columns={columns} rows={8} />
          ) : rows.length === 0 ? (
            <TableMessage columns={columns} title={`No genes match “${filter.trim()}”`} text="Check the symbol, or clear the filter." />
          ) : (
            rows.map((gene) => (
              <tr key={gene.entrez} data-selected={selected === gene.entrez || undefined}>
                <Cell rowHeader type="gene">
                  <button type="button" className="result-gene result-gene-button" onClick={() => onSelectGene(gene.entrez)}>
                    <strong>{gene.symbol}</strong>
                    <span>{gene.name}</span>
                  </button>
                </Cell>
                <ScoreCell value={gene.score} />
                <Cell>
                  <IconButton label={`Add ${gene.symbol} to the query`} icon="plus" onClick={() => onAddGene(gene)} />
                </Cell>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      <p className="result-note">The score is the average weight of a gene’s connections to the query genes. The table lists the same genes shown in the graph and scrolls inside its panel.</p>
    </>
  );
}
