import { useDeepseaVariants, useFeatureEffects, type DeepseaJob, type ScoreType, type VariantRow } from '@humanbase/data';
import {
  ActionMenu,
  Alert,
  AllFeaturesPlot,
  byGenomePosition,
  EffectGroups,
  EffectsControls,
  EffectsHeatmap,
  expressionEffects,
  MolecularEffects,
  ResultHeader,
  ResultLayout,
  SearchField,
  SegmentedControl,
  Select,
  sequenceClassEffects,
  Skeleton,
  StrongestEffects,
  VariantFocus,
  variantLabel,
  VariantScorePlot,
  VariantsTable,
  zEffects,
  type EffectScale,
  type EffectsView,
  type PlotBy,
} from '@humanbase/ui';
import { useMemo, useState, type ReactNode } from 'react';
import { jobDateTime } from '../Jobs/JobPage';
import './Deepsea.css';

export interface DeepseaResultViewProps {
  job: DeepseaJob;
  title: string;
  /** Copy link and Rename. */
  tools: ReactNode;
  /** The selected variant's ID, when the page keeps it in the URL. */
  variant?: string | undefined;
  onVariantChange?: ((id: string) => void) | undefined;
}

const tableLabels: Record<string, string> = { dis: 'Disease impact', 'mean-evalue': 'Mean −log e', max_seqclass: 'Max class score' };
const shownRows = 9;
const heatmapRows = 20;
const number = new Intl.NumberFormat('en-US');

function effectScaleOf(model: DeepseaJob['model']): EffectScale {
  if (model.id === 'sei') return sequenceClassEffects;
  return model.expecto ? expressionEffects : zEffects;
}

const scoreOptions = (types: readonly ScoreType[]) => types.map((type) => ({ value: type.short_name, label: type.name.replace('-log', '−log') }));
const matches = (variant: VariantRow, text: string) => `${variantLabel(variant)} ${variant.name}`.toLowerCase().includes(text.trim().toLowerCase());

/** A finished Sei, Beluga or Seqweaver job: variant scores as a plot and table, then the selected variant's molecular effects. */
export function DeepseaResultView({ job, title, tools, variant: chosen, onVariantChange }: DeepseaResultViewProps) {
  const model = job.model;
  const { scoreTypes, variants, error, refetch } = useDeepseaVariants(job);
  const variantTypes = (scoreTypes ?? []).filter((type) => type.level === 'VARIANT');
  const featureTypes = (scoreTypes ?? []).filter((type) => type.level === 'FEATURE');
  const [scoreKey, setScoreKey] = useState<string>();
  const [plotBy, setPlotBy] = useState<PlotBy>('genome');
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [picked, setPicked] = useState(chosen);
  const score = variantTypes.find((type) => type.short_name === scoreKey) ?? variantTypes[0];
  const ordered = useMemo(() => [...(variants ?? [])].sort(byGenomePosition), [variants]);
  const selected = ordered.find((row) => row.id === (picked ?? chosen)) ?? ordered[0];
  const select = (id: string) => {
    setPicked(id);
    onVariantChange?.(id);
  };

  const files = job.resultFiles;
  const header = (
    <ResultHeader
      crumbs={[{ label: 'Jobs', href: '/jobs/' }, { label: model.tool, href: `/${model.id}/` }, { label: title }]}
      title={title}
      context={[
        { name: 'Model', value: model.kind },
        { name: 'Genome', value: job.genome },
        { name: 'Variants', value: variants ? number.format(variants.length) : '…' },
        { name: 'Submitted', value: jobDateTime.format(job.created) },
      ]}
      settingsLabel="Job actions"
      settings={
        <>
          {tools}
          {files.length > 0 && <ActionMenu label="Download results" trigger="text" items={files.map((file) => ({ label: file.name, description: file.format, icon: 'download', onSelect: () => window.open(file.url, '_blank', 'noopener') }))} />}
        </>
      }
    />
  );

  if (error) {
    return (
      <ResultLayout
        header={header}
        mainLabel="Variant scores"
        main={
          <Alert tone="error" title="The results couldn’t load" action={{ label: 'Try again', onSelect: refetch }}>
            The job finished, but its scores didn’t arrive. Trying again is safe.
          </Alert>
        }
      />
    );
  }

  if (!variants || !score) {
    return (
      <ResultLayout
        header={header}
        mainLabel="Variant scores"
        main={
          <div className="deepsea-loading" aria-busy="true">
            <Skeleton width="100%" height="320px" />
          </div>
        }
      />
    );
  }

  const tableScores = variantTypes.map((type) => ({ key: type.short_name, label: tableLabels[type.short_name] ?? type.name }));
  const filtered = ordered.filter((row) => matches(row, filter));
  const byScore = [...filtered].sort((a, b) => (b.scores[score.short_name] ?? 0) - (a.scores[score.short_name] ?? 0));
  const index = selected ? ordered.indexOf(selected) : -1;
  const step = (by: number) => {
    const next = ordered[index + by];
    if (next) select(next.id);
  };

  return (
    <div className="deepsea-result">
      <ResultLayout
        header={header}
        mainLabel={`Variants plotted by ${score.name.toLowerCase()}`}
        main={
          <div className="deepsea-plot">
            <div className="deepsea-plot-controls">
              <Select label="Score" size="small" options={scoreOptions(variantTypes)} value={score.short_name} onChange={setScoreKey} />
              <SegmentedControl
                label="Plot by"
                size="small"
                value={plotBy}
                onChange={(value) => setPlotBy(value as PlotBy)}
                segments={[
                  { value: 'genome', label: 'Genome position' },
                  { value: 'rank', label: 'Rank' },
                ]}
              />
            </div>
            <VariantScorePlot
              variants={ordered}
              score={{ key: score.short_name, label: score.name.replace('-log', '−log') }}
              by={plotBy}
              selected={selected?.id}
              onSelect={select}
              summary={`${number.format(ordered.length)} variants. Chromosomes alternate dark and light grey; position carries the chromosome, so color doesn’t have to.`}
            />
          </div>
        }
        companionLabel="Variants"
        companion={
          <div className="deepsea-variants">
            <SearchField label="Filter by name or position" placeholder="Filter by name or position" size="medium" value={filter} onChange={(event) => setFilter(event.target.value)} />
            <VariantsTable
              variants={byScore}
              scores={tableScores}
              sortBy={score.short_name}
              selected={selected?.id}
              onSelect={select}
              {...(byScore.length > shownRows && !showAll ? { limit: shownRows, onShowAll: () => setShowAll(true) } : {})}
            />
          </div>
        }
      />
      {selected && (
        <>
          <VariantFocus
            label={variantLabel(selected)}
            detail={`${selected.name}, ${score.name.toLowerCase()} ${(selected.scores[score.short_name] ?? 0).toFixed(2)}`}
            hasPrevious={index > 0}
            hasNext={index < ordered.length - 1}
            onPrevious={() => step(-1)}
            onNext={() => step(1)}
          />
          <VariantEffectsCard key={selected.id} job={job} variant={selected} featureTypes={featureTypes} />
        </>
      )}
    </div>
  );
}

interface VariantEffectsCardProps {
  job: DeepseaJob;
  variant: VariantRow;
  featureTypes: readonly ScoreType[];
}

/** The selected variant's effect on every feature: Strongest effects, Heatmap and All features. */
function VariantEffectsCard({ job, variant, featureTypes }: VariantEffectsCardProps) {
  const model = job.model;
  const scale = effectScaleOf(model);
  const [typeKey, setTypeKey] = useState<string>();
  const type = featureTypes.find((item) => item.short_name === typeKey) ?? featureTypes[0];
  const [view, setView] = useState<EffectsView>('strongest');
  const [threshold, setThreshold] = useState<number | null>(model.threshold);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<readonly string[]>([]);
  const [limit, setLimit] = useState(14);
  const [rows, setRows] = useState(heatmapRows);
  const [density, setDensity] = useState<'full' | 'compact'>('full');
  const [lowestFirst, setLowestFirst] = useState(false);
  const { effects, isPending, error, refetch } = useFeatureEffects(job, type?.short_name, variant);
  const label = variantLabel(variant);
  const found = useMemo(() => (effects ?? []).filter((effect) => `${effect.feature} ${effect.context}`.toLowerCase().includes(search.trim().toLowerCase())), [effects, search]);
  const groups = useMemo(() => new EffectGroups(found, scale), [found, scale]);
  const all = useMemo(() => new EffectGroups(effects ?? [], scale), [effects, scale]);
  if (!type) return null;

  const content = error ? (
    <Alert tone="error" title="These effects couldn’t load" action={{ label: 'Try again', onSelect: refetch }}>
      Humanbase didn’t send this variant’s feature scores. Trying again is safe.
    </Alert>
  ) : isPending || !effects ? (
    <Skeleton width="100%" height="240px" />
  ) : view === 'strongest' ? (
    <StrongestEffects
      effects={groups}
      counts={all.counts()}
      threshold={threshold}
      expanded={expanded}
      onToggle={(feature) => setExpanded((open) => (open.includes(feature) ? open.filter((item) => item !== feature) : [...open, feature]))}
      limit={limit}
      onShowMore={() => setLimit((shown) => shown + 14)}
      plural={model.featurePlural}
      verb={model.verb}
    />
  ) : view === 'heatmap' ? (
    <EffectsHeatmap
      variants={[label]}
      rows={[...found].sort((a, b) => (lowestFirst ? a.value - b.value : b.value - a.value)).slice(0, rows).map((experiment) => ({ experiment, values: [experiment.value] }))}
      total={effects.length}
      density={density}
      lowestFirst={lowestFirst}
      scale={scale}
      {...(found.length > rows ? { onShowMore: () => setRows((shown) => shown + heatmapRows) } : {})}
    />
  ) : (
    <AllFeaturesPlot
      values={effects.map((effect) => effect.value)}
      labels={[...effects].sort((a, b) => b.value - a.value).slice(0, 5).map((effect) => ({ label: effect.label, value: effect.value }))}
      scale={scale}
      summary={`${type.name} of all ${number.format(effects.length)} ${model.featurePlural} for ${label}, lowest to highest.`}
    />
  );

  return (
    <MolecularEffects variant={label} view={view} onViewChange={setView}>
      <EffectsControls
        scores={scoreOptions(featureTypes)}
        score={type.short_name}
        onScore={setTypeKey}
        {...(view === 'strongest' ? { threshold, onThreshold: setThreshold, thresholdSteps: [scale.bins.weak, scale.bins.moderate, scale.bins.strong] } : {})}
        search={search}
        onSearch={setSearch}
        featureNoun={model.featureNoun}
        {...(view === 'heatmap' ? { density, onDensity: setDensity, lowestFirst, onLowestFirst: setLowestFirst } : {})}
      />
      {content}
      {effects && search && found.length === 0 && (
        <p className="deepsea-note" role="status">
          No features match “{search}” for this variant. Search by cell type or feature, such as {effects[0]?.cell ?? 'K562'}.
        </p>
      )}
    </MolecularEffects>
  );
}
