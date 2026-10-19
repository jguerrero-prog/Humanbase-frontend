import { useMemo, type CSSProperties } from 'react';
import { Button } from '../Button/Button';
import { EmptyState } from '../EmptyState/EmptyState';
import { Icon } from '../Icon/Icon';
import { LegendStepped } from '../Heatmap/LegendStepped';
import { ScoreScale } from '../Heatmap/ScoreScale';
import { EffectGroups, type EffectExperiment, type EffectGroup, type StrengthCounts } from './EffectGroups';
import { effectZScale } from './MolecularEffects';
import './VariantEffects.css';

export interface StrongestEffectsProps {
  effects: EffectGroups;
  /** Counts over every feature, when the list only holds the strongest ones. */
  counts?: StrengthCounts | undefined;
  threshold: number | null;
  /** Features whose experiments are listed under them. */
  expanded?: readonly string[] | undefined;
  onToggle?: ((feature: string) => void) | undefined;
  /** Groups shown before Show more. */
  limit?: number | undefined;
  onShowMore?: (() => void) | undefined;
  /** The model's nouns, such as proteins and binding. */
  plural?: string | undefined;
  verb?: string | undefined;
}

const cut = 10;
const axisTicks = [0, 2, 3, 5, 10];
const scale = new ScoreScale(effectZScale);
const one = (value: number) => value.toFixed(1).replace('-', '−');
const share = (value: number) => `${(Math.min(Math.abs(value), cut) / cut) * 100}%`;

export function StrongestEffects({ effects, counts, threshold, expanded = [], onToggle, limit = 14, onShowMore, plural = 'proteins', verb = 'binding' }: StrongestEffectsProps) {
  const shown = useMemo(() => effects.atLeast(threshold), [effects, threshold]);
  const tally = counts ?? effects.counts();
  const raises = shown.groups('raises');
  const lowers = shown.groups('lowers');
  const lowest = threshold ?? 0;
  const stats: [number, string][] = [
    [tally.strong, 'strong, z 5 or more'],
    [tally.moderate, 'moderate, 3 to 5'],
    [tally.weak, 'weak, 2 to 3'],
    [tally.lowered, 'lowered by 2 or more'],
  ];

  return (
    <div className="strongest-effects">
      <ul className="effects-summary">
        {stats.map(([count, label]) => (
          <li key={label}>
            <strong>{count === 0 ? 'None' : count}</strong> <span>{label}</span>
          </li>
        ))}
      </ul>
      <LegendStepped spec={effectZScale} className="effects-legend" />
      <div className="effects-directions">
        <EffectColumn title={`Raises ${verb}, ${raises.length} ${plural}`} groups={raises} expanded={expanded} onToggle={onToggle} limit={limit} onShowMore={onShowMore} plural={plural} />
        <section className="effects-column effects-lowers" aria-label={`Lowers ${verb}`}>
          <h4 className="effects-column-title">Lowers {verb}</h4>
          {lowers.length === 0 ? (
            <EmptyState
              title={`No feature is lowered by ${lowest || 2} or more`}
              text="For this variant, the lowest scores sit just below 0 (see All features). Choose All to list them anyway."
            />
          ) : (
            <EffectList groups={lowers} expanded={expanded} onToggle={onToggle} />
          )}
        </section>
      </div>
    </div>
  );
}

interface EffectColumnProps {
  title: string;
  groups: EffectGroup[];
  expanded: readonly string[];
  onToggle?: ((feature: string) => void) | undefined;
  limit: number;
  onShowMore?: (() => void) | undefined;
  plural: string;
}

function EffectColumn({ title, groups, expanded, onToggle, limit, onShowMore, plural }: EffectColumnProps) {
  const hidden = groups.length - limit;
  return (
    <section className="effects-column" aria-label={title}>
      <h4 className="effects-column-title">{title}</h4>
      <div className="effects-axis" aria-hidden="true">
        <span>z-score</span>
        <span className="effects-axis-scale">
          {axisTicks.map((tick) => (
            <span key={tick} style={{ insetInlineStart: share(tick) } as CSSProperties}>
              {tick}
            </span>
          ))}
        </span>
        <span>cut at {cut}</span>
      </div>
      <EffectList groups={groups.slice(0, limit)} expanded={expanded} onToggle={onToggle} />
      {hidden > 0 && (
        <Button variant="ghost" size="small" onClick={onShowMore}>
          Show {hidden} more {plural}
        </Button>
      )}
    </section>
  );
}

function EffectList({ groups, expanded, onToggle }: { groups: EffectGroup[]; expanded: readonly string[]; onToggle?: ((feature: string) => void) | undefined }) {
  return (
    <ol className="effects-list">
      {groups.map((group) => {
        const several = group.experiments.length > 1;
        const open = several && expanded.includes(group.feature);
        const value = several ? `${one(group.low)} to ${one(group.high)}` : one(group.peak);
        const detail = several ? `${group.experiments.length} experiments: ${group.cells.join(', ')}` : group.experiments[0]?.context;
        return (
          <li key={group.feature} className="effect">
            <div className="effect-row">
              {several ? (
                <button type="button" className="effect-name effect-toggle" aria-expanded={open} onClick={() => onToggle?.(group.feature)}>
                  <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} />
                  <EffectName feature={group.feature} detail={detail} />
                </button>
              ) : (
                <span className="effect-name">
                  <EffectName feature={group.feature} detail={detail} />
                </span>
              )}
              <EffectBar value={group.peak} />
              <span className="effect-value">{value}</span>
            </div>
            {open && (
              <ol className="effects-experiments">
                {group.experiments.map((experiment) => (
                  <ExperimentRow key={experiment.label} experiment={experiment} />
                ))}
              </ol>
            )}
          </li>
        );
      })}
    </ol>
  );
}

function EffectName({ feature, detail }: { feature: string; detail: string | undefined }) {
  return (
    <span className="effect-name-text">
      <span className="effect-feature">{feature}</span>
      <span className="effect-detail">{detail}</span>
    </span>
  );
}

function ExperimentRow({ experiment }: { experiment: EffectExperiment }) {
  return (
    <li className="effect-row effect-experiment">
      <span className="effect-name effect-detail">{experiment.context}</span>
      <EffectBar value={experiment.value} />
      <span className="effect-value">{one(experiment.value)}</span>
    </li>
  );
}

function EffectBar({ value }: { value: number }) {
  const step = scale.step(value) ?? 4;
  return (
    <span className="effect-bar" aria-hidden="true">
      <span style={{ inlineSize: share(value), background: `var(${scale.color(step)})` } as CSSProperties} />
    </span>
  );
}
