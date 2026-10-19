import type { GeneHit, Module } from '@humanbase/data';
import { Button, Cell, HeaderCell, SearchField, Table, TableMessage, TableSkeleton } from '@humanbase/ui';
import { useState } from 'react';
import { ModuleSwatch } from './ModulesTable';

export interface ModuleGenesTableProps {
  modules: readonly Module[];
  /** Undefined while gene names load. */
  genes: ReadonlyMap<number, GeneHit> | undefined;
  colors: ReadonlyMap<number, string>;
  onSelectModule: (id: number) => void;
}

const firstRows = 8;
const moreRows = 25;

/** Every gene in the shown modules, by module and then symbol. */
export function ModuleGenesTable({ modules, genes, colors, onSelectModule }: ModuleGenesTableProps) {
  const [filter, setFilter] = useState('');
  const [shown, setShown] = useState(firstRows);
  const term = filter.trim().toLowerCase();
  const all = genes
    ? modules.flatMap((module) =>
        module.genes
          .flatMap((entrez) => genes.get(entrez) ?? [])
          .sort((a, b) => a.symbol.localeCompare(b.symbol))
          .map((gene) => ({ module, gene })),
      )
    : undefined;
  const rows = all?.filter(({ gene }) => !term || gene.symbol.toLowerCase().includes(term) || gene.name.toLowerCase().includes(term));
  const hidden = rows ? rows.length - Math.min(shown, rows.length) : 0;

  return (
    <>
      <div className="companion-search">
        <SearchField label="Filter genes" placeholder="Filter genes" size="medium" value={filter} onChange={(event) => setFilter(event.target.value)} onClear={() => setFilter('')} disabled={!genes} />
      </div>
      <Table className="module-genes-table" caption="Genes in each module" density="compact" columnWidths={['88px', 'auto']} busy={!genes}>
        <thead>
          <tr>
            <HeaderCell>Module</HeaderCell>
            <HeaderCell>Gene</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {!rows ? (
            <TableSkeleton columns={2} rows={firstRows} />
          ) : rows.length === 0 ? (
            <TableMessage columns={2} title={`No genes match “${filter.trim()}”`} text="Check the symbol, or clear the filter." />
          ) : (
            rows.slice(0, shown).map(({ module, gene }) => (
              <tr key={gene.entrez}>
                <Cell>
                  <button type="button" className="result-gene-button module-button" onClick={() => onSelectModule(module.id)}>
                    <ModuleSwatch color={colors.get(module.id)} />
                    {module.label}
                  </button>
                </Cell>
                <Cell type="gene" rowHeader>
                  <strong>{gene.symbol}</strong>
                  <span className="module-muted">{gene.name}</span>
                </Cell>
              </tr>
            ))
          )}
        </tbody>
      </Table>
      {hidden > 0 && (
        <Button variant="ghost" size="small" onClick={() => setShown(shown + moreRows)}>
          Show {Math.min(hidden, moreRows)} more {hidden === 1 ? 'gene' : 'genes'}
        </Button>
      )}
    </>
  );
}
