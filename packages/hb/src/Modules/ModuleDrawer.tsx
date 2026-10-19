import { NetworkQuery, termDatabaseNames, type DataVersion, type GeneHit, type Module, type ModuleResult } from '@humanbase/data';
import { Button, Cell, Drawer, HeaderCell, saveFile, SegmentedControl, Table, ValueFormat } from '@humanbase/ui';
import { useState } from 'react';

export interface ModuleDrawerProps {
  result: ModuleResult;
  module: Module;
  database: string;
  genes: ReadonlyMap<number, GeneHit> | undefined;
  /** The tissue network the result used, for Open in Networks. */
  integration: string;
  version: DataVersion;
  onClose: () => void;
}

const format = new ValueFormat();
const namedGenes = 4;

export function ModuleDrawer({ result, module, database, genes, integration, version, onClose }: ModuleDrawerProps) {
  const [part, setPart] = useState('terms');
  const terms = result.terms(module.id, database);
  const symbolOf = (entrez: number) => genes?.get(entrez)?.symbol ?? String(entrez);
  const members = module.genes.map((entrez) => ({ entrez, symbol: symbolOf(entrez), name: genes?.get(entrez)?.name ?? '' })).sort((a, b) => a.symbol.localeCompare(b.symbol));
  const databaseName = termDatabaseNames[database] ?? database;
  const title = terms[0] ? `${module.label}, ${terms[0].title}` : module.label;
  const termsText = terms.length === 1 ? '1 enriched term' : `${terms.length} enriched terms`;

  const download = () => {
    const lines = ['module\tsymbol\tentrez\tname', ...members.map((gene) => `${module.label}\t${gene.symbol}\t${gene.entrez}\t${gene.name}`)];
    saveFile(lines.join('\n'), `${module.label}_genes.tsv`, 'text/tab-separated-values');
  };
  const networks = new NetworkQuery(module.genes, integration, version);

  return (
    <Drawer
      open
      title={title}
      subtitle={`${module.genes.length} genes, ${termsText} in ${databaseName}`}
      onClose={onClose}
      footer={
        <>
          <a className="button button-primary" href={networks.href}>
            Open {module.label} genes in Networks
          </a>
          <Button variant="ghost" onClick={download}>
            Download {module.label}
          </Button>
        </>
      }
    >
      <SegmentedControl
        label={`${module.label} details`}
        hideLabel
        size="small"
        segments={[
          { value: 'terms', label: 'Terms' },
          { value: 'genes', label: 'Genes' },
        ]}
        value={part}
        onChange={setPart}
      />
      {part === 'terms' ? (
        terms.length === 0 ? (
          <p className="module-muted">{module.label} has no enriched terms in {databaseName}.</p>
        ) : (
          <Table className="module-drawer-table" caption={`Enriched terms in ${module.label}`} density="compact" columnWidths={['auto', '136px', '96px']}>
            <thead>
              <tr>
                <HeaderCell>Enriched term</HeaderCell>
                <HeaderCell>Genes</HeaderCell>
                <HeaderCell align="end" sort="ascending">
                  q-value
                </HeaderCell>
              </tr>
            </thead>
            <tbody>
              {terms.map((term) => {
                const q = format.pValue(term.qValue);
                const named = term.genes.slice(0, namedGenes).map(symbolOf).join(', ');
                return (
                  <tr key={term.id}>
                    <Cell rowHeader>{term.title}</Cell>
                    <Cell>
                      <span className="module-muted">{term.genes.length > namedGenes ? `${named} and more` : named}</span>
                    </Cell>
                    <Cell type="number">
                      <span aria-label={q.spoken}>{q.text}</span>
                    </Cell>
                  </tr>
                );
              })}
            </tbody>
          </Table>
        )
      ) : (
        <Table caption={`Genes in ${module.label}`} density="compact" columnWidths={['auto']}>
          <thead>
            <tr>
              <HeaderCell>Gene</HeaderCell>
            </tr>
          </thead>
          <tbody>
            {members.map((gene) => (
              <tr key={gene.entrez}>
                <Cell type="gene" rowHeader>
                  <strong>{gene.symbol}</strong>
                  <span className="module-muted">{gene.name}</span>
                </Cell>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </Drawer>
  );
}
