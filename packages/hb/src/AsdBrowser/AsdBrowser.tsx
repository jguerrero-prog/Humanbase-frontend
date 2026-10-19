import { type AsdVariantRow } from '@humanbase/data';
import { GenomeBrowserToolbar, Heatmap, ResultLayout, Select, type ContextLabelProps, type Crumb, type HeatmapProps } from '@humanbase/ui';
import { useState, type ReactNode } from 'react';
import { AsdHeader, AsdVariantTable, type AsdView } from './AsdParts';
import './AsdBrowser.css';

export type { AsdView } from './AsdParts';

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

const features = [
  { value: 'dna', label: 'DNA features' },
  { value: 'rna', label: 'RNA features' },
];
const junctions = ['Exon junction proximal 200bp', 'Exon junction proximal 400bp', 'AS  junction proximal 200bp', 'AS  junction proximal 400bp'];

/** The ASD Browser drawn from data passed in, as the design system pages show it; AsdExplorer is the connected page. */
export function AsdBrowser({
  crumbs, subtitle, context, variants, total, location, assembly, widthHelp, heatmap, heatmapNote, examples, notice, defaultView = 'browser', noticeKey = 'humanbase:asd-data-use',
}: AsdBrowserProps) {
  const [view, setView] = useState<AsdView>(defaultView);
  const [query, setQuery] = useState('');
  const [page, setPage] = useState(1);
  const [chromosome, setChromosome] = useState('all');
  const [rangeOnly, setRangeOnly] = useState(false);

  return (
    <ResultLayout
      className="asd-browser"
      mainLabel={view === 'browser' ? 'Genome browser and heatmap' : 'Every variant'}
      header={<AsdHeader crumbs={crumbs} subtitle={subtitle} context={context} view={view} onViewChange={setView} query={query} onQueryChange={setQuery} examples={examples} notice={notice} noticeKey={noticeKey} />}
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
          <AsdVariantTable
            variants={variants}
            total={total}
            page={page}
            pageSize={25}
            onPageChange={setPage}
            chromosome={chromosome}
            onChromosomeChange={setChromosome}
            rangeOnly={rangeOnly}
            onRangeOnlyChange={setRangeOnly}
            columns={junctions}
          />
        )
      }
    />
  );
}
