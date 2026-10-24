import { deepseaModels, featureEffects, GenomeLocation, SeiHgmdService, useSeiHgmd, type FeaturesRecord, type HgmdOrder, type HgmdVariantRecord } from '@humanbase/data';
import { scoreTrack, type GenomeBrowserEngineFactory } from '@humanbase/genome';
import { Alert, defaultEffectsView, Heatmap, ResultHeader, ResultLayout, ScoreScale, Select, sequenceClassEffects, Skeleton, Tabs, useLinkHref, variantLabel, type EffectsView, type Variant } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import { categoryCrumbs, productTools, seiHgmd } from '../content/product';
import { EffectsCard } from './EffectsCard';
import { VariantGenomeBrowser } from './VariantGenomeBrowser';
import './Deepsea.css';

export type SeiHgmdView = 'heatmap' | 'genome';

/** What the page keeps in its URL. */
export interface SeiHgmdState {
  view: SeiHgmdView;
  order: HgmdOrder;
  /** The selected variant's HGMD accession, such as CR095375. */
  variant?: string | undefined;
}

export interface SeiHgmdBrowserProps {
  state: SeiHgmdState;
  onStateChange: (next: Partial<SeiHgmdState>) => void;
  engine?: GenomeBrowserEngineFactory | undefined;
}

const sei = deepseaModels.sei;
const scale = sequenceClassEffects;
const scoreName = scale.legend.title;
const count = new Intl.NumberFormat('en-US');
const views = [
  { value: 'heatmap', label: 'Heatmap' },
  { value: 'genome', label: 'Genome browser' },
];
// As on humanbase.io: the browser opens 50 kb either side of the variant, with the dataset's score file over 0 to 3.
const startWidth = 100_000;
const tracks = [scoreTrack({ name: scoreName, source: 'Model score', bigWigUrl: 'https://humanbase.s3-us-west-2.amazonaws.com/tracks/sei.hgmd.nodup.abs_max.bw', range: [0, 3] })];
const choice = { label: 'Score', options: [{ value: 'seqclass', label: scoreName }], value: 'seqclass', onChange: () => undefined, name: scoreName };
const scoreDocs = { label: 'Score type documentation', href: `${sei.docsHref}#output` };

const asVariant = (record: HgmdVariantRecord): Variant => ({ id: record.id, chromosome: record.chromosome, position: record.position, change: `${record.ref_allele}>${record.alt_allele}`, name: record.gene, scores: {} });

/** Sei's sequence class scores for the HGMD noncoding disease variants: every variant on a heatmap, or one in the genome browser with its molecular effects. */
export function SeiHgmdBrowser({ state, onStateChange, engine }: SeiHgmdBrowserProps) {
  const { features, variants, error, refetch } = useSeiHgmd();
  // The API lists the variants in genome order, which is humanbase.io's Genome position order.
  const byPosition = useMemo(() => variants ?? [], [variants]);
  const linkHref = useLinkHref();
  const sorted = useMemo(() => SeiHgmdService.sorted(byPosition, state.order), [byPosition, state.order]);
  const selected = byPosition.find((record) => record.id === state.variant) ?? sorted[0];
  const show = (id: string) => onStateChange({ view: 'genome', variant: id });

  let main;
  if (error) {
    main = (
      <Alert tone="error" title="The HGMD variants couldn’t load" action={{ label: 'Try again', onSelect: refetch }}>
        Humanbase didn’t answer. Trying again is safe.
      </Alert>
    );
  } else if (!variants || !features) {
    main = <Skeleton width="100%" height="480px" />;
  } else if (state.view === 'heatmap') {
    main = <HgmdHeatmap variants={sorted} features={features} order={state.order} onOrderChange={(order) => onStateChange({ order })} onSelect={show} />;
  } else if (selected) {
    main = <HgmdGenome variants={byPosition} selected={selected} features={features} onSelect={(id) => onStateChange({ variant: id })} engine={engine} />;
  }

  return (
    <ResultLayout
      mainLabel={state.view === 'heatmap' ? 'Sequence class scores of every variant' : 'Genome browser and molecular effects'}
      header={
        <>
          <ResultHeader
            crumbs={[categoryCrumbs.variants, { label: productTools.variantEffects.label, href: productTools.variantEffects.href }, { label: seiHgmd.label }]}
            title={seiHgmd.label}
            context={[
              { name: 'Model', value: sei.kind },
              { name: 'Variants', value: variants ? count.format(variants.length) : '…' },
              { name: 'Source', value: 'HGMD' },
              { name: 'Genome', value: 'GRCh37/hg19' },
            ]}
          />
          <p className="deepsea-note">
            Explore the predicted sequence class scores for {variants ? count.format(variants.length) : '853'} noncoding pathogenic mutations from the Human Gene Mutation Database. To predict sequence classes for your own variants, run Sei on <a href={linkHref(productTools.variantEffects.href)}>{productTools.variantEffects.label}</a>.
          </p>
        </>
      }
      main={
        <Tabs label="Views" tabs={views} value={state.view} onChange={(view) => onStateChange({ view: view as SeiHgmdView })}>
          {main}
        </Tabs>
      }
    />
  );
}

interface HgmdHeatmapProps {
  variants: readonly HgmdVariantRecord[];
  features: FeaturesRecord;
  order: HgmdOrder;
  onOrderChange: (order: HgmdOrder) => void;
  onSelect: (id: string) => void;
}

const orderNames: Record<HgmdOrder, string> = { default: 'in the dataset’s order', disease: 'by disease name', position: 'by genome position' };

function HgmdHeatmap({ variants, features, order, onOrderChange, onSelect }: HgmdHeatmapProps) {
  const columns = useMemo(() => (features.model_features ?? []).map((feature) => ({ label: feature.chromatin_feature_type.name })), [features]);
  const rows = useMemo(() => {
    const values = new ScoreScale(scale.legend);
    const format = (value: number) => ScoreScale.number(Number(value.toFixed(3)));
    return variants.map((variant) => ({
      id: variant.id,
      label: SeiHgmdService.nameOf(variant),
      values: variant.feature_predictions,
      details: variant.feature_predictions.map((value) => ({ rows: [['Gene', variant.gene] as const, ['Position', `${variant.chromosome}:${variant.position}`] as const, [scoreName, values.describe(value, format)] as const] })),
    }));
  }, [variants]);

  return (
    <div className="deepsea-plot">
      <div className="deepsea-plot-controls">
        <Select label="Sort variants by" size="small" options={SeiHgmdService.orders} value={order} onChange={(value) => onOrderChange(value as HgmdOrder)} />
      </div>
      <Heatmap
        title={`${scoreName} of ${count.format(variants.length)} HGMD variants`}
        summary={`One row per variant, sorted ${orderNames[order]}, and one column per sequence class. Choose a variant to see it in the genome browser.`}
        scale={scale.legend}
        columns={columns}
        rows={rows}
        rowHeader="Disease variant (hg19)"
        columnHeader="Sequence class"
        valueLabel={scoreName}
        decimals={3}
        onRowSelect={(row) => onSelect(variants[row]?.id ?? '')}
      />
    </div>
  );
}

interface HgmdGenomeProps {
  /** Every variant, in genome order. */
  variants: readonly HgmdVariantRecord[];
  selected: HgmdVariantRecord;
  features: FeaturesRecord;
  onSelect: (id: string) => void;
  engine?: GenomeBrowserEngineFactory | undefined;
}

function HgmdGenome({ variants, selected, features, onSelect, engine }: HgmdGenomeProps) {
  // Choosing another variant centers the browser on it at the current zoom.
  const [browsed, setBrowsed] = useState<{ variant: string; location: GenomeLocation }>();
  const centered = browsed?.variant === selected.id ? browsed : { variant: selected.id, location: GenomeLocation.at(selected.chromosome, selected.position).withWidth(browsed?.location.width ?? startWidth) };
  if (centered !== browsed) setBrowsed(centered);
  const location = centered.location;
  const setLocation = (to: GenomeLocation) => setBrowsed({ variant: selected.id, location: to });
  const [view, setView] = useState<EffectsView>(defaultEffectsView);
  const inView = useMemo(() => variants.filter((record) => location.includes(record.chromosome, record.position)), [variants, location]);
  // The chosen variant stays selected while it's in view; otherwise the one nearest the center is, as on humanbase.io.
  const center = inView.includes(selected) ? selected : location.nearest(inView);
  const index = center ? variants.indexOf(center) : -1;
  const step = (by: number) => {
    const next = variants[index + by];
    if (next) onSelect(next.id);
  };
  const columns = useMemo(
    () =>
      inView.map((record) => {
        const variant = asVariant(record);
        return { key: record.id, name: `${variantLabel(variant)}, ${record.phenotype}`, position: record.position, href: GenomeLocation.at(record.chromosome, record.position).ucscUrl, effects: featureEffects(record, features) };
      }),
    [inView, features],
  );
  const label = center ? variantLabel(asVariant(center)) : '';

  return (
    <div className="deepsea-result">
      <VariantGenomeBrowser
        assembly="hg19"
        chromosome={selected.chromosome}
        position={selected.position}
        label={variantLabel(asVariant(selected))}
        location={location}
        tracks={tracks}
        onLocationChange={setLocation}
        {...(index > 0 && { onPreviousVariant: () => step(-1) })}
        {...(index < variants.length - 1 && { onNextVariant: () => step(1) })}
        engine={engine}
      />
      {center ? (
        <>
          <p className="deepsea-note">
            {center.phenotype}, {center.gene}, HGMD {center.id}. {count.format(inView.length)} {inView.length === 1 ? 'variant' : 'variants'} in view.
          </p>
          <EffectsCard
            label={label}
            effects={columns[inView.indexOf(center)]?.effects}
            failed={false}
            onRetry={() => undefined}
            scale={scale}
            threshold={sei.threshold}
            featureNoun={sei.featureNoun}
            featurePlural={sei.featurePlural}
            verb={sei.verb}
            choice={choice}
            scoreDocs={scoreDocs}
            view={view}
            onViewChange={setView}
            inView={{
              location,
              variants: columns,
              selected: inView.indexOf(center),
              onSelect,
              onMove: (bases) => setLocation(location.move(bases / location.width)),
            }}
          />
        </>
      ) : (
        <Alert tone="info" title="No HGMD variants in this range">
          Previous variant and Next variant jump to the nearest ones, or go back to the Heatmap to choose one.
        </Alert>
      )}
    </div>
  );
}
