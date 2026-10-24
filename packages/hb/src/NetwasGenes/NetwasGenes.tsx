import { NetwasResult, type NetwasFilter } from '@humanbase/data';
import { Button, NetwasGeneTable, SearchField, SegmentedControl } from '@humanbase/ui';
import { useEffect, useMemo, useState } from 'react';
import './NetwasGenes.css';

export interface NetwasGenesProps {
  file: string;
  names?: Readonly<Record<string, string>>;
  /** Link to the gene in Networks; `{gene}` is replaced by the symbol. null says the gene isn't in Humanbase; undefined leaves the cell empty while a lookup runs. */
  networkHref: string | ((symbol: string) => string | null | undefined);
  /** Link to a top-ranked gene in the genome browser, or undefined for none. */
  genomeHref?: ((symbol: string) => string | undefined) | undefined;
  defaultFilter?: NetwasFilter;
  note?: string;
  /** Called with the symbols on screen, so their names and links can be looked up a page at a time. */
  onShownChange?: (symbols: readonly string[]) => void;
}

const filters = [
  { value: 'all', label: 'All genes' },
  { value: 'candidates', label: 'New candidates' },
  { value: 'hits', label: 'GWAS hits' },
];

const filterNotes: Record<NetwasFilter, string> = {
  all: 'All genes in the result, by NetWAS score, highest first.',
  candidates: 'New candidates: not significant in the GWAS (label −1 or 0) but with a positive NetWAS score, so the network places them with the hits.',
  hits: 'GWAS hits: genes significant in the GWAS (label 1).',
};

const emptyTitles: Record<NetwasFilter, string> = {
  all: 'No genes in this result',
  candidates: 'No new candidates in this result',
  hits: 'No GWAS hits in this result',
};

const firstRows = 25;
// The proposal (#457) links only the top-ranked genes to the genome browser.
const genomeRanks = 10;
const step = 25;
const count = new Intl.NumberFormat('en-US');

export function NetwasGenes({ file, names = {}, networkHref, genomeHref, defaultFilter = 'all', note, onShownChange }: NetwasGenesProps) {
  const result = useMemo(() => NetwasResult.parse(file), [file]);
  const [filter, setFilter] = useState<NetwasFilter>(defaultFilter);
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(firstRows);

  const needle = query.trim().toLowerCase();
  const matching = result.filter(filter).filter((gene) => !needle || gene.symbol.toLowerCase().includes(needle) || names[gene.symbol]?.toLowerCase().includes(needle));
  const shown = matching.slice(0, visible);
  const hrefOf = (symbol: string) => (typeof networkHref === 'string' ? networkHref.replace('{gene}', encodeURIComponent(symbol)) : networkHref(symbol));
  const rows = shown.map((gene) => ({ ...gene, name: names[gene.symbol], gwas: NetwasResult.labelText(gene.label), href: hrefOf(gene.symbol), genomeHref: gene.rank <= genomeRanks ? genomeHref?.(gene.symbol) : undefined }));
  const more = Math.min(step, matching.length - visible);
  const empty = needle ? { title: `No genes match “${query.trim()}”`, text: 'Check the symbol, or clear the search.' } : { title: emptyTitles[filter] };
  const shownKey = shown.map((gene) => gene.symbol).join(' ');

  useEffect(() => {
    onShownChange?.(shownKey ? shownKey.split(' ') : []);
  }, [shownKey, onShownChange]);

  return (
    <div className="netwas-genes">
      <div className="netwas-genes-controls">
        <SegmentedControl
          label="Show"
          hideLabel
          size="small"
          segments={filters}
          value={filter}
          onChange={(value) => {
            setFilter(value as NetwasFilter);
            setVisible(firstRows);
          }}
        />
        <SearchField
          label="Find a gene"
          placeholder="Find a gene"
          size="medium"
          value={query}
          onChange={(event) => {
            setQuery(event.target.value);
            setVisible(firstRows);
          }}
          onClear={() => setQuery('')}
        />
      </div>
      <p className="netwas-genes-note" aria-live="polite">
        {filterNotes[filter]}
      </p>
      <NetwasGeneTable caption="Genes ranked by NetWAS score" rows={rows} empty={empty} />
      {more > 0 && (
        <Button variant="ghost" size="small" icon="chevron-down" className="netwas-genes-more" onClick={() => setVisible(visible + step)}>
          {`Show ${more} more ${more === 1 ? 'gene' : 'genes'}`}
        </Button>
      )}
      {matching.length > firstRows && (
        <p className="netwas-genes-note" role="status">
          Showing {count.format(shown.length)} of {count.format(matching.length)} genes
        </p>
      )}
      {note && <p className="netwas-genes-note">{note}</p>}
    </div>
  );
}
