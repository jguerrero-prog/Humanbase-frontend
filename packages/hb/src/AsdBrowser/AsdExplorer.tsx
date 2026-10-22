import {
  ApiError, AsdVariant, featureEffects, GenomeLocation, useAsdColumns, useAsdEffects, useAsdPage, readTheDocs, useAsdRange, useHumanbase,
  type AsdFeatureSet, type AsdVariantRow, type FeaturePredictionRecord,
} from '@humanbase/data';
import { defaultGenomeEngine, GenomeEngineView, type EngineStatus, type GenomeBrowserEngineFactory, type GenomeDataTrack, type GenomeRegion } from '@humanbase/genome';
import { Alert, GenomeBrowserToolbar, ResultLayout, Skeleton, asdEffects, type EffectsView } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import { EffectsCard } from '../Deepsea/EffectsCard';
import { useGenomeBrowserTools } from '../GenomeBrowser/useGenomeBrowserTools';
import { AsdHeader, AsdVariantTable, type AsdView } from './AsdParts';
import './AsdBrowser.css';

/** What the page keeps in its URL. */
export interface AsdState {
  view: AsdView;
  /** The browser's range, such as chr1:2,230,000-2,440,000. */
  location?: string | undefined;
  /** The selected variant, such as chr1:2337101. */
  variant?: string | undefined;
  set: AsdFeatureSet;
}

export interface AsdExplorerProps {
  state: AsdState;
  onStateChange: (next: Partial<AsdState>) => void;
  /** The genome browser; it reads the track files from S3, or the samples with the API off. */
  engine?: GenomeBrowserEngineFactory | undefined;
}

const defaultLocation = new GenomeLocation('chr1', 2_230_000, 2_440_000);
const assembly = 'GRCh37/hg19';
const count = new Intl.NumberFormat('en-US');
const featureSets = [
  { value: 'dna', label: 'DNA features' },
  { value: 'rna', label: 'RNA features' },
];
const sampleHelp = 'With the API off, the sample data covers chr1:2,230,000-2,440,000 and the CHD8, SCN2A and CHD9 examples. Search one of those, or turn the API on.';
// The live ASD page's two impact tracks, with the style Biodalliance reads; 50px tall, per the genome browser docs.
const impactRange = [-0.4, 3] as const;
const impactStyle = { type: 'default', style: { glyph: 'HISTOGRAM', BGCOLOR: 'var(--viz-seq-6)', HEIGHT: 50, MIN: impactRange[0], MAX: impactRange[1] } };
const impactTracks: readonly GenomeDataTrack[] = [
  { name: 'DNA disease impact score', meta: 'Model score, −0.4 to 3', bigWigUrl: 'https://s3-us-west-2.amazonaws.com/humanbase/tracks/dis_dna.bw', range: impactRange, style: impactStyle },
  { name: 'RNA disease impact score', meta: 'Model score, −0.4 to 3', bigWigUrl: 'https://s3-us-west-2.amazonaws.com/humanbase/tracks/dis_rna.bw', range: impactRange, style: impactStyle },
];
const notice = 'Simons Simplex Collection (and Simons VIP) data may only be used for projects that advance autism and related developmental disorder research. Questions about the data go to collections@sfari.org.';

type SearchBox = 'page' | 'browser';

const keyOf = (row: Pick<AsdVariantRow, 'chromosome' | 'position'>) => `${row.chromosome}:${row.position}`;
const labelOf = (row: AsdVariantRow) => `${new AsdVariant(row).position} ${row.ref}>${row.alt}`;
const isMissingSample = (error: unknown, showsSamples: boolean) => showsSamples && error instanceof ApiError && error.isNotFound;

function locationOf(text: string | undefined): GenomeLocation {
  const parsed = text ? GenomeLocation.parse(text) : undefined;
  return (parsed instanceof GenomeLocation && parsed.fit().location) || defaultLocation;
}

/** The connected ASD Browser: search, the genome browser view with each variant's molecular effects, and the table. */
export function AsdExplorer({ state, onStateChange, engine = defaultGenomeEngine }: AsdExplorerProps) {
  const api = useHumanbase();
  const location = useMemo(() => locationOf(state.location), [state.location]);
  const [query, setQuery] = useState('');
  // Each search box shows its own error: the page search, or the browser's location field.
  const [searchError, setSearchError] = useState<{ from: SearchBox; text: string }>();
  const [searchedGene, setSearchedGene] = useState<string>();
  const [rangeOnly, setRangeOnly] = useState(false);
  const overall = useAsdPage(1, 25);

  const search = async (text: string, from: SearchBox) => {
    const fail = (message: string) => setSearchError({ from, text: message });
    setSearchError(undefined);
    if (!text.trim()) return;
    const typed = GenomeLocation.parse(text);
    try {
      const found = await api.asd.find(text);
      if (!found) {
        const gene = typed && !(typed instanceof GenomeLocation) ? typed.gene : undefined;
        fail(gene ? (api.showsSamples ? sampleHelp : GenomeLocation.geneNotFound(gene)) : 'Enter a gene such as CHD8, a region such as chr1:2,230,000-2,440,000 or a position such as chr1:2,337,101.');
        return;
      }
      const { location: kept, message } = found.location.fit();
      if (message) fail(message);
      if (!kept) return;
      setSearchedGene(found.gene);
      if (state.view === 'table') setRangeOnly(true);
      onStateChange({ location: kept.format(), variant: undefined });
    } catch {
      fail('The gene index didn’t answer. Try again, or search a region such as chr1:2,230,000-2,440,000.');
    }
  };

  return (
    <ResultLayout
      className="asd-browser"
      mainLabel={state.view === 'browser' ? 'Genome browser and molecular effects' : 'Every variant'}
      header={
        <AsdHeader
          crumbs={[{ label: 'Sequence analysis', href: '/sequence-tools/' }, { label: 'ASD Browser' }]}
          subtitle="Predicted effects of de novo noncoding variants in autism, from Simons Simplex Collection whole-genome sequencing."
          context={[
            { name: 'Study', value: 'Simons Simplex Collection' },
            { name: 'Variants', value: overall.data ? count.format(overall.data.total) : '…' },
            { name: 'Genome', value: assembly },
            { name: 'Paper', value: 'Zhou et al., 2019' },
          ]}
          view={state.view}
          onViewChange={(view) => onStateChange({ view })}
          query={query}
          onQueryChange={setQuery}
          onSearch={(text) => void search(text, 'page')}
          searchError={searchError?.from === 'page' ? searchError.text : undefined}
          examples={['CHD8', 'SCN2A', defaultLocation.format()]}
          notice={notice}
          downloadHref="https://s3-us-west-2.amazonaws.com/humanbase/variants/dis_asd.tsv"
        />
      }
      main={
        state.view === 'browser' ? (
          <BrowserView engine={engine} location={location} state={state} onStateChange={onStateChange} onLocation={(text) => void search(text, 'browser')} locationError={searchError?.from === 'browser' ? searchError.text : undefined} searchedGene={searchedGene} />
        ) : (
          <TableView location={location} rangeOnly={rangeOnly} onRangeOnlyChange={setRangeOnly} onSelect={(row) => onStateChange({ view: 'browser', location: location.includes(row.chromosome, row.position) ? location.format() : new GenomeLocation(row.chromosome, row.position, row.position).withWidth(location.width).format(), variant: keyOf(row) })} />
        )
      }
    />
  );
}

interface BrowserViewProps {
  engine: GenomeBrowserEngineFactory;
  location: GenomeLocation;
  state: AsdState;
  onStateChange: (next: Partial<AsdState>) => void;
  onLocation: (text: string) => void;
  locationError: string | undefined;
  searchedGene: string | undefined;
}

function BrowserView({ engine, location, state, onStateChange, onLocation, locationError, searchedGene }: BrowserViewProps) {
  const { showsSamples, genomeTracks } = useHumanbase();
  // The effects tab stays as the browser moves and the variants below reload.
  const [effectsView, setEffectsView] = useState<EffectsView>('strongest');
  const [engineStatus, setEngineStatus] = useState<{ status: EngineStatus; error?: Error | undefined }>({ status: 'loading' });
  // A variant picked with Previous, Next or a heatmap column starts its effects afresh; one reached by moving the browser keeps them, so a drag carries on.
  const [picked, setPicked] = useState(state.variant);
  const region = useMemo(() => ({ chrom: location.chrom, start: location.start, end: location.end }), [location]);
  const onRegionChange = (moved: GenomeRegion) => onStateChange({ location: (new GenomeLocation(moved.chrom, moved.start, moved.end).fit().location ?? location).format() });
  const range = useAsdRange(location);
  const rows = range.data;
  const selected = rows?.find((row) => keyOf(row) === state.variant) ?? (rows && location.nearest(rows));
  const index = selected && rows ? rows.indexOf(selected) : -1;
  const move = (to: GenomeLocation) => onStateChange({ location: to.format(), variant: undefined });
  const step = (by: number) => {
    const next = rows?.[index + by];
    if (!next) return;
    setPicked(keyOf(next));
    onStateChange({ variant: keyOf(next) });
  };
  // As on humanbase.io, clicking a heatmap column selects that variant and centers the browser on it at the same width.
  const center = (key: string) => {
    const row = rows?.find((one) => keyOf(one) === key);
    if (!row) return;
    setPicked(key);
    onStateChange({ variant: key, location: new GenomeLocation(row.chromosome, row.position, row.position).withWidth(location.width).format() });
  };
  const zoomStop = (GenomeLocation.zoomStops as readonly number[]).includes(location.width) ? location.width : undefined;
  const { attach, ...tools } = useGenomeBrowserTools({ browser: 'asd', assembly: 'hg19', tracks: impactTracks, location });

  let body;
  if (range.isError) {
    body = isMissingSample(range.error, showsSamples) ? (
      <Alert tone="info" title="The sample data doesn’t include this range">{sampleHelp}</Alert>
    ) : (
      <Alert tone="error" title="These variants couldn’t load" action={{ label: 'Try again', onSelect: () => void range.refetch() }}>
        Humanbase didn’t answer. Trying again is safe.
      </Alert>
    );
  } else if (!rows) {
    body = <Skeleton width="100%" height="160px" />;
  } else if (!rows.length || !selected) {
    body = (
      <Alert tone="info" title={searchedGene ? `No variants in this dataset near “${searchedGene}”` : 'No variants in this range'}>
        Zoom out, or search another gene or region, such as chr14:21,853,000-21,906,000.
      </Alert>
    );
  } else {
    body = (
      <>
        <p className="asd-browser-note">
          {count.format(rows.length)} variants in view; the selected one, {labelOf(selected)}, is drawn in ink. Previous variant and Next variant step through them, and the Table view lists them all.
        </p>
        <VariantEffects key={`${picked ?? ''}-${state.set}`} location={location} rows={rows} selected={selected} set={state.set} onSetChange={(set) => onStateChange({ set })} view={effectsView} onViewChange={setEffectsView} onSelect={center} onMove={(bases) => move(location.move(bases / location.width))} />
      </>
    );
  }

  return (
    <div className="asd-browser-view">
      <GenomeBrowserToolbar
        location={location.format()}
        assembly={assembly}
        widthHelp={`${GenomeLocation.widthInWords(location.width)} shown. A gene name works too.`}
        locationError={locationError}
        zoomStop={zoomStop}
        onLocation={onLocation}
        onZoom={(direction) => move(location.zoom(direction))}
        onZoomStop={(bases) => move(location.withWidth(bases))}
        onPreviousVariant={() => step(-1)}
        onNextVariant={() => step(1)}
        {...tools.toolbar}
      />
      {tools.panels}
      {engineStatus.status === 'failed' && (
        <Alert tone="error" title="The genome browser couldn’t load">
          {engineStatus.error?.message ?? 'The genome browser didn’t start.'} The variants and their effects below still work.
        </Alert>
      )}
      <GenomeEngineView
        ref={attach}
        engine={engine}
        files={genomeTracks}
        label={location.regionLabel(tools.shownCount)}
        assembly="hg19"
        region={region}
        tracks={tools.tracks}
        hidden={tools.hidden}
        selected={selected ? { chrom: selected.chromosome, position: selected.position } : undefined}
        onRegionChange={onRegionChange}
        onStatusChange={(status, error) => setEngineStatus({ status, error })}
        onCommand={(command) => {
          if (tools.onCommand(command)) return;
          if (command === 'moveLeft' || command === 'moveRight') move(location.move(command === 'moveLeft' ? -0.1 : 0.1));
          else if (command === 'zoomIn' || command === 'zoomOut') move(location.zoom(command === 'zoomIn' ? 'in' : 'out'));
          else if (command === 'previousVariant' || command === 'nextVariant') step(command === 'previousVariant' ? -1 : 1);
        }}
      />
      {body}
    </div>
  );
}

interface VariantEffectsProps {
  location: GenomeLocation;
  rows: readonly AsdVariantRow[];
  selected: AsdVariantRow;
  set: AsdFeatureSet;
  onSetChange: (set: AsdFeatureSet) => void;
  view: EffectsView;
  onViewChange: (view: EffectsView) => void;
  onSelect: (key: string) => void;
  onMove: (bases: number) => void;
}

const positionKey = (record: Pick<FeaturePredictionRecord, 'chromosome' | 'position'>) => `${record.chromosome.startsWith('chr') ? record.chromosome : `chr${record.chromosome}`}:${record.position}`;

function VariantEffects({ location, rows, selected, set, onSetChange, view, onViewChange, onSelect, onMove }: VariantEffectsProps) {
  const { showsSamples } = useHumanbase();
  const { features, predictions } = useAsdEffects(location, set);
  const byPosition = useMemo(() => new Map((predictions.data ?? []).map((record) => [positionKey(record), record])), [predictions.data]);
  const prediction = byPosition.get(keyOf(selected));
  const variants = useMemo(
    () =>
      rows.map((row) => {
        const record = byPosition.get(keyOf(row));
        return { key: keyOf(row), name: labelOf(row), position: row.position, href: GenomeLocation.at(row.chromosome, row.position).ucscUrl, effects: record && features.data ? featureEffects(record, features.data) : undefined };
      }),
    [rows, byPosition, features.data],
  );
  const index = rows.indexOf(selected);
  const effects = variants[index]?.effects;
  const noun = set === 'dna' ? 'DNA feature' : 'RNA feature';
  const scale = asdEffects(set === 'dna' ? 'DNA' : 'RNA');
  const failed = predictions.isError || features.isError;

  if (failed && (isMissingSample(predictions.error, showsSamples) || isMissingSample(features.error, showsSamples))) {
    return <Alert tone="info" title={`The sample data doesn’t include ${noun}s for this range`}>{sampleHelp}</Alert>;
  }
  if (predictions.data && !prediction) {
    return <Alert tone="info" title={`No ${noun} predictions for ${labelOf(selected)}`}>Choose another variant with Previous variant or Next variant.</Alert>;
  }

  return (
    <EffectsCard
      label={labelOf(selected)}
      effects={effects}
      failed={failed}
      onRetry={() => {
        void predictions.refetch();
        void features.refetch();
      }}
      scale={scale}
      threshold={scale.bins.weak}
      featureNoun={noun}
      featurePlural={`${noun}s`}
      verb=""
      choice={{ label: 'Features', options: featureSets, value: set, onChange: (value) => onSetChange(value as AsdFeatureSet), name: 'Score' }}
      scoreDocs={{ label: 'Score type documentation', href: `${readTheDocs}asdbrowser.html#output` }}
      view={view}
      onViewChange={onViewChange}
      inView={{ location, variants, selected: index, onSelect, onMove }}
    />
  );
}

interface TableViewProps {
  location: GenomeLocation;
  rangeOnly: boolean;
  onRangeOnlyChange: (rangeOnly: boolean) => void;
  onSelect: (row: AsdVariantRow) => void;
}

function TableView({ location, rangeOnly, onRangeOnlyChange, onSelect }: TableViewProps) {
  const { showsSamples } = useHumanbase();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [chromosome, setChromosome] = useState('all');
  const where = rangeOnly ? location : chromosome === 'all' ? undefined : chromosome;
  const table = useAsdPage(page, pageSize, where);
  const columns = useAsdColumns();
  const offered = (columns.data ?? []).filter((name) => !AsdVariant.shownColumns.includes(name));
  const filter = <T,>(set: (value: T) => void) => (value: T) => {
    set(value);
    setPage(1);
  };

  const notice = table.isError ? (
    isMissingSample(table.error, showsSamples) ? (
      <Alert tone="info" title="The sample data doesn’t include these rows">{sampleHelp}</Alert>
    ) : (
      <Alert tone="error" title="These variants couldn’t load" action={{ label: 'Try again', onSelect: () => void table.refetch() }}>
        Humanbase didn’t answer. Trying again is safe.
      </Alert>
    )
  ) : !table.data ? (
    <Skeleton width="100%" height="320px" />
  ) : table.data.total === 0 ? (
    <Alert tone="info" title="No variants match">Choose another chromosome, or clear Only the genome browser’s range.</Alert>
  ) : undefined;

  return (
    <AsdVariantTable
      variants={table.data?.rows ?? []}
      total={table.data?.total ?? 0}
      page={page}
      pageSize={pageSize}
      onPageChange={setPage}
      onPageSizeChange={filter(setPageSize)}
      chromosome={chromosome}
      onChromosomeChange={filter(setChromosome)}
      rangeOnly={rangeOnly}
      onRangeOnlyChange={filter(onRangeOnlyChange)}
      columns={offered}
      onSelect={onSelect}
      loading={table.isFetching}
      notice={notice}
    />
  );
}
