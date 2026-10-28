import { useId, type CSSProperties, type ReactNode } from 'react';
import './Legend.css';

export type LegendScale = 'sequential' | 'diverging';

export interface LegendItem {
  label: string;
  /** A color custom property, such as `--viz-cat-1`. */
  color: string;
  /** A width custom property for line marks, such as `--viz-edge-strong`. */
  width?: string;
  /** How strongly a line mark is drawn, from 0 to 1. */
  opacity?: number;
  /** A swatch drawn as an outline in the color, for marks drawn as rings. */
  ring?: boolean;
}

interface LegendFrameProps {
  title: string;
  children: ReactNode;
  className?: string | undefined;
  style?: CSSProperties | undefined;
}

export function LegendFrame({ title, children, className, style }: LegendFrameProps) {
  const id = useId();
  return (
    <div className={['legend', className].filter(Boolean).join(' ')} role="group" aria-labelledby={id} style={style}>
      <p id={id} className="legend-title">
        {title}
      </p>
      {children}
    </div>
  );
}

export interface ScaleLegendProps {
  title: string;
  scale: LegendScale;
  ticks: readonly [string, string, string];
}

export function ScaleLegend({ title, scale, ticks }: ScaleLegendProps) {
  return (
    <LegendFrame title={title}>
      <span className={`legend-ramp legend-ramp-${scale}`} aria-hidden="true" />
      <p className="legend-ticks">
        {ticks.map((tick) => (
          <span key={tick}>{tick}</span>
        ))}
      </p>
    </LegendFrame>
  );
}

export interface KeyLegendProps {
  title: string;
  items: readonly LegendItem[];
  mark?: 'swatch' | 'line';
}

export function KeyLegend({ title, items, mark = 'swatch' }: KeyLegendProps) {
  return (
    <LegendFrame title={title}>
      <ul className="legend-items">
        {items.map(({ label, color, width, opacity, ring }) => (
          <li key={label} style={{ '--legend-color': `var(${color})`, '--legend-width': width && `var(${width})`, '--legend-opacity': opacity } as CSSProperties}>
            <span className={ring ? `legend-${mark} legend-ring` : `legend-${mark}`} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </LegendFrame>
  );
}
