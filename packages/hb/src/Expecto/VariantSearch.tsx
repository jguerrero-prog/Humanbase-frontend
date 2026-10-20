import { ExpectoService, useVariantSearch, useVariantTotal } from '@humanbase/data';
import { Alert, Button, Cell, HeaderCell, SearchExamples, SearchField, Table, TableSkeleton, useDebounced, useLinkHref } from '@humanbase/ui';
import { useState } from 'react';
import './Expecto.css';

export interface VariantSearchProps {
  /** What was searched, kept in the page URL. */
  query: string;
  onQueryChange: (query: string) => void;
  /** A gene's ExPecto page, where an rsID row's gene links to. */
  geneHref: (entrez: number) => string;
}

const counts = new Intl.NumberFormat('en-US');
const firstRows = 10;
const examples = ['IRGM', 'rs531708574', 'chr1:877047'];

/** ExPecto's SNP rsID tab: the variants with the strongest predicted effects, found by gene, rsID or position. */
export function VariantSearch({ query, onQueryChange, geneHref }: VariantSearchProps) {
  const linkHref = useLinkHref();
  const [text, setText] = useState(query);
  const [showAll, setShowAll] = useState(false);
  const settled = useDebounced(text, 400);
  const parsed = ExpectoService.parse(settled);
  const total = useVariantTotal();
  const found = useVariantSearch(parsed);
  const rows = found.data ?? [];
  const shown = showAll ? rows : rows.slice(0, firstRows);

  const search = (next: string) => {
    setText(next);
    setShowAll(false);
    onQueryChange(next.trim());
  };

  return (
    <div className="variant-search">
      <p className="variant-search-lead">
        Variants with a significant expression effect: the {total.data ? counts.format(total.data) : '…'} with the highest predicted impact
      </p>
      <SearchField label="Search by gene, rsID or position" placeholder="Gene, rsID or position, such as chr1:877047" value={text} onChange={(event) => search(event.target.value)} onClear={() => search('')} loading={found.isFetching} />
      <SearchExamples examples={examples.map((example) => ({ label: example, onSelect: () => search(example) }))} />
      {settled.trim() && !parsed ? (
        <Alert tone="info" title="Search for one gene, rsID or position">
          Type a gene symbol such as IRGM, an rsID such as rs531708574, or a position such as chr1:877047.
        </Alert>
      ) : found.isError ? (
        <Alert tone="error" title="The variants couldn’t load" action={{ label: 'Try again', onSelect: () => void found.refetch() }}>
          Humanbase didn’t answer. Trying again is safe.
        </Alert>
      ) : parsed && found.data?.length === 0 ? (
        <Alert tone="info" title={`No variants for ${settled.trim()}`}>
          {parsed.kind === 'gene' ? 'This gene has no variant among those with the highest predicted impact, or the symbol is misspelled.' : 'No variant among those with the highest predicted impact matches. Check the rsID or position.'}
        </Alert>
      ) : (
        parsed && (
          <>
            <h2 className="variant-search-count" aria-live="polite">
              {found.data ? `${counts.format(rows.length)} ${rows.length === 1 ? 'variant' : 'variants'} for ${settled.trim()}` : `Searching ${settled.trim()}…`}
            </h2>
            <Table caption={`Variants for ${settled.trim()}`} density="compact" busy={!found.data}>
              <thead>
                <tr>
                  <HeaderCell>Position</HeaderCell>
                  <HeaderCell>rsID</HeaderCell>
                  <HeaderCell>Gene</HeaderCell>
                  <HeaderCell>Change</HeaderCell>
                </tr>
              </thead>
              {found.data ? (
                <tbody>
                  {shown.map((variant) => (
                    <tr key={`${variant.rsid}-${variant.change}`}>
                      <Cell type="id" rowHeader>
                        {variant.chromosome}:{counts.format(variant.position)}
                      </Cell>
                      <Cell type="id">{variant.rsid}</Cell>
                      <Cell type="gene">{variant.gene ? <a href={linkHref(geneHref(variant.gene.entrez))}>{variant.gene.symbol}</a> : 'None'}</Cell>
                      <Cell type="id">{variant.change}</Cell>
                    </tr>
                  ))}
                </tbody>
              ) : (
                <tbody>
                  <TableSkeleton columns={4} />
                </tbody>
              )}
            </Table>
            {!showAll && rows.length > firstRows && (
              <Button variant="ghost" size="small" onClick={() => setShowAll(true)}>
                Show {rows.length - firstRows} more
              </Button>
            )}
          </>
        )
      )}
    </div>
  );
}
