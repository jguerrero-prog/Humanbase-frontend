import type { FeatureEffect } from '@humanbase/data';
import { Alert, AllFeaturesPlot, EffectGroups, EffectsControls, EffectsHeatmap, MolecularEffects, Skeleton, StrongestEffects, type EffectScale, type EffectsView, type SelectOption } from '@humanbase/ui';
import { useMemo, useState, type ReactNode } from 'react';
import './Deepsea.css';

const heatmapRows = 20;
const number = new Intl.NumberFormat('en-US');

export interface EffectsCardProps {
  /** The selected variant, such as chr1:109,817,590 G>T. */
  label: string;
  /** Undefined while they load. */
  effects: readonly FeatureEffect[] | undefined;
  failed: boolean;
  onRetry: () => void;
  scale: EffectScale;
  /** Strongest effects opens at this threshold. */
  threshold: number;
  featureNoun: string;
  featurePlural: string;
  verb: string;
  /** The score or feature set the effects are for, and its choices. */
  choice: { label: string; options: readonly SelectOption[]; value: string; onChange: (value: string) => void; name: string };
  /** Replaces the one-variant heatmap, such as a heatmap of every variant in a genome browser's range. */
  heatmap?: ReactNode;
}

/** A variant's effect on every feature: Strongest effects, Heatmap and All features. */
export function EffectsCard({ label, effects, failed, onRetry, scale, threshold: start, featureNoun, featurePlural, verb, choice, heatmap }: EffectsCardProps) {
  const [view, setView] = useState<EffectsView>('strongest');
  const [threshold, setThreshold] = useState<number | null>(start);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<readonly string[]>([]);
  const [limit, setLimit] = useState(14);
  const [rows, setRows] = useState(heatmapRows);
  const [density, setDensity] = useState<'full' | 'compact'>('full');
  const [lowestFirst, setLowestFirst] = useState(false);
  const found = useMemo(() => (effects ?? []).filter((effect) => `${effect.feature} ${effect.context}`.toLowerCase().includes(search.trim().toLowerCase())), [effects, search]);
  const groups = useMemo(() => new EffectGroups(found, scale), [found, scale]);
  const all = useMemo(() => new EffectGroups(effects ?? [], scale), [effects, scale]);
  const ownHeatmap = view === 'heatmap' && !heatmap;

  const content = failed ? (
    <Alert tone="error" title="These effects couldn’t load" action={{ label: 'Try again', onSelect: onRetry }}>
      Humanbase didn’t send this variant’s feature scores. Trying again is safe.
    </Alert>
  ) : !effects ? (
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
      plural={featurePlural}
      verb={verb}
    />
  ) : view === 'heatmap' ? (
    (heatmap ?? (
      <EffectsHeatmap
        variants={[label]}
        rows={[...found].sort((a, b) => (lowestFirst ? a.value - b.value : b.value - a.value)).slice(0, rows).map((experiment) => ({ experiment, values: [experiment.value] }))}
        total={effects.length}
        density={density}
        lowestFirst={lowestFirst}
        scale={scale}
        {...(found.length > rows ? { onShowMore: () => setRows((shown) => shown + heatmapRows) } : {})}
      />
    ))
  ) : (
    <AllFeaturesPlot
      values={effects.map((effect) => effect.value)}
      labels={[...effects].sort((a, b) => b.value - a.value).slice(0, 5).map((effect) => ({ label: effect.label, value: effect.value }))}
      scale={scale}
      summary={`${choice.name} of all ${number.format(effects.length)} ${featurePlural} for ${label}, lowest to highest.`}
    />
  );

  return (
    <MolecularEffects variant={label} view={view} onViewChange={setView}>
      <EffectsControls
        scoreLabel={choice.label}
        scores={choice.options}
        score={choice.value}
        onScore={choice.onChange}
        {...(view === 'strongest' ? { threshold, onThreshold: setThreshold, thresholdSteps: [scale.bins.weak, scale.bins.moderate, scale.bins.strong] } : {})}
        {...(view !== 'heatmap' || ownHeatmap ? { search, onSearch: setSearch } : {})}
        featureNoun={featureNoun}
        {...(ownHeatmap ? { density, onDensity: setDensity, lowestFirst, onLowestFirst: setLowestFirst } : {})}
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
