import { useEffect, useRef, type CSSProperties, type Ref } from 'react';
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
  /** A tooltip with a link stays open while the pointer is on it, so the link can be reached from hover. */
  onPointerEnter?: (() => void) | undefined;
  onPointerLeave?: (() => void) | undefined;
  /** A pinned tooltip with a close button takes focus when it opens, as a non-modal dialog. */
  onClose?: (() => void) | undefined;
  /** Points at the item from above (bottom: the tooltip is below it) or below, this many pixels from the tooltip's left edge. */
  arrow?: { side: 'top' | 'bottom'; at: number } | undefined;
  id?: string;
  position?: { x: number; y: number };
  className?: string;
}

export function DataTooltip({ title, subtitle, rows, hint, link, pinned = false, ref, onPointerEnter, onPointerLeave, onClose, arrow, id, position, className }: DataTooltipProps) {
  const closeButton = useRef<HTMLButtonElement>(null);
  const closable = pinned && Boolean(onClose);
  useEffect(() => {
    if (closable) closeButton.current?.focus();
  }, [closable]);
  const style = {
    ...(position && { '--data-tooltip-x': `${position.x}px`, '--data-tooltip-y': `${position.y}px` }),
    ...(arrow && { '--data-tooltip-arrow': `${arrow.at}px` }),
  } as CSSProperties;
  const heading = (
    <p className="data-tooltip-title">
      <BreakableText>{title}</BreakableText>
    </p>
  );
  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- mousedown only keeps focus in place; the link inside is the control
    <div
      ref={ref}
      id={id}
      role={pinned ? 'dialog' : 'tooltip'}
      aria-label={pinned ? title : undefined}
      className={['data-tooltip', position && 'data-tooltip-placed', (pinned || link) && 'data-tooltip-interactive', arrow && `data-tooltip-arrow-${arrow.side}`, className].filter(Boolean).join(' ')}
      style={position || arrow ? style : undefined}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      // Safari moves focus off the page's content on mousedown, which would close a pinned tooltip before its link's click.
      onMouseDown={pinned || link ? (event) => event.preventDefault() : undefined}
    >
      {closable ? (
        <div className="data-tooltip-head">
          {heading}
          <button ref={closeButton} type="button" className="data-tooltip-close" aria-label="Close" onClick={onClose}>
            <Icon name="x" size={16} />
          </button>
        </div>
      ) : (
        heading
      )}
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
          {/* Until pinned, the link takes clicks but not focus, so Tab doesn't land on a tooltip that closes on blur. */}
          <a className="data-tooltip-link" href={link.href} target="_blank" rel="noopener noreferrer" tabIndex={pinned ? undefined : -1}>
            {link.label}
            <Icon name="external-link" size={16} label="opens in a new tab" />
          </a>
        </p>
      ) : (
        hint && <p className="data-tooltip-hint">{hint}</p>
      )}
    </div>
  );
}
