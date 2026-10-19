import { AsdVariant, type AsdVariantRow } from '@humanbase/data';
import {
  ActionMenu, Alert, Button, Cell, Checkbox, GenomeBrowserToolbar, HeaderCell, Heatmap, Pagination, ResultHeader, ResultLayout, SearchField, SegmentedControl, Select, Table,
  type ContextLabelProps, type Crumb, type HeatmapProps,
} from '@humanbase/ui';
import { useState, type ReactNode } from 'react';
import './AsdBrowser.css';

export type AsdView = 'browser' | 'table';

export interface AsdBrowserProps {
  crumbs: readonly Crumb[];
  subtitle: string;
  context: readonly ContextLabelProps[];
  variants: readonly AsdVariantRow[];
  /** The number of rows in the data, written in the table. */
  total: number;
  location: string;
  assembly: string;
  widthHelp: string;
  heatmap: Omit<HeatmapProps, 'rowHeader' | 'columnHeader'>;
  heatmapNote: ReactNode;
  examples: readonly string[];
  notice: string;
  defaultView?: AsdView;
  /** The browser storage key that remembers a dismissed notice; empty to always show it. */
  noticeKey?: string;
}

const views = [
  { value: 'browser', label: 'Genome browser' },
  { value: 'table', label: 'Table' },
];
const features = [
  { value: 'dna', label: 'DNA features' },
  { value: 'rna', label: 'RNA features' },
];
const chromosomes = [{ value: 'all', label: 'All chromosomes' }, ...[...Array.from({ length: 22 }, (_, index) => String(index + 1)), 'X', 'Y'].map((name) => ({ value: `chr${name}`, label: `chr${name}` }))];
const junctions = ['Exon junction proximal 200bp', 'Exon junction proximal 400bp', 'AS junction proximal 200bp', 'AS junction proximal 400bp'];
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

function Score({ value }: { value: number | null }) {
  const text = AsdVariant.score(value);
  return AsdVariant.isStrong(value) ? <strong>{text}</strong> : <>{text}</>;
}

export function AsdBrowser({
  crumbs, subtitle, context, variants, total, location, assembly, widthHelp, heatmap, heatmapNote, examples, notice, defaultView = 'browser', noticeKey = 'humanbase:asd-data-use',
}: AsdBrowserProps) {
  const [view, setView] = useState<AsdView>(defaultView);
  const [query, setQuery] = useState('');
  const [noticeOpen, setNoticeOpen] = useState(() => typeof window === 'undefined' || !remembered(noticeKey));
  const [shown, setShown] = useState<readonly string[]>([]);
  const hidden = junctions.length - shown.length;
  const rows = variants.map((row) => new AsdVariant(row));
  const toggle = (column: string) => setShown((current) => (current.includes(column) ? current.filter((name) => name !== column) : [...current, column]));
  const dismiss = () => {
    setNoticeOpen(false);
    remember(noticeKey);
  };

  return (
    <ResultLayout
      className="asd-browser"
      mainLabel={view === 'browser' ? 'Genome browser and heatmap' : 'Every variant'}
      header={
        <>
          <ResultHeader
            headingLevel={3}
            crumbs={crumbs}
            title="ASD Browser"
            context={context}
            settingsLabel="View and download"
            settings={
              <>
                <SegmentedControl label="View" hideLabel size="small" segments={views} value={view} onChange={(value) => setView(value as AsdView)} />
                <Button variant="secondary" icon="download">
                  Download data
                </Button>
              </>
            }
          />
          <p className="asd-browser-subtitle">{subtitle}</p>
          <search className="asd-browser-search">
            <SearchField label="Find a gene, region or position" placeholder="Find a gene, region or position, such as CHD8 or chr1:2,337,101" size="large" value={query} onChange={(event) => setQuery(event.target.value)} onClear={() => setQuery('')} />
            <p className="asd-browser-examples">
              <span>Try</span>
              {examples.map((example) => (
                <Button key={example} variant="ghost" size="small" onClick={() => setQuery(example)}>
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
      }
      main={
        view === 'browser' ? (
          <div className="asd-browser-view">
            <GenomeBrowserToolbar location={location} assembly={assembly} widthHelp={widthHelp} zoomStop={500_000} />
            <div className="asd-browser-heatmap">
              <div className="asd-browser-features">
                <Select label="Features" size="small" options={features} defaultValue="dna" />
              </div>
              <div data-illustration>
                <Heatmap {...heatmap} rowHeader="Feature" columnHeader="Variant position" />
              </div>
              <p className="asd-browser-note">{heatmapNote}</p>
            </div>
          </div>
        ) : (
          <div className="asd-browser-view">
            <div className="asd-browser-filters">
              <Select label="Chromosome" size="small" options={chromosomes} defaultValue="all" />
              <Checkbox label="Only the genome browser’s range" />
              <strong className="asd-browser-count">{counts.format(total)} variants</strong>
              <ActionMenu
                label={`Columns (${hidden} hidden)`}
                size="small"
                items={junctions.map((column) => ({ label: shown.includes(column) ? `Hide ${column}` : `Show ${column}`, onSelect: () => toggle(column) }))}
              />
            </div>
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
                    <HeaderCell key={column}>{column}</HeaderCell>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((variant) => (
                  <tr key={variant.position}>
                    <Cell rowHeader type="id">{variant.position}</Cell>
                    <Cell type="id">{variant.change}</Cell>
                    <Cell type="id">{variant.row.individual}</Cell>
                    <Cell type="number"><Score value={variant.row.dnaScore} /></Cell>
                    <Cell>{variant.row.nearestGene}</Cell>
                    <Cell type="number">{variant.tssDistance}</Cell>
                    <Cell type="number"><Score value={variant.row.rnaScore} /></Cell>
                    <Cell>{variant.rnaGene}</Cell>
                    {shown.map((column) => (
                      <Cell key={column}>{AsdVariant.missing}</Cell>
                    ))}
                  </tr>
                ))}
              </tbody>
            </Table>
            <Pagination total={total} noun="variants" defaultPageSize={25} />
            <p className="asd-browser-note">Clicking a row opens the browser at that variant, centered, with the heatmap sorted by it. The search above filters the table by any column, gene or position, as today.</p>
          </div>
        )
      }
    />
  );
}
