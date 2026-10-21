import { useId, type ReactNode } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { DocsLink } from '../Jobs/DocsLink';
import { SearchField } from '../SearchField/SearchField';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Select, type SelectOption } from '../Select/Select';
import { Tabs } from '../Tabs/Tabs';
import './VariantEffects.css';

export type EffectsView = 'strongest' | 'heatmap' | 'all';

export { effectZScale } from './EffectScale';

export interface MolecularEffectsProps {
  /** The selected variant, such as chr1:109,817,590 G>T. */
  variant: string;
  view: EffectsView;
  onViewChange?: ((view: EffectsView) => void) | undefined;
  /** The third tab follows the score: All features, or All tissues for ExPecto. */
  allLabel?: string | undefined;
  children: ReactNode;
}

export function MolecularEffects({ variant, view, onViewChange, allLabel = 'All features', children }: MolecularEffectsProps) {
  const id = useId();
  const tabs = [
    { value: 'strongest', label: 'Strongest effects' },
    { value: 'heatmap', label: 'Heatmap' },
    { value: 'all', label: allLabel },
  ];
  return (
    <section className="molecular-effects" aria-labelledby={id}>
      <h3 id={id} className="molecular-effects-title">
        Molecular effects of {variant}
      </h3>
      <Tabs label={`Views of the effects of ${variant}`} tabs={tabs} value={view} onChange={(value) => onViewChange?.(value as EffectsView)}>
        {children}
      </Tabs>
    </section>
  );
}


const densities = [
  { value: 'full', label: 'Full' },
  { value: 'compact', label: 'Compact' },
];

export interface EffectsControlsProps {
  /** The first choice's label: Score, or Features where the choice is a feature set. */
  scoreLabel?: string | undefined;
  scores: readonly SelectOption[];
  score: string;
  onScore?: ((score: string) => void) | undefined;
  /** The score's documentation, linked beside the score, such as Score type documentation. */
  scoreDocs?: { label: string; href: string } | undefined;
  /** Shown when present: the threshold, cell types, search, grouping, rows and order. */
  threshold?: number | null | undefined;
  /** The threshold choices, weakest first; z-scores use 2, 3 and 5. */
  thresholdSteps?: readonly number[] | undefined;
  onThreshold?: ((threshold: number | null) => void) | undefined;
  cellTypes?: readonly SelectOption[] | undefined;
  /** Narrows the rows to one data resource, such as ExPecto's GTEx, Roadmap and ENCODE tissues. */
  resources?: readonly SelectOption[] | undefined;
  resource?: string | undefined;
  onResource?: ((resource: string) => void) | undefined;
  search?: string | undefined;
  onSearch?: ((text: string) => void) | undefined;
  groupByFeature?: boolean | undefined;
  onGroupByFeature?: ((group: boolean) => void) | undefined;
  /** The model's noun for its features, such as protein. */
  featureNoun?: string | undefined;
  /** What the search finds, such as "Find a tissue" for ExPecto. */
  searchLabel?: string | undefined;
  density?: 'full' | 'compact' | undefined;
  onDensity?: ((density: 'full' | 'compact') => void) | undefined;
  lowestFirst?: boolean | undefined;
  onLowestFirst?: ((lowest: boolean) => void) | undefined;
}

export function EffectsControls(props: EffectsControlsProps) {
  const { scoreLabel = 'Score', scores, score, onScore, scoreDocs, threshold, thresholdSteps = [2, 3, 5], onThreshold, cellTypes, resources, resource, onResource, search, onSearch, groupByFeature, onGroupByFeature, featureNoun = 'protein', searchLabel = 'Find a feature or cell type', density, onDensity, lowestFirst, onLowestFirst } = props;
  return (
    <div className="effects-controls">
      <Select label={scoreLabel} size="small" options={scores} value={score} {...(onScore && { onChange: onScore })} className="effects-score" />
      {scoreDocs && <DocsLink href={scoreDocs.href}>{scoreDocs.label}</DocsLink>}
      {resources?.[0] && <Select label="Resource" size="small" options={resources} value={resource ?? resources[0].value} {...(onResource && { onChange: onResource })} className="effects-resource" />}
      {threshold !== undefined && (
        <SegmentedControl
          label="Show effects of"
          size="small"
          segments={[...thresholdSteps.map((step) => ({ value: String(step), label: `${step} or more` })), { value: 'all', label: 'All' }]}
          value={threshold === null ? 'all' : String(threshold)}
          onChange={(value) => onThreshold?.(value === 'all' ? null : Number(value))}
        />
      )}
      {cellTypes?.[0] && <Select label="Cell type" size="small" options={cellTypes} defaultValue={cellTypes[0].value} className="effects-cells" />}
      {search !== undefined && (
        <SearchField label={searchLabel} placeholder={searchLabel} size="medium" value={search} onChange={(event) => onSearch?.(event.target.value)} className="effects-search" />
      )}
      {density !== undefined && <SegmentedControl label="View" size="small" segments={densities} value={density} onChange={(value) => onDensity?.(value as 'full' | 'compact')} />}
      {groupByFeature !== undefined && (
        <Checkbox label={`Group experiments by ${featureNoun}`} checked={groupByFeature} onChange={(event) => onGroupByFeature?.(event.target.checked)} />
      )}
      {lowestFirst !== undefined && <Checkbox label="Lowest first" checked={lowestFirst} onChange={(event) => onLowestFirst?.(event.target.checked)} />}
    </div>
  );
}
