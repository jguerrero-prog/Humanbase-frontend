import { useMemo, type CSSProperties } from 'react';
import { Button } from '../Button/Button';
import { EmptyState } from '../EmptyState/EmptyState';
import { Icon } from '../Icon/Icon';
import { LegendStepped } from '../Heatmap/LegendStepped';
import { ScoreScale } from '../Heatmap/ScoreScale';
import { EffectGroups, type EffectExperiment, type EffectGroup, type StrengthCounts } from './EffectGroups';
import type { EffectScale } from './EffectScale';
import { BreakableText } from '../Text/BreakableText';
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
  /** The model's nouns, such as protein, proteins and binding. */
  noun?: string | undefined;
  plural?: string | undefined;
  /** The All features tab's label, which the empty state points to. */
  allLabel?: string | undefined;
  verb?: string | undefined;
}


/** Bar lengths, colors and numbers on one effect scale. */
class EffectBars {
  private readonly colors: ScoreScale;

  constructor(readonly scale: EffectScale) {
    this.colors = new ScoreScale(scale.legend);
  }

  share(value: number): string {
    return `${(Math.min(Math.abs(value), this.scale.cut) / this.scale.cut) * 100}%`;
  }

  color(value: number): string {
    return `var(${this.colors.color(this.colors.step(value) ?? 4)})`;
  }

  format(value: number): string {
    return value.toFixed(this.scale.digits).replace('-', '−');
  }
}

// Opening the row lists every experiment, so the summary names only the first few cell types.
const namedCells = 3;
const cellsInBrief = (cells: readonly string[]) => (cells.length > namedCells ? `${cells.slice(0, namedCells).join(', ')} and ${cells.length - namedCells} more` : cells.join(', '));

export function StrongestEffects({ effects, counts, threshold, expanded = [], onToggle, limit = 14, onShowMore, noun = 'protein', plural = 'proteins', allLabel = 'All features', verb = 'binding' }: StrongestEffectsProps) {
  const shown = useMemo(() => effects.atLeast(threshold), [effects, threshold]);
  const tally = counts ?? effects.counts();
  const raises = shown.groups('raises');
  const lowers = shown.groups('lowers');
  const bars = useMemo(() => new EffectBars(effects.scale), [effects.scale]);
  const { prefix, bins } = effects.scale;
  // A score without strength bins isn't offered here; humanbase.io only ranks it.
  if (!bins) return null;
  const lowest = threshold ?? 0;
  const stats: [number, string][] = [
    [tally.strong, `strong, ${prefix}${bins.strong} or more`],
    [tally.moderate, `moderate, ${bins.moderate} to ${bins.strong}`],
    [tally.weak, `weak, ${bins.weak} to ${bins.moderate}`],
    [tally.lowered, `lowered by ${bins.weak} or more`],
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
      <LegendStepped spec={effects.scale.legend} className="effects-legend" />
      <div className="effects-directions">
        <EffectColumn bars={bars} title={`${['Raises', verb].filter(Boolean).join(' ')}, ${raises.length} ${plural}`} groups={raises} expanded={expanded} onToggle={onToggle} limit={limit} onShowMore={onShowMore} plural={plural} />
        <section className="effects-column effects-lowers" aria-label={['Lowers', verb].filter(Boolean).join(' ')}>
          <h4 className="effects-column-title">{['Lowers', verb].filter(Boolean).join(' ')}</h4>
          {lowers.length === 0 ? (
            <EmptyState
              title={`No ${noun} is lowered by ${lowest || bins.weak} or more`}
              text={`For this variant, the lowest scores sit just below 0 (see ${allLabel}). Choose All to list them anyway.`}
            />
          ) : (
            <EffectList bars={bars} groups={lowers} expanded={expanded} onToggle={onToggle} />
          )}
        </section>
      </div>
    </div>
  );
}

interface EffectColumnProps {
  bars: EffectBars;
  title: string;
  groups: EffectGroup[];
  expanded: readonly string[];
  onToggle?: ((feature: string) => void) | undefined;
  limit: number;
  onShowMore?: (() => void) | undefined;
  plural: string;
}

function EffectColumn({ bars, title, groups, expanded, onToggle, limit, onShowMore, plural }: EffectColumnProps) {
  const hidden = groups.length - limit;
  return (
    <section className="effects-column" aria-label={title}>
      <h4 className="effects-column-title">{title}</h4>
      <div className="effects-axis" aria-hidden="true">
        <span>{bars.scale.axis}</span>
        <span className="effects-axis-scale">
          {bars.scale.ticks.map((tick) => (
            <span key={tick} style={{ insetInlineStart: bars.share(tick) } as CSSProperties}>
              {tick}
            </span>
          ))}
        </span>
        <span>cut at {bars.scale.cut}</span>
      </div>
      <EffectList bars={bars} groups={groups.slice(0, limit)} expanded={expanded} onToggle={onToggle} />
      {hidden > 0 && (
        <Button variant="ghost" size="small" onClick={onShowMore}>
          Show {hidden} more {plural}
        </Button>
      )}
    </section>
  );
}

function EffectList({ bars, groups, expanded, onToggle }: { bars: EffectBars; groups: EffectGroup[]; expanded: readonly string[]; onToggle?: ((feature: string) => void) | undefined }) {
  return (
    <ol className="effects-list">
      {groups.map((group) => {
        const several = group.experiments.length > 1;
        const open = several && expanded.includes(group.id);
        const value = several ? `${bars.format(group.low)} to ${bars.format(group.high)}` : bars.format(group.peak);
        const detail = several ? `${group.experiments.length} experiments: ${cellsInBrief(group.cells)}` : group.experiments[0]?.context;
        return (
          <li key={group.id} className="effect">
            <div className="effect-row">
              {several ? (
                <button type="button" className="effect-name effect-toggle" aria-expanded={open} onClick={() => onToggle?.(group.id)}>
                  <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} />
                  <EffectName feature={group.feature} detail={detail} />
                </button>
              ) : (
                <span className="effect-name">
                  <EffectName feature={group.feature} detail={detail} />
                </span>
              )}
              <EffectBar bars={bars} value={group.peak} />
              <span className="effect-value">{value}</span>
            </div>
            {open && (
              <ol className="effects-experiments">
                {group.experiments.map((experiment) => (
                  <ExperimentRow key={experiment.label} bars={bars} experiment={experiment} />
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
      <span className="effect-feature">
        <BreakableText>{feature}</BreakableText>
      </span>
      <span className="effect-detail">{detail && <BreakableText>{detail}</BreakableText>}</span>
    </span>
  );
}

function ExperimentRow({ bars, experiment }: { bars: EffectBars; experiment: EffectExperiment }) {
  return (
    <li className="effect-row effect-experiment">
      <span className="effect-name effect-detail">
        <BreakableText>{experiment.context}</BreakableText>
      </span>
      <EffectBar bars={bars} value={experiment.value} />
      <span className="effect-value">{bars.format(experiment.value)}</span>
    </li>
  );
}

function EffectBar({ bars, value }: { bars: EffectBars; value: number }) {
  return (
    <span className="effect-bar" aria-hidden="true">
      <span style={{ inlineSize: bars.share(value), background: bars.color(value) } as CSSProperties} />
    </span>
  );
}
