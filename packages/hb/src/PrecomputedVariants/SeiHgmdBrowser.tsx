import { GenomeLocation, SeiHgmdService, useSeiHgmd, variantIdOf, type FeaturesRecord, type HgmdOrder, type HgmdVariantRecord } from '@humanbase/data';
import type { GenomeBrowserEngineFactory } from '@humanbase/genome';
import { Alert, Heatmap, ScoreScale, Select, Skeleton } from '@humanbase/ui';
import { useMemo } from 'react';
import { PrecomputedVariantBrowser, type PrecomputedVariantState } from './PrecomputedVariantBrowser';
import { seiHgmd } from './seiHgmd';
import '../Deepsea/Deepsea.css';

export type SeiHgmdView = 'heatmap' | 'genome';

/** What the page keeps in its URL: the genome browser's, plus the open view and the heatmap's order. */
export interface SeiHgmdState extends PrecomputedVariantState {
  view: SeiHgmdView;
  order: HgmdOrder;
}

export interface SeiHgmdBrowserProps {
  state: SeiHgmdState;
  onStateChange: (next: Partial<SeiHgmdState>) => void;
  engine?: GenomeBrowserEngineFactory | undefined;
}

const views = [
  { value: 'heatmap', label: 'Heatmap' },
  { value: 'genome', label: 'Genome browser' },
];
const scale = seiHgmd.scale;
const scoreName = scale.legend.title;
const count = new Intl.NumberFormat('en-US');
// As on humanbase.io, a variant chosen on the heatmap opens 50 kb either side of it.
const openWidth = 100_000;

/** Sei's HGMD variants: every variant on a heatmap, sortable as on humanbase.io, beside the shared genome browser of precomputed variants. */
export function SeiHgmdBrowser({ state, onStateChange, engine }: SeiHgmdBrowserProps) {
  const open = (record: HgmdVariantRecord) => onStateChange({ view: 'genome', variant: variantIdOf(record), location: GenomeLocation.at(record.chromosome, record.position).withWidth(openWidth).format() });
  return (
    <PrecomputedVariantBrowser
      set={seiHgmd}
      state={state}
      onStateChange={onStateChange}
      engine={engine}
      views={{
        tabs: views,
        value: state.view,
        onChange: (view) => onStateChange({ view: view as SeiHgmdView }),
        content: state.view === 'heatmap' ? { label: 'Sequence class scores of every variant', view: <HgmdHeatmap order={state.order} onOrderChange={(order) => onStateChange({ order })} onOpen={open} /> } : undefined,
      }}
    />
  );
}

interface HgmdHeatmapProps {
  order: HgmdOrder;
  onOrderChange: (order: HgmdOrder) => void;
  onOpen: (record: HgmdVariantRecord) => void;
}

const orderNames: Record<HgmdOrder, string> = { default: 'in the dataset’s order', disease: 'by disease name', position: 'by genome position' };

function HgmdHeatmap({ order, onOrderChange, onOpen }: HgmdHeatmapProps) {
  const { features, variants, error, refetch } = useSeiHgmd();
  const sorted = useMemo(() => SeiHgmdService.sorted(variants ?? [], order), [variants, order]);
  if (error) {
    return (
      <Alert tone="error" title="The HGMD variants couldn’t load" action={{ label: 'Try again', onSelect: refetch }}>
        Humanbase didn’t answer. Trying again is safe.
      </Alert>
    );
  }
  if (!variants || !features) return <Skeleton width="100%" height="480px" />;
  return (
    <div className="deepsea-plot">
      <div className="deepsea-plot-controls">
        <Select label="Sort variants by" size="small" options={SeiHgmdService.orders} value={order} onChange={(value) => onOrderChange(value as HgmdOrder)} />
      </div>
      <VariantsHeatmap variants={sorted} features={features} order={order} onOpen={onOpen} />
    </div>
  );
}

interface VariantsHeatmapProps {
  variants: readonly HgmdVariantRecord[];
  features: FeaturesRecord;
  order: HgmdOrder;
  onOpen: (record: HgmdVariantRecord) => void;
}

// One row per variant named as humanbase.io names it; the tooltip adds its gene and position, as humanbase.io's does.
function VariantsHeatmap({ variants, features, order, onOpen }: VariantsHeatmapProps) {
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
      onRowSelect={(row) => {
        const record = variants[row];
        if (record) onOpen(record);
      }}
    />
  );
}
