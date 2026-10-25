import type { FeatureEffect } from '@humanbase/data';
import { Alert, AllFeaturesPlot, defaultEffectsView, EffectGroups, EffectsControls, MolecularEffects, Skeleton, StrongestEffects, type EffectScale, type EffectsView, type SelectOption } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import { InViewHeatmap, type InViewHeatmapProps } from './InViewHeatmap';
import './Deepsea.css';

const heatmapRows = 20;
const allResources = 'all';
const resourceOrder = ['GTEx', 'Roadmap', 'ENCODE'];
const number = new Intl.NumberFormat('en-US');
const signed = (value: number) => String(value).replace('-', '−');

export interface EffectsCardProps {
  /** The selected variant, such as chr1:109,817,590 G>T. */
  label: string;
  /** The card's name, Molecular effects unless the model's paper names them otherwise. */
  heading?: string | undefined;
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
  /** Where features aren't measured in cell types, such as ExPecto's tissues, the search says so. */
  inCellTypes?: boolean;
  /** The score or feature set the effects are for, and its choices. */
  choice: { label: string; options: readonly SelectOption[]; value: string; onChange: (value: string) => void; name: string };
  /** The score's documentation, such as Score type documentation. */
  scoreDocs?: { label: string; href: string } | undefined;
  /** Every variant in the genome browser's view, for the Heatmap tab; selected is the center one, whose effects these are. */
  inView: Pick<InViewHeatmapProps, 'location' | 'variants' | 'selected' | 'onSelect' | 'onMove'>;
  /** The score ranks smallest first, as humanbase.io's score types with reverse_order do, such as e-value. */
  reverseOrder?: boolean | undefined;
  /** The open tab, kept by the page so it survives choosing another variant. */
  view?: EffectsView | undefined;
  onViewChange?: ((view: EffectsView) => void) | undefined;
}

const rank = (resource: string) => {
  const index = resourceOrder.indexOf(resource);
  return index === -1 ? resourceOrder.length : index;
};

/** A variant's effect on every feature: Strongest effects, Heatmap and All features. */
export function EffectsCard({ label, heading, effects, failed, onRetry, scale, threshold: start, featureNoun, featurePlural, verb, inCellTypes = true, choice, scoreDocs, inView, reverseOrder = false, view: keptView, onViewChange }: EffectsCardProps) {
  const [ownView, setOwnView] = useState<EffectsView>(defaultEffectsView);
  // A score without strength bins has no Strongest effects, so it shows the Heatmap; the kept view returns with a binned score.
  const strongest = Boolean(scale.bins);
  const chosen = keptView ?? ownView;
  const view = chosen === 'strongest' && !strongest ? 'heatmap' : chosen;
  const setView = onViewChange ?? setOwnView;
  const [threshold, setThreshold] = useState<number | null>(start);
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<readonly string[]>([]);
  const [limit, setLimit] = useState(14);
  const [rows, setRows] = useState(heatmapRows);
  const [density, setDensity] = useState<'full' | 'compact'>('full');
  const [lowestFirst, setLowestFirst] = useState(false);
  const [resource, setResource] = useState(allResources);
  // Tissues are labelled by resource rather than cell type, so only those results get the Resource filter.
  const resources = useMemo(() => (inCellTypes ? [] : [...new Set((effects ?? []).map((effect) => effect.cell).filter(Boolean))].sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))), [effects, inCellTypes]);
  const inResource = useMemo(() => (effects ?? []).filter((effect) => resource === allResources || effect.cell === resource), [effects, resource]);
  const found = useMemo(() => inResource.filter((effect) => `${effect.feature} ${effect.context}`.toLowerCase().includes(search.trim().toLowerCase())), [inResource, search]);
  const groups = useMemo(() => new EffectGroups(found, scale), [found, scale]);
  const all = useMemo(() => new EffectGroups(inResource, scale), [inResource, scale]);
  const allLabel = inCellTypes ? 'All features' : `All ${featurePlural}`;
  const [quietLow, quietHigh] = scale.insignificant ?? [0, 0];
  const plotted = scale.insignificant ? inResource.filter((effect) => effect.value < quietLow || effect.value > quietHigh) : inResource;
  const named = [...plotted].sort((a, b) => (scale.reversed ? a.value - b.value : b.value - a.value)).slice(0, 5);
  const among = `${resource === allResources ? '' : `${resource} `}${featurePlural}`;
  const plotSummary = scale.insignificant
    ? `${choice.name} of the ${number.format(plotted.length)} of ${number.format(inResource.length)} ${among} outside ${signed(quietLow)} to ${signed(quietHigh)}, where values aren’t significant, for ${label}, lowest to highest.`
    : `${choice.name} of all ${number.format(inResource.length)} ${among} for ${label}, lowest to highest.`;

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
      noun={featureNoun}
      plural={featurePlural}
      allLabel={allLabel}
      verb={verb}
    />
  ) : view === 'heatmap' ? (
    <InViewHeatmap
      {...inView}
      shown={found}
      limit={rows}
      reversed={lowestFirst !== reverseOrder}
      compact={density === 'compact'}
      scale={scale}
      scoreName={choice.name}
      featurePlural={featurePlural}
      onShowMore={() => setRows((shown) => shown + heatmapRows)}
    />
  ) : (
    <AllFeaturesPlot values={plotted.map((effect) => effect.value)} labels={named.map((effect) => ({ label: effect.label, value: effect.value }))} scale={scale} summary={plotSummary} />
  );

  return (
    <MolecularEffects variant={label} view={view} onViewChange={setView} allLabel={allLabel} heading={heading} strongest={strongest}>
      <EffectsControls
        scoreLabel={choice.label}
        scores={choice.options}
        score={choice.value}
        onScore={choice.onChange}
        scoreDocs={scoreDocs}
        {...(view === 'strongest' && scale.bins ? { threshold, onThreshold: setThreshold, thresholdSteps: [scale.bins.weak, scale.bins.moderate, scale.bins.strong] } : {})}
        search={search}
        onSearch={setSearch}
        {...(resources.length > 1 ? { resources: [{ value: allResources, label: 'All resources' }, ...resources.map((name) => ({ value: name, label: name }))], resource, onResource: setResource } : {})}
        featureNoun={featureNoun}
        searchLabel={inCellTypes ? `Find a ${featureNoun} or cell type` : `Find a ${featureNoun}`}
        {...(view === 'heatmap' ? { density, onDensity: setDensity, lowestFirst, onLowestFirst: setLowestFirst } : {})}
      />
      {content}
      {effects && search && found.length === 0 && (
        <p className="deepsea-note" role="status">
          No {featurePlural} match “{search}” for this variant. {inCellTypes ? `Search by cell type or ${featureNoun}, such as ${effects[0]?.cell ?? 'K562'}.` : `Search by ${featureNoun} or resource, such as ${effects[0]?.feature ?? 'Spleen'}.`}
        </p>
      )}
    </MolecularEffects>
  );
}
