import { AsdVariant, type AsdVariantRow } from '@humanbase/data';
import { ActionMenu, Alert, Button, Cell, Checkbox, HeaderCell, Pagination, ResultHeader, SearchField, SegmentedControl, Select, Table, useLinkHref, type ContextLabelProps, type Crumb } from '@humanbase/ui';
import { useId, useState, type FormEvent, type ReactNode } from 'react';
import './AsdBrowser.css';

export type AsdView = 'browser' | 'table';

const views = [
  { value: 'browser', label: 'Genome browser' },
  { value: 'table', label: 'Table' },
];
const chromosomes = [{ value: 'all', label: 'All chromosomes' }, ...[...Array.from({ length: 22 }, (_, index) => String(index + 1)), 'X', 'Y'].map((name) => ({ value: `chr${name}`, label: `chr${name}` }))];
const counts = new Intl.NumberFormat('en-US');

function remembered(key: string): boolean {
  try {
    return key !== '' && window.localStorage.getItem(key) === 'dismissed';
  } catch {
    return false;
  }
}

function remember(key: string) {
  try {
    if (key) window.localStorage.setItem(key, 'dismissed');
  } catch {
    // Storage can be blocked; the notice simply shows again next time.
  }
}

export interface AsdHeaderProps {
  crumbs: readonly Crumb[];
  subtitle: string;
  context: readonly ContextLabelProps[];
  view: AsdView;
  onViewChange: (view: AsdView) => void;
  query: string;
  onQueryChange: (query: string) => void;
  /** Runs a search; without it, examples only fill the field. */
  onSearch?: ((query: string) => void) | undefined;
  searchError?: string | undefined;
  examples: readonly string[];
  notice: string;
  /** The browser storage key that remembers a dismissed notice; empty to always show it. */
  noticeKey?: string | undefined;
  /** Where Download data goes, such as the Downloads page. */
  downloadHref?: string | undefined;
}

/** The ASD Browser's header: title and context, the view switch, Download data, search and the data-use notice. */
export function AsdHeader({ crumbs, subtitle, context, view, onViewChange, query, onQueryChange, onSearch, searchError, examples, notice, noticeKey = 'humanbase:asd-data-use', downloadHref }: AsdHeaderProps) {
  const linkHref = useLinkHref();
  const errorId = useId();
  const [noticeOpen, setNoticeOpen] = useState(() => typeof window === 'undefined' || !remembered(noticeKey));
  const dismiss = () => {
    setNoticeOpen(false);
    remember(noticeKey);
  };
  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSearch?.(query);
  };
  const tryExample = (example: string) => {
    onQueryChange(example);
    onSearch?.(example);
  };

  return (
    <>
      <ResultHeader
        headingLevel={onSearch ? 1 : 3}
        crumbs={crumbs}
        title="ASD Browser"
        context={context}
        settingsLabel="View and download"
        settings={
          <>
            <SegmentedControl label="View" hideLabel size="small" segments={views} value={view} onChange={(value) => onViewChange(value as AsdView)} />
            {downloadHref ? (
              <a className="button button-secondary" href={linkHref(downloadHref)}>
                Download data
              </a>
            ) : (
              <Button variant="secondary" icon="download">
                Download data
              </Button>
            )}
          </>
        }
      />
      <p className="asd-browser-subtitle">{subtitle}</p>
      <search className="asd-browser-search">
        <form onSubmit={submit}>
          <SearchField
            label="Find a gene, region or position"
            placeholder="Find a gene, region or position, such as CHD8 or chr1:2,337,101"
            size="large"
            value={query}
            onChange={(event) => onQueryChange(event.target.value)}
            onClear={() => onQueryChange('')}
            aria-invalid={searchError ? true : undefined}
            aria-describedby={searchError ? errorId : undefined}
          />
        </form>
        {searchError && (
          <p id={errorId} className="asd-browser-error" role="alert">
            {searchError}
          </p>
        )}
        <p className="asd-browser-examples">
          <span>Try</span>
          {examples.map((example) => (
            <Button key={example} variant="ghost" size="small" onClick={() => tryExample(example)}>
              {example}
            </Button>
          ))}
        </p>
      </search>
      {noticeOpen && (
        <Alert tone="info" title="Data use" dismissible onDismiss={dismiss}>
          {notice}
        </Alert>
      )}
    </>
  );
}

export interface AsdVariantTableProps {
  variants: readonly AsdVariantRow[];
  /** The number of rows the filters match. */
  total: number;
  page: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: ((size: number) => void) | undefined;
  chromosome: string;
  onChromosomeChange: (chromosome: string) => void;
  rangeOnly: boolean;
  onRangeOnlyChange: (rangeOnly: boolean) => void;
  /** The other columns the data has, by their names in the data, offered under Columns. */
  columns: readonly string[];
  /** Opens the browser at the row's variant; without it, positions are plain text. */
  onSelect?: ((row: AsdVariantRow) => void) | undefined;
  loading?: boolean | undefined;
  /** Shown in place of the rows, such as when nothing matches. */
  notice?: ReactNode;
}

function Score({ value }: { value: number | null }) {
  const text = AsdVariant.score(value);
  return AsdVariant.isStrong(value) ? <strong>{text}</strong> : <>{text}</>;
}

/** Every variant the filters match, a page at a time, with the browser's range and the data's other columns one click away. */
export function AsdVariantTable({ variants, total, page, pageSize, onPageChange, onPageSizeChange, chromosome, onChromosomeChange, rangeOnly, onRangeOnlyChange, columns, onSelect, loading, notice }: AsdVariantTableProps) {
  const [shown, setShown] = useState<readonly string[]>([]);
  const hidden = columns.length - shown.length;
  const rows = variants.map((row) => new AsdVariant(row));
  const toggle = (column: string) => setShown((current) => (current.includes(column) ? current.filter((name) => name !== column) : [...current, column]));

  return (
    <div className="asd-browser-view" aria-busy={loading || undefined}>
      <div className="asd-browser-filters">
        <Select label="Chromosome" size="small" options={chromosomes} value={rangeOnly ? 'all' : chromosome} disabled={rangeOnly} onChange={onChromosomeChange} />
        <Checkbox label="Only the genome browser’s range" checked={rangeOnly} onChange={(event) => onRangeOnlyChange(event.target.checked)} />
        <strong className="asd-browser-count">{counts.format(total)} variants</strong>
        <ActionMenu
          label={hidden ? `Columns (${hidden} hidden)` : 'Columns'}
          size="small"
          trigger="text"
          items={columns.map((column) => ({ label: `${shown.includes(column) ? 'Hide' : 'Show'} ${AsdVariant.columnLabel(column)}`, onSelect: () => toggle(column) }))}
        />
      </div>
      {notice ?? (
        <>
          <Table caption="ASD Browser variants" density="compact" minWidth="1100px">
            <thead>
              <tr>
                <HeaderCell sort="ascending">Position</HeaderCell>
                <HeaderCell>Change</HeaderCell>
                <HeaderCell>Individual</HeaderCell>
                <HeaderCell align="end">DNA disease impact</HeaderCell>
                <HeaderCell>Nearest gene (TSS)</HeaderCell>
                <HeaderCell align="end">Distance to TSS</HeaderCell>
                <HeaderCell align="end">RNA disease impact</HeaderCell>
                <HeaderCell>RNA gene</HeaderCell>
                {shown.map((column) => (
                  <HeaderCell key={column}>{AsdVariant.columnLabel(column)}</HeaderCell>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((variant) => (
                <tr key={`${variant.position}-${variant.change}-${variant.row.individual}`}>
                  <Cell rowHeader type="id">
                    {onSelect ? (
                      <button type="button" className="asd-browser-pick" onClick={() => onSelect(variant.row)}>
                        {variant.position}
                      </button>
                    ) : (
                      variant.position
                    )}
                  </Cell>
                  <Cell type="id">{variant.change}</Cell>
                  <Cell type="id">{variant.row.individual}</Cell>
                  <Cell type="number"><Score value={variant.row.dnaScore} /></Cell>
                  <Cell>{variant.row.nearestGene}</Cell>
                  <Cell type="number">{variant.tssDistance}</Cell>
                  <Cell type="number"><Score value={variant.row.rnaScore} /></Cell>
                  <Cell>{variant.rnaGene}</Cell>
                  {shown.map((column) => (
                    <Cell key={column}>{variant.columnValue(column)}</Cell>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination total={total} noun="variants" page={page} onPageChange={onPageChange} pageSize={pageSize} {...(onPageSizeChange && { onPageSizeChange })} />
        </>
      )}
      <p className="asd-browser-note">{onSelect ? 'Choose a position to open the browser at that variant, with the heatmap sorted by it.' : 'Clicking a row opens the browser at that variant, centered, with the heatmap sorted by it. The search above filters the table by any column, gene or position, as today.'}</p>
    </div>
  );
}
