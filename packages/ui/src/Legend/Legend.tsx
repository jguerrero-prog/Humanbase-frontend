import { useId, type CSSProperties, type ReactNode } from 'react';
import './Legend.css';

export type LegendScale = 'sequential' | 'diverging';

export interface LegendItem {
  label: string;
  /** A color custom property, such as `--viz-cat-1`. */
  color: string;
  /** A width custom property for line marks, such as `--viz-edge-strong`. */
  width?: string;
}

interface LegendFrameProps {
  title: string;
  children: ReactNode;
}

function LegendFrame({ title, children }: LegendFrameProps) {
  const id = useId();
  return (
    <div className="legend" role="group" aria-labelledby={id}>
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
        {items.map(({ label, color, width }) => (
          <li key={label} style={{ '--legend-color': `var(${color})`, '--legend-width': width && `var(${width})` } as CSSProperties}>
            <span className={`legend-${mark}`} aria-hidden="true" />
            {label}
          </li>
        ))}
      </ul>
    </LegendFrame>
  );
}
