import { ApiError, featureEffects, GenomeLocation, useHumanbase, usePrecomputedPredictions, variantIdOf, type FeatureEffect, type FeaturePredictionRecord, type FeaturesRecord, type VariantModel } from '@humanbase/data';
import { defaultGenomeEngine, type Assembly, type GenomeBrowserEngineFactory, type GenomeDataTrack } from '@humanbase/genome';
import { Alert, defaultEffectsView, ResultHeader, ResultLayout, Skeleton, Tabs, variantLabel, type TabItem, type ContextLabelProps, type Crumb, type EffectScale, type EffectsView } from '@humanbase/ui';
import { useMemo, useState, type ReactNode } from 'react';
import { EffectsCard } from '../Deepsea/EffectsCard';
import type { VariantInView } from '../Deepsea/InViewHeatmap';
import { VariantGenomeBrowser } from '../Deepsea/VariantGenomeBrowser';
import '../Deepsea/Deepsea.css';

/** A model's precomputed variants, such as Seqweaver's gnomAD variants, and how humanbase.io shows them. */
export interface PrecomputedVariantSet {
  /** Names the browser whose track choices are remembered, such as seqweaver-gnomad. */
  id: string;
  model: VariantModel;
  /** The API's name for a dataset with its own features, such as sei_hgmd; the model's own predictions by default. */
  dataset?: string | undefined;
  /** The score_type the predictions are read with, such as seqweaver, where the dataset takes one. */
  scoreType?: string | undefined;
  scale: EffectScale;
  /** What each feature is, as in the effects card's Raises binding, 14 proteins. */
  featureNoun: string;
  featurePlural: string;
  verb: string;
  title: string;
  subtitle: string;
  crumbs: readonly Crumb[];
  context: readonly ContextLabelProps[];
  assembly: Assembly;
  tracks: readonly GenomeDataTrack[];
  /** Where the browser opens, as on humanbase.io. */
  start: GenomeLocation;
  /** Where it opens with the API off: a stretch the recorded samples cover. */
  sampleStart: GenomeLocation;
  scoreDocs: { label: string; href: string };
}

/** What the page keeps in its URL. */
export interface PrecomputedVariantState {
  /** The browser's range, such as chr1:2,230,000-2,440,000. */
  location?: string | undefined;
  /** The selected variant's ID, such as chr1-2334919-C-T. */
  variant?: string | undefined;
}

/** Other views of the same set beside the genome browser, such as the Sei HGMD heatmap of every variant. */
export interface PrecomputedVariantViews {
  tabs: readonly TabItem[];
  value: string;
  onChange: (value: string) => void;
  /** The open view and what it shows; undefined shows the genome browser. */
  content?: { label: string; view: ReactNode } | undefined;
}

export interface PrecomputedVariantBrowserProps {
  set: PrecomputedVariantSet;
  state: PrecomputedVariantState;
  onStateChange: (next: PrecomputedVariantState) => void;
  views?: PrecomputedVariantViews | undefined;
  engine?: GenomeBrowserEngineFactory | undefined;
}

const count = new Intl.NumberFormat('en-US');
const labelOf = (record: FeaturePredictionRecord) => variantLabel({ chromosome: record.chromosome, position: record.position, change: `${record.ref_allele}>${record.alt_allele}` });

/** One variant in the heatmap; its effects are named only when a column shows them, since a wide view holds thousands. */
class PrecomputedVariant implements VariantInView {
  readonly key: string;
  readonly name: string;
  readonly position: number;
  readonly href: string;
  private named: FeatureEffect[] | undefined;

  constructor(
    private readonly record: FeaturePredictionRecord,
    private readonly features: FeaturesRecord | undefined,
    assembly: Assembly,
  ) {
    this.key = variantIdOf(record);
    this.name = labelOf(record);
    this.position = record.position;
    this.href = GenomeLocation.at(record.chromosome, record.position, assembly).ucscUrl;
  }

  get effects(): readonly FeatureEffect[] | undefined {
    if (!this.features) return undefined;
    this.named ??= featureEffects(this.record, this.features);
    return this.named;
  }
}

function locationOf(text: string | undefined, assembly: Assembly, fallback: GenomeLocation): GenomeLocation {
  const parsed = text ? GenomeLocation.parse(text, assembly) : undefined;
  return (parsed instanceof GenomeLocation && parsed.fit().location) || fallback;
}

/** Browses a model's precomputed variants: the genome browser with the set's score track, and the effects of the variant nearest its center on every feature. */
export function PrecomputedVariantBrowser({ set, state, onStateChange, views, engine = defaultGenomeEngine }: PrecomputedVariantBrowserProps) {
  const { showsSamples } = useHumanbase();
  const location = useMemo(() => locationOf(state.location, set.assembly, showsSamples ? set.sampleStart : set.start), [state.location, set, showsSamples]);
  const [view, setView] = useState<EffectsView>(defaultEffectsView);
  // As in the ASD Browser, a variant picked with Previous, Next or a heatmap column starts its effects afresh; moving the browser keeps them.
  const [picked, setPicked] = useState(state.variant);
  const { features, predictions, error, refetch } = usePrecomputedPredictions(set, location);
  const variants = useMemo(() => (predictions ?? []).map((record) => new PrecomputedVariant(record, features, set.assembly)), [predictions, features, set.assembly]);
  const selectedRecord = predictions && (predictions.find((record) => variantIdOf(record) === state.variant) ?? location.nearest(predictions));
  const index = selectedRecord && predictions ? predictions.indexOf(selectedRecord) : -1;
  const selected = variants[index];
  const scoreKey = set.scoreType ?? set.id;
  const sampleHelp = `With the API off, the sample data covers ${set.sampleStart.format()}. Zoom in there, or turn the API on.`;

  const move = (to: GenomeLocation) => onStateChange({ location: to.format(), variant: undefined });
  const pick = (at: number) => {
    const next = predictions?.[at];
    if (!next) return;
    setPicked(variantIdOf(next));
    onStateChange({ location: location.format(), variant: variantIdOf(next) });
  };
  // As on humanbase.io, clicking a heatmap column selects that variant and centers the browser on it at the same width.
  const center = (key: string) => {
    const record = predictions?.find((one) => variantIdOf(one) === key);
    if (!record) return;
    setPicked(key);
    onStateChange({ variant: key, location: GenomeLocation.at(record.chromosome, record.position, set.assembly).withWidth(location.width).format() });
  };

  let effects;
  if (error) {
    effects =
      showsSamples && error instanceof ApiError && error.isNotFound ? (
        <Alert tone="info" title="The sample data doesn’t include this range">{sampleHelp}</Alert>
      ) : (
        <Alert tone="error" title="These variants couldn’t load" action={{ label: 'Try again', onSelect: refetch }}>
          Humanbase didn’t answer. Trying again is safe.
        </Alert>
      );
  } else if (!predictions) {
    effects = <Skeleton width="100%" height="320px" />;
  } else if (!selected || !selectedRecord) {
    effects = (
      <Alert tone="info" title="No variants in this range">
        Zoom out, or move the genome browser.
      </Alert>
    );
  } else {
    effects = (
      <>
        <p className="deepsea-note">
          {count.format(predictions.length)} variants in view; the selected one, {selected.name}, is drawn in ink. Previous variant and Next variant step through them.
        </p>
        <EffectsCard
          key={picked ?? ''}
          label={selected.name}
          view={view}
          onViewChange={setView}
          inView={{ location, variants, selected: index, onSelect: center, onMove: (bases) => move(location.move(bases / location.width)) }}
          effects={selected.effects}
          failed={false}
          onRetry={refetch}
          scale={set.scale}
          threshold={set.scale.bins.weak}
          featureNoun={set.featureNoun}
          featurePlural={set.featurePlural}
          verb={set.verb}
          choice={{ label: 'Score', options: [{ value: scoreKey, label: set.scale.legend.title }], value: scoreKey, onChange: () => undefined, name: set.scale.legend.title }}
          scoreDocs={set.scoreDocs}
        />
      </>
    );
  }

  const genome = (
    <div className="deepsea-result">
      <VariantGenomeBrowser
        browser={set.id}
        assembly={set.assembly}
        chromosome={selectedRecord?.chromosome ?? location.chrom}
        position={selectedRecord?.position ?? location.center}
        label={selected?.name ?? location.format()}
        location={location}
        tracks={set.tracks}
        onLocationChange={move}
        engine={engine}
        {...(index > 0 && { onPreviousVariant: () => pick(index - 1) })}
        {...(predictions && index >= 0 && index < predictions.length - 1 && { onNextVariant: () => pick(index + 1) })}
      />
      {effects}
    </div>
  );

  return (
    <ResultLayout
      header={<ResultHeader crumbs={set.crumbs} title={set.title} subtitle={set.subtitle} context={set.context} />}
      mainLabel={views?.content?.label ?? 'Genome browser and molecular effects'}
      main={
        views ? (
          <Tabs label="Views" tabs={views.tabs} value={views.value} onChange={views.onChange}>
            {views.content?.view ?? genome}
          </Tabs>
        ) : (
          genome
        )
      }
    />
  );
}
