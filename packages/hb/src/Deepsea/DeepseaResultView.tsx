import { featureEffects, GenomeLocation, useDeepseaVariants, useHumanbase, useViewPredictions, variantIdOf, variantScoreTypes, type DeepseaJob, type ScoreType, type VariantRow } from '@humanbase/data';
import {
  ActionMenu,
  Alert,
  byGenomePosition,
  DocsLink,
  expressionEffects,
  KeyLegend,
  ResultHeader,
  ResultLayout,
  SearchField,
  Select,
  sequenceClassEffects,
  sequenceClassLegend,
  Skeleton,
  VariantFocus,
  variantLabel,
  variantName,
  variantScore,
  VariantScorePlot,
  VariantsTable,
  zEffects,
  type EffectScale,
  type EffectsView,
  type PlotBy,
} from '@humanbase/ui';
import { useMemo, useState, type ReactNode } from 'react';
import { jobDateTime } from '../Jobs/JobPage';
import { deepseaFormLink } from './DeepseaForm';
import { EffectsCard } from './EffectsCard';
import { VariantGenomeBrowser } from './VariantGenomeBrowser';
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

const tableLabels: Record<string, string> = { dis: 'Disease impact', 'mean-evalue': 'Mean −log e', seqclass: 'Max class score' };
const shownRows = 9;
// As on humanbase.io, the browser opens on the selected variant with 50 kb either side.
const startWidth = 100_000;
const scoreDocsLabel = 'Score type documentation';
type ColorStyle = 'chr' | 'seqclass';
// humanbase.io's Plot style names, Manhattan first and by default.
const plotStyles = [
  { value: 'genome', label: 'Manhattan' },
  { value: 'rank', label: 'Score Rank' },
];
const colorStyles = [
  { value: 'chr', label: 'Chromosome' },
  { value: 'seqclass', label: 'Sequence class' },
];
const number = new Intl.NumberFormat('en-US');

function effectScaleOf(model: DeepseaJob['model']): EffectScale {
  if (model.id === 'sei') return sequenceClassEffects;
  return model.expecto ? expressionEffects : zEffects;
}

const scoreOptions = (types: readonly ScoreType[]) => types.map((type) => ({ value: type.short_name, label: type.name.replace('-log', '−log') }));
const matches = (variant: VariantRow, text: string) => `${variantLabel(variant)} ${variantName(variant)}`.toLowerCase().includes(text.trim().toLowerCase());

/** A finished Sei, Beluga or Seqweaver job: variant scores as a plot and table, then the selected variant's molecular effects. */
export function DeepseaResultView({ job, title, tools, variant: chosen, onVariantChange }: DeepseaResultViewProps) {
  const model = job.model;
  const { showsSamples } = useHumanbase();
  const { scoreTypes, variants, error, refetch } = useDeepseaVariants(job);
  const variantTypes = variantScoreTypes(model, scoreTypes ?? []);
  const featureTypes = (scoreTypes ?? []).filter((type) => type.level === 'FEATURE');
  const [scoreKey, setScoreKey] = useState<string>();
  const [plotBy, setPlotBy] = useState<PlotBy>('genome');
  const [colorStyle, setColorStyle] = useState<ColorStyle>('chr');
  const [effectsView, setEffectsView] = useState<EffectsView>('strongest');
  const [filter, setFilter] = useState('');
  const [showAll, setShowAll] = useState(false);
  const [picked, setPicked] = useState(chosen);
  const score = variantTypes.find((type) => type.short_name === scoreKey) ?? variantTypes[0];
  const ordered = useMemo(() => [...(variants ?? [])].sort(byGenomePosition), [variants]);
  const selected = ordered.find((row) => row.id === (picked ?? chosen)) ?? ordered[0];
  // A variant picked from the plot, table, heatmap or Previous and Next starts its effects afresh; one reached by moving the browser keeps them, so a drag carries on.
  const [effectsKey, setEffectsKey] = useState(chosen);
  const show = (id: string) => {
    setPicked(id);
    onVariantChange?.(id);
  };
  const select = (id: string) => {
    show(id);
    setEffectsKey(id);
  };
  // Selecting another variant centers the browser on it at the current zoom.
  const [view, setView] = useState<{ variant: string; location: GenomeLocation }>();
  const centered = selected && (view?.variant === selected.id ? view : { variant: selected.id, location: GenomeLocation.at(selected.chromosome, selected.position, job.assembly).withWidth(view?.location.width ?? startWidth) });
  if (centered && centered !== view) setView(centered);
  const location = centered?.location;
  // As on humanbase.io, moving the browser makes the variant nearest its center the selected one.
  const browse = (to: GenomeLocation) => {
    const nearest = to.nearest(ordered);
    const center = nearest && selected && nearest.chromosome === selected.chromosome && nearest.position === selected.position ? selected : nearest;
    setView({ variant: center?.id ?? selected?.id ?? '', location: to });
    if (center && center.id !== selected?.id) show(center.id);
  };
  const [featureKey, setFeatureKey] = useState<string>();
  const featureType = featureTypes.find((type) => type.short_name === featureKey) ?? featureTypes[0];
  const predictions = useViewPredictions(job, featureType?.short_name, location);

  const files = job.resultFiles;
  const header = (
    <ResultHeader
      crumbs={[{ label: 'Jobs', href: '/jobs/' }, { label: model.tool, href: deepseaFormLink(model.id) }, { label: title }]}
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
  // Sei variants name the sequence class they change most, so only Sei offers Color style.
  const hasClasses = ordered.some((row) => row.topClass);
  const byClass = hasClasses && colorStyle === 'seqclass';
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
              <DocsLink href={`${model.docsHref}#output`}>{scoreDocsLabel}</DocsLink>
              <Select label="Plot style" size="small" options={plotStyles} value={plotBy} onChange={(value) => setPlotBy(value as PlotBy)} />
              {hasClasses && <Select label="Color style" size="small" options={colorStyles} value={colorStyle} onChange={(value) => setColorStyle(value as ColorStyle)} />}
            </div>
            {byClass && <KeyLegend title="Sequence class" items={sequenceClassLegend} />}
            <VariantScorePlot
              variants={variants}
              score={{ key: score.short_name, label: score.name.replace('-log', '−log') }}
              by={plotBy}
              selected={selected?.id}
              onSelect={select}
              colorBy={byClass ? 'sequence-class' : 'chromosome'}
              summary={
                byClass
                  ? `${number.format(ordered.length)} variants, colored by the sequence class each changes most; the class is also in the table.`
                  : `${number.format(ordered.length)} variants, colored by chromosome; position also carries the chromosome.`
              }
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
            detail={`${variantName(selected)}, ${score.name.toLowerCase()} ${variantScore(selected, score.short_name)}`}
            hasPrevious={index > 0}
            hasNext={index < ordered.length - 1}
            onPrevious={() => step(-1)}
            onNext={() => step(1)}
          />
          {location && (
            <VariantGenomeBrowser
              assembly={job.assembly}
              chromosome={selected.chromosome}
              position={selected.position}
              label={variantLabel(selected)}
              location={location}
              onLocationChange={browse}
              {...(index > 0 && { onPreviousVariant: () => step(-1) })}
              {...(index < ordered.length - 1 && { onNextVariant: () => step(1) })}
            />
          )}
          {location && featureType && (
            <VariantEffectsCard
              key={effectsKey ?? ''}
              job={job}
              variant={selected}
              variants={ordered}
              location={location}
              predictions={predictions}
              featureTypes={featureTypes}
              type={featureType}
              onTypeChange={setFeatureKey}
              scoreKey={score.short_name}
              onSelect={select}
              {...(!showsSamples && { onMove: (bases: number) => browse(location.move(bases / location.width)) })}
              view={effectsView}
              onViewChange={setEffectsView}
            />
          )}
        </>
      )}
    </div>
  );
}

interface VariantEffectsCardProps {
  job: DeepseaJob;
  variant: VariantRow;
  /** Every variant of the job, which names the ones in view. */
  variants: readonly VariantRow[];
  location: GenomeLocation;
  predictions: ReturnType<typeof useViewPredictions>;
  featureTypes: readonly ScoreType[];
  type: ScoreType;
  onTypeChange: (key: string) => void;
  /** The page's variant score, which picks the variant a Compact heatmap column keeps. */
  scoreKey: string;
  onSelect: (id: string) => void;
  /** Moves the genome browser; left out when no browser is shown. */
  onMove?: ((bases: number) => void) | undefined;
  view: EffectsView;
  onViewChange: (view: EffectsView) => void;
}

/** The selected variant's effect on every feature, and every variant in the genome browser's view on the Heatmap tab, for the chosen feature-level score. */
function VariantEffectsCard({ job, variant, variants, location, predictions: { features, predictions, error, refetch }, featureTypes, type, onTypeChange, scoreKey, onSelect, onMove, view, onViewChange }: VariantEffectsCardProps) {
  const model = job.model;
  const label = variantLabel(variant);
  const byId = useMemo(() => new Map(variants.map((row) => [row.id, row])), [variants]);
  const inView = useMemo(
    () =>
      (predictions ?? []).flatMap((record) => {
        const row = byId.get(variantIdOf(record));
        if (!row) return [];
        return [{ key: row.id, name: variantLabel(row), position: row.position, href: GenomeLocation.at(row.chromosome, row.position, job.assembly).ucscUrl, effects: features ? featureEffects(record, features) : undefined, score: row.scores[scoreKey] }];
      }),
    [predictions, features, byId, job.assembly, scoreKey],
  );
  const selected = inView.findIndex((item) => item.key === variant.id);
  if (predictions && selected === -1) {
    return (
      <Alert tone="info" title={inView.length ? `No ${model.featureNoun} predictions for ${label}` : 'No variants in this range'}>
        Previous variant and Next variant jump to the nearest ones.
      </Alert>
    );
  }
  return (
    <EffectsCard
      label={label}
      view={view}
      onViewChange={onViewChange}
      inView={{ location, variants: inView, selected, onSelect, onMove }}
      reverseOrder={type.reverse_order}
      effects={inView[selected]?.effects}
      failed={Boolean(error)}
      onRetry={refetch}
      scale={effectScaleOf(model)}
      threshold={model.threshold}
      featureNoun={model.featureNoun}
      featurePlural={model.featurePlural}
      verb={model.verb}
      inCellTypes={!model.expecto}
      choice={{ label: 'Score', options: scoreOptions(featureTypes), value: type.short_name, onChange: onTypeChange, name: type.name }}
      scoreDocs={{ label: scoreDocsLabel, href: `${model.docsHref}#output` }}
    />
  );
}
