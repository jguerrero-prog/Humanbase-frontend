import type { Module } from '@humanbase/data';
import { Button, Cell, HeaderCell, SearchField, Table, TableMessage } from '@humanbase/ui';
import { useState } from 'react';

export interface ModuleGene {
  entrez: number;
  symbol: string;
  name: string;
}

export interface ModuleGeneListProps {
  module: Module;
  /** The module's genes, alphabetical. */
  genes: readonly ModuleGene[];
  onSelectGene: (entrez: number) => void;
  onHoverGene: (entrez: number | undefined) => void;
}

const firstRows = 8;

/** A module's genes, filterable; hovering a row rings the gene in the graph and choosing it opens the gene. */
export function ModuleGeneList({ module, genes, onSelectGene, onHoverGene }: ModuleGeneListProps) {
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const term = filter.trim().toLowerCase();
  const rows = genes.filter((gene) => !term || gene.symbol.toLowerCase().includes(term) || gene.name.toLowerCase().includes(term));
  const shown = showAll ? rows : rows.slice(0, firstRows);

  return (
    <>
      <SearchField label={`Filter ${module.label} genes`} placeholder={`Filter ${module.label} genes`} size="medium" value={filter} onChange={(event) => setFilter(event.target.value)} onClear={() => setFilter('')} />
      <Table className="module-gene-table" caption={`Genes in ${module.label}`} density="compact" columnWidths={['106px', 'auto']}>
        <thead>
          <tr>
            <HeaderCell sort="ascending">Gene</HeaderCell>
            <HeaderCell>Description</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <TableMessage columns={2} title={`No genes match “${filter.trim()}”`} text="Check the symbol, or clear the filter." />
          ) : (
            shown.map((gene) => (
              <tr key={gene.entrez} onPointerEnter={() => onHoverGene(gene.entrez)} onPointerLeave={() => onHoverGene(undefined)}>
                <Cell rowHeader>
                  <GeneButton gene={gene} onSelectGene={onSelectGene} onHoverGene={onHoverGene} />
                </Cell>
                <Cell>{gene.name}</Cell>
              </tr>
            ))
          )}
          {shown.length < rows.length && (
            <tr>
              <Cell colSpan={2}>
                <Button variant="ghost" size="small" onClick={() => setShowAll(true)}>
                  Show all {rows.length} genes
                </Button>
              </Cell>
            </tr>
          )}
        </tbody>
      </Table>
    </>
  );
}

/** A gene symbol that opens the gene, and rings it in the graph while focused. */
export function GeneButton({ gene, onSelectGene, onHoverGene }: { gene: ModuleGene } & Pick<ModuleGeneListProps, 'onSelectGene' | 'onHoverGene'>) {
  return (
    <button type="button" className="result-gene-button" onClick={() => onSelectGene(gene.entrez)} onFocus={() => onHoverGene(gene.entrez)} onBlur={() => onHoverGene(undefined)}>
      <strong>{gene.symbol}</strong>
    </button>
  );
}
