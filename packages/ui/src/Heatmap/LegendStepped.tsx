import { useId, useMemo, type CSSProperties } from 'react';
import { ScoreScale, type ScaleSpec } from './ScoreScale';
import './Heatmap.css';
import '../Legend/Legend.css';

export interface LegendSteppedProps {
  spec: ScaleSpec;
  /** The step whose cells are outlined, from hovering the legend or a cell. */
  highlighted?: number | null | undefined;
  onHighlight?: ((step: number | null) => void) | undefined;
  className?: string | undefined;
}

export function LegendStepped({ spec, highlighted, onHighlight, className }: LegendSteppedProps) {
  const id = useId();
  const scale = useMemo(() => new ScoreScale(spec), [spec]);
  const steps = Array.from({ length: scale.steps }, (_, index) => index + 1);
  const [low, high] = spec.ends ?? [];
  return (
    <div
      className={['legend', 'legend-stepped', `legend-stepped-${spec.kind}`, className].filter(Boolean).join(' ')}
      role="group"
      aria-labelledby={id}
      style={{ '--legend-steps': scale.steps } as CSSProperties}
    >
      <p id={id} className="legend-title">
        {spec.title}
      </p>
      <ol className="legend-step-list">
        {steps.map((step) => (
          <li
            key={step}
            className="legend-step"
            data-highlighted={highlighted === step || undefined}
            style={{ '--legend-color': `var(${scale.color(step)})` } as CSSProperties}
            onPointerEnter={() => onHighlight?.(step)}
            onPointerLeave={() => onHighlight?.(null)}
          >
            <span className="visually-hidden">{scale.range(step)}</span>
          </li>
        ))}
      </ol>
      <p className="legend-edges" aria-hidden="true">
        {low !== undefined && <span className="legend-end legend-end-low">{ScoreScale.number(low)}</span>}
        {spec.edges.map((edge, index) => (
          <span key={edge} className="legend-edge" style={{ gridColumnStart: index + 2 }}>
            {ScoreScale.number(edge)}
          </span>
        ))}
        {high !== undefined && <span className="legend-end legend-end-high">{ScoreScale.number(high)}</span>}
      </p>
      <p className="legend-words">
        <span>{spec.words[0]}</span>
        <span>{spec.words[1]}</span>
      </p>
    </div>
  );
}
