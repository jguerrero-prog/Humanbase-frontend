import { NetwasResult, type NetwasFilter } from '@humanbase/data';
import { NetwasGeneTable, SearchField, SegmentedControl } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import './NetwasGenes.css';

export interface NetwasGenesProps {
  file: string;
  names?: Readonly<Record<string, string>>;
  /** Link to the gene in Networks; `{gene}` is replaced by the symbol. */
  networkHref: string;
  defaultFilter?: NetwasFilter;
  note?: string;
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

export function NetwasGenes({ file, names = {}, networkHref, defaultFilter = 'all', note }: NetwasGenesProps) {
  const result = useMemo(() => NetwasResult.parse(file), [file]);
  const [filter, setFilter] = useState<NetwasFilter>(defaultFilter);
  const [query, setQuery] = useState('');

  const needle = query.trim().toLowerCase();
  const rows = result
    .filter(filter)
    .filter((gene) => !needle || gene.symbol.toLowerCase().includes(needle) || names[gene.symbol]?.toLowerCase().includes(needle))
    .map((gene) => ({ ...gene, name: names[gene.symbol], gwas: NetwasResult.labelText(gene.label), href: networkHref.replace('{gene}', encodeURIComponent(gene.symbol)) }));
  const empty = needle ? { title: `No genes match “${query.trim()}”`, text: 'Check the symbol, or clear the search.' } : { title: emptyTitles[filter] };

  return (
    <div className="netwas-genes">
      <div className="netwas-genes-controls">
        <SegmentedControl label="Show" hideLabel size="small" segments={filters} value={filter} onChange={(value) => setFilter(value as NetwasFilter)} />
        <SearchField label="Find a gene" placeholder="Find a gene" size="medium" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery('')} />
      </div>
      <p className="netwas-genes-note" aria-live="polite">
        {filterNotes[filter]}
      </p>
      <NetwasGeneTable caption="Genes ranked by NetWAS score" rows={rows} empty={empty} />
      {note && <p className="netwas-genes-note">{note}</p>}
    </div>
  );
}
