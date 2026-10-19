import { useId, type ReactNode } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import type { ScaleSpec } from '../Heatmap/ScoreScale';
import { SearchField } from '../SearchField/SearchField';
import { SegmentedControl } from '../SegmentedControl/SegmentedControl';
import { Select, type SelectOption } from '../Select/Select';
import { Tabs } from '../Tabs/Tabs';
import './VariantEffects.css';

export type EffectsView = 'strongest' | 'heatmap' | 'all';

/** The z-score legend every variant feature uses: edges at |z| 2, 3 and 5. */
export const effectZScale: ScaleSpec = { title: 'z-score', kind: 'diverging', edges: [-5, -3, -2, 2, 3, 5], words: ['Lowers', 'Raises'] };

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

const thresholds = [
  { value: '2', label: '2 or more' },
  { value: '3', label: '3 or more' },
  { value: '5', label: '5 or more' },
  { value: 'all', label: 'All' },
];

const densities = [
  { value: 'full', label: 'Full' },
  { value: 'compact', label: 'Compact' },
];

export interface EffectsControlsProps {
  scores: readonly SelectOption[];
  score: string;
  onScore?: ((score: string) => void) | undefined;
  /** Shown when present: the threshold, cell types, search, grouping, rows and order. */
  threshold?: number | null | undefined;
  onThreshold?: ((threshold: number | null) => void) | undefined;
  cellTypes?: readonly SelectOption[] | undefined;
  search?: string | undefined;
  onSearch?: ((text: string) => void) | undefined;
  groupByFeature?: boolean | undefined;
  onGroupByFeature?: ((group: boolean) => void) | undefined;
  /** The model's noun for its features, such as protein. */
  featureNoun?: string | undefined;
  density?: 'full' | 'compact' | undefined;
  onDensity?: ((density: 'full' | 'compact') => void) | undefined;
  lowestFirst?: boolean | undefined;
  onLowestFirst?: ((lowest: boolean) => void) | undefined;
}

export function EffectsControls(props: EffectsControlsProps) {
  const { scores, score, onScore, threshold, onThreshold, cellTypes, search, onSearch, groupByFeature, onGroupByFeature, featureNoun = 'protein', density, onDensity, lowestFirst, onLowestFirst } = props;
  return (
    <div className="effects-controls">
      <Select label="Score" size="small" options={scores} value={score} {...(onScore && { onChange: onScore })} className="effects-score" />
      {threshold !== undefined && (
        <SegmentedControl
          label="Show effects of"
          size="small"
          segments={thresholds}
          value={threshold === null ? 'all' : String(threshold)}
          onChange={(value) => onThreshold?.(value === 'all' ? null : Number(value))}
        />
      )}
      {cellTypes?.[0] && <Select label="Cell type" size="small" options={cellTypes} defaultValue={cellTypes[0].value} className="effects-cells" />}
      {search !== undefined && (
        <SearchField label="Find a feature or cell type" placeholder="Find a feature or cell type" size="medium" value={search} onChange={(event) => onSearch?.(event.target.value)} className="effects-search" />
      )}
      {density !== undefined && <SegmentedControl label="Rows" size="small" segments={densities} value={density} onChange={(value) => onDensity?.(value as 'full' | 'compact')} />}
      {groupByFeature !== undefined && (
        <Checkbox label={`Group experiments by ${featureNoun}`} checked={groupByFeature} onChange={(event) => onGroupByFeature?.(event.target.checked)} />
      )}
      {lowestFirst !== undefined && <Checkbox label="Lowest first" checked={lowestFirst} onChange={(event) => onLowestFirst?.(event.target.checked)} />}
    </div>
  );
}
