import { GenomeLocation, useDeepseaVariants, useFeatureEffects, variantScoreTypes, type DeepseaJob, type ScoreType, type VariantRow } from '@humanbase/data';
import {
  ActionMenu,
  Alert,
  byGenomePosition,
  expressionEffects,
  ResultHeader,
  ResultLayout,
  SearchField,
  SegmentedControl,
  Select,
  sequenceClassEffects,
  Skeleton,
  VariantFocus,
  variantLabel,
  variantName,
  VariantScorePlot,
  VariantsTable,
  zEffects,
  type EffectScale,
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
  const { scoreTypes, variants, error, refetch } = useDeepseaVariants(job);
  const variantTypes = variantScoreTypes(model, scoreTypes ?? []);
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
            detail={`${variantName(selected)}, ${score.name.toLowerCase()} ${(selected.scores[score.short_name] ?? 0).toFixed(2)}`}
            hasPrevious={index > 0}
            hasNext={index < ordered.length - 1}
            onPrevious={() => step(-1)}
            onNext={() => step(1)}
          />
          <VariantGenomeBrowser
            assembly={job.assembly}
            chromosome={selected.chromosome}
            position={selected.position}
            label={variantLabel(selected)}
            {...(index > 0 && { onPreviousVariant: () => step(-1) })}
            {...(index < ordered.length - 1 && { onNextVariant: () => step(1) })}
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

/** The selected variant's effect on every feature, for the chosen feature-level score. */
function VariantEffectsCard({ job, variant, featureTypes }: VariantEffectsCardProps) {
  const model = job.model;
  const [typeKey, setTypeKey] = useState<string>();
  const type = featureTypes.find((item) => item.short_name === typeKey) ?? featureTypes[0];
  const { effects, error, refetch } = useFeatureEffects(job, type?.short_name, variant);
  if (!type) return null;
  return (
    <EffectsCard
      label={variantLabel(variant)}
      href={GenomeLocation.at(variant.chromosome, variant.position, job.assembly).ucscUrl}
      effects={effects}
      failed={Boolean(error)}
      onRetry={refetch}
      scale={effectScaleOf(model)}
      threshold={model.threshold}
      featureNoun={model.featureNoun}
      featurePlural={model.featurePlural}
      verb={model.verb}
      inCellTypes={!model.expecto}
      choice={{ label: 'Score', options: scoreOptions(featureTypes), value: type.short_name, onChange: setTypeKey, name: type.name }}
    />
  );
}
