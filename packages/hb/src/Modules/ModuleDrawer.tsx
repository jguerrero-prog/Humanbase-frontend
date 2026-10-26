import { NetworkQuery, type DataVersion, type GeneHit, type Module, type ModuleResult } from '@humanbase/data';
import { Button, Drawer, saveFile, SegmentedControl, useLinkHref } from '@humanbase/ui';
import { useState } from 'react';
import { genomeBrowserLink } from '../content/genomeBrowser';
import { ViewInGenomeBrowser } from '../GenomeBrowser/ViewInGenomeBrowser';
import { GeneNeighborsTable } from './GeneNeighborsTable';
import { ModuleGeneList, type ModuleGene } from './ModuleGeneList';
import { ModuleTermsTable } from './ModuleTermsTable';

export interface ModuleDrawerProps {
  result: ModuleResult;
  module: Module;
  /** A gene of the module shown in the same drawer, one level deeper. */
  gene: number | undefined;
  database: string;
  genes: ReadonlyMap<number, GeneHit> | undefined;
  /** The tissue network the result used, for Open in Networks. */
  integration: string;
  version: DataVersion;
  onSelectGene: (entrez: number) => void;
  onHoverGene: (entrez: number | undefined) => void;
  onBack: () => void;
  onClose: () => void;
}

const termsWord = (count: number) => (count === 1 ? '1 enriched term' : `${count} enriched terms`);

export function ModuleDrawer({ result, module, gene, database, genes, integration, version, onSelectGene, onHoverGene, onBack, onClose }: ModuleDrawerProps) {
  const linkHref = useLinkHref();
  const [part, setPart] = useState('terms');
  const [genePart, setGenePart] = useState('terms');
  const geneOf = (entrez: number): ModuleGene => ({ entrez, symbol: genes?.get(entrez)?.symbol ?? result.symbol(entrez) ?? String(entrez), name: genes?.get(entrez)?.name ?? '' });
  const symbolOf = (entrez: number) => geneOf(entrez).symbol;
  const terms = result.terms(module.id, database);
  const databaseName = result.databaseName(database);
  const topTerm = terms[0]?.title;

  const footer = (label: string, entrez: readonly number[], download: () => void, opened = label) => (
    <>
      <a className="button button-primary" href={linkHref(new NetworkQuery(entrez, integration, version).href)}>
        Open {opened} in Networks
      </a>
      <Button variant="ghost" onClick={download}>
        Download {label}
      </Button>
    </>
  );
  const saveRows = (rows: readonly string[], name: string) => saveFile(rows.join('\n'), `${name}.tsv`, 'text/tab-separated-values');

  if (gene !== undefined) {
    const { symbol, name } = geneOf(gene);
    const genome = genomeBrowserLink.gene(symbol, 'modules');
    const geneTerms = result.termsOf(gene, database);
    const neighbors = result.neighbors(gene).map((neighbor) => ({ ...neighbor, gene: geneOf(neighbor.entrez) }));
    const download = () =>
      saveRows(
        [
          'gene\tmodule\tkind\tid\tname\tvalue',
          ...geneTerms.map((term) => `${symbol}\t${module.label}\tterm\t${term.id}\t${term.title}\t${term.qValue}`),
          ...neighbors.map((neighbor) => `${symbol}\t${module.label}\tneighbor\t${neighbor.entrez}\t${neighbor.gene.symbol}\t${neighbor.weight.toFixed(3)}`),
        ],
        `${symbol}_${module.label}`,
      );
    return (
      <Drawer
        open
        title={symbol}
        subtitle={[name, `in ${module.label}${topTerm ? ` ${topTerm}` : ''}`].filter(Boolean).join(', ')}
        back={{ label: `Back to ${module.label}`, onSelect: onBack }}
        onClose={onClose}
        headerLink={genome && <ViewInGenomeBrowser href={genome} />}
        footer={footer(symbol, [gene], download, symbol)}
      >
        <SegmentedControl
          label={`${symbol} details`}
          hideLabel
          size="small"
          segments={[
            { value: 'terms', label: 'Gene terms' },
            { value: 'neighbors', label: 'Gene neighbors' },
          ]}
          value={genePart}
          onChange={setGenePart}
        />
        {genePart === 'terms' ? (
          geneTerms.length === 0 ? (
            <p className="module-muted">
              {symbol} isn’t in any of {module.label}’s enriched terms in {databaseName}.
            </p>
          ) : (
            <ModuleTermsTable terms={geneTerms} caption={`Enriched terms of ${module.label} that include ${symbol}`} genesHeader={`Other ${module.label} genes`} symbolOf={symbolOf} without={gene} />
          )
        ) : neighbors.length === 0 ? (
          <p className="module-muted">{symbol} has no connections to other genes in this result.</p>
        ) : (
          <GeneNeighborsTable caption={`Genes connected to ${symbol}`} neighbors={neighbors} onSelectGene={onSelectGene} onHoverGene={onHoverGene} />
        )}
      </Drawer>
    );
  }

  const members = module.genes.map(geneOf).sort((a, b) => a.symbol.localeCompare(b.symbol));
  const download = () => saveRows(['module\tsymbol\tentrez\tname', ...members.map((member) => `${module.label}\t${member.symbol}\t${member.entrez}\t${member.name}`)], `${module.label}_genes`);

  return (
    <Drawer
      open
      title={topTerm ? `${module.label}, ${topTerm}` : module.label}
      subtitle={`${module.genes.length} genes, ${termsWord(terms.length)} in ${databaseName}`}
      onClose={onClose}
      footer={footer(module.label, module.genes, download, `${module.label} genes`)}
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
      {part === 'genes' ? (
        <ModuleGeneList key={module.id} module={module} genes={members} onSelectGene={onSelectGene} onHoverGene={onHoverGene} />
      ) : terms.length === 0 ? (
        <p className="module-muted">
          {module.label} has no enriched terms in {databaseName}.
        </p>
      ) : (
        <ModuleTermsTable terms={terms} caption={`Enriched terms in ${module.label}`} genesHeader="Genes" symbolOf={symbolOf} />
      )}
    </Drawer>
  );
}
