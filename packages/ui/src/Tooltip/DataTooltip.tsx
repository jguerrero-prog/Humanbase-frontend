import type { CSSProperties, Ref } from 'react';
import { Icon } from '../Icon/Icon';
import { BreakableText } from '../Text/BreakableText';
import './DataTooltip.css';

export interface DataTooltipProps {
  title: string;
  subtitle?: string;
  /** Label, value and an optional note after the value, such as "strongest". */
  rows: readonly (readonly [label: string, value: string, note?: string])[];
  hint?: string;
  /** An external page for this value, such as its position in a genome browser; shown instead of the hint. */
  link?: { label: string; href: string } | undefined;
  /** A pinned tooltip stays in place after a click, so its link can be followed. */
  pinned?: boolean | undefined;
  ref?: Ref<HTMLDivElement> | undefined;
  id?: string;
  position?: { x: number; y: number };
  className?: string;
}

export function DataTooltip({ title, subtitle, rows, hint, link, pinned = false, ref, id, position, className }: DataTooltipProps) {
  const style = position ? ({ '--data-tooltip-x': `${position.x}px`, '--data-tooltip-y': `${position.y}px` } as CSSProperties) : undefined;
  return (
    <div
      ref={ref}
      id={id}
      role={pinned ? 'dialog' : 'tooltip'}
      aria-label={pinned ? title : undefined}
      className={['data-tooltip', position && 'data-tooltip-placed', pinned && 'data-tooltip-pinned', className].filter(Boolean).join(' ')}
      style={style}
    >
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
      {link ? (
        <p className="data-tooltip-hint">
          {pinned ? (
            <a className="data-tooltip-link" href={link.href} target="_blank" rel="noopener noreferrer">
              {link.label}
              <Icon name="external-link" size={16} label="opens in a new tab" />
            </a>
          ) : (
            <span className="data-tooltip-link">
              {link.label}
              <Icon name="external-link" size={16} />
            </span>
          )}
        </p>
      ) : (
        hint && <p className="data-tooltip-hint">{hint}</p>
      )}
    </div>
  );
}
