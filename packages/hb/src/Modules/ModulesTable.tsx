import type { Module, ModuleResult } from '@humanbase/data';
import { Button, Cell, HeaderCell, Table, TableMessage, ValueFormat } from '@humanbase/ui';
import { useState } from 'react';

export interface ModulesTableProps {
  result: ModuleResult;
  modules: readonly Module[];
  database: string;
  colors: ReadonlyMap<number, string>;
  selected: number | undefined;
  onSelectModule: (id: number) => void;
}

const format = new ValueFormat();
const firstRows = 5;
const topTerms = 3;

export function ModuleSwatch({ color }: { color: string | undefined }) {
  return <span className="module-swatch" style={{ background: `var(${color ?? '--viz-cat-other'})` }} aria-hidden="true" />;
}

/** One row per module: its strongest terms, their q-values and how many genes and terms it has. */
export function ModulesTable({ result, modules, database, colors, selected, onSelectModule }: ModulesTableProps) {
  const [showAll, setShowAll] = useState(false);
  const rows = showAll ? modules : modules.slice(0, firstRows);
  const hidden = modules.length - rows.length;

  return (
    <>
      <Table className="modules-table" caption="Modules and their top terms" density="compact" columnWidths={['88px', 'auto', '96px', '104px']} minWidth="400px">
        <thead>
          <tr>
            <HeaderCell>Module</HeaderCell>
            <HeaderCell>Top terms</HeaderCell>
            <HeaderCell align="end">q-value</HeaderCell>
            <HeaderCell align="end">Genes</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <TableMessage columns={4} title="No modules match these settings" text="Lower the minimum module size, or show modules with no enriched terms." />
          ) : (
            rows.map((module) => {
              const terms = result.terms(module.id, database);
              return (
                <tr key={module.id} data-selected={selected === module.id || undefined}>
                  <Cell rowHeader>
                    <button type="button" className="result-gene-button module-button" onClick={() => onSelectModule(module.id)}>
                      <ModuleSwatch color={colors.get(module.id)} />
                      {module.label}
                    </button>
                  </Cell>
                  <Cell>
                    {terms.length === 0 ? (
                      <span className="module-muted">No enriched terms</span>
                    ) : (
                      <ul className="module-terms">
                        {terms.slice(0, topTerms).map((term) => (
                          <li key={term.id}>{term.title}</li>
                        ))}
                      </ul>
                    )}
                  </Cell>
                  <Cell type="number">
                    <ul className="module-terms">
                      {terms.slice(0, topTerms).map((term) => {
                        const q = format.pValue(term.qValue);
                        return (
                          <li key={term.id} aria-label={q.spoken}>
                            {q.text}
                          </li>
                        );
                      })}
                    </ul>
                  </Cell>
                  <Cell type="number">
                    <strong>{module.genes.length}</strong>
                    <span className="module-muted">{terms.length === 1 ? '1 term' : `${terms.length} terms`}</span>
                  </Cell>
                </tr>
              );
            })
          )}
        </tbody>
      </Table>
      {hidden > 0 && (
        <Button variant="ghost" size="small" onClick={() => setShowAll(true)}>
          Show {hidden} more {hidden === 1 ? 'module' : 'modules'}
        </Button>
      )}
    </>
  );
}
