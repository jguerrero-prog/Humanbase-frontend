import type { CSSProperties } from 'react';
import { BreakableText } from '../Text/BreakableText';
import './DataTooltip.css';

export interface DataTooltipProps {
  title: string;
  subtitle?: string;
  /** Label, value and an optional note after the value, such as "strongest". */
  rows: readonly (readonly [label: string, value: string, note?: string])[];
  hint?: string;
  id?: string;
  position?: { x: number; y: number };
  className?: string;
}

export function DataTooltip({ title, subtitle, rows, hint, id, position, className }: DataTooltipProps) {
  const style = position ? ({ '--data-tooltip-x': `${position.x}px`, '--data-tooltip-y': `${position.y}px` } as CSSProperties) : undefined;
  return (
    <div id={id} role="tooltip" className={['data-tooltip', position && 'data-tooltip-placed', className].filter(Boolean).join(' ')} style={style}>
      <p className="data-tooltip-title">
        <BreakableText>{title}</BreakableText>
      </p>
      {subtitle && (
        <p className="data-tooltip-subtitle">
          <BreakableText>{subtitle}</BreakableText>
        </p>
      )}
      <dl className="data-tooltip-rows">
        {rows.map(([label, value, note]) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>
              {value}
              {note && <span className="data-tooltip-note">{note}</span>}
            </dd>
          </div>
        ))}
      </dl>
      {hint && <p className="data-tooltip-hint">{hint}</p>}
    </div>
  );
}
