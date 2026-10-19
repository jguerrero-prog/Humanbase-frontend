import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { Icon } from '../Icon/Icon';
import { useDismiss } from '../List/useDismiss';
import { anchorSupported, placeUnder } from './placement';
import './Toggletip.css';

export interface ToggletipProps {
  term: string;
  title?: string;
  body: string;
  link?: { label: string; href: string };
  size?: 'header' | 'default';
  open?: boolean | undefined;
  className?: string | undefined;
}

export function Toggletip({ term, title = term, body, link, size = 'default', open: openProp, className }: ToggletipProps) {
  const id = useId();
  const wrapper = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLSpanElement>(null);
  const anchor = `--toggletip-${id.replace(/[^\w-]/g, '')}`;
  const [ownOpen, setOwnOpen] = useState(false);
  const open = openProp ?? ownOpen;
  const close = useCallback(() => setOwnOpen(false), []);
  useDismiss(wrapper, ownOpen, close);

  useEffect(() => {
    if (!ownOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      button.current?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [ownOpen, close]);

  useLayoutEffect(() => {
    const node = panel.current;
    if (!ownOpen || !node) return;
    node.showPopover();
    if (!anchorSupported && button.current) placeUnder(node, button.current);
  }, [ownOpen]);

  return (
    <span ref={wrapper} className={['toggletip', className].filter(Boolean).join(' ')}>
      <button ref={button} type="button" className={`toggletip-button toggletip-button-${size}`} aria-label={`About ${term}`} aria-expanded={open} aria-controls={id} style={{ anchorName: anchor } as CSSProperties} onClick={() => setOwnOpen(!ownOpen)}>
        <Icon name="info" size={16} />
      </button>
      <span id={id} role="status" className="toggletip-region">
        {open && (
          <span ref={panel} className="toggletip-panel" popover={openProp === undefined ? 'manual' : undefined} style={{ positionAnchor: anchor } as CSSProperties}>
            <strong className="toggletip-title">{title}</strong>
            <span className="toggletip-body">{body}</span>
            {link && (
              <a className="toggletip-link" href={link.href}>
                {link.label}
              </a>
            )}
          </span>
        )}
      </span>
    </span>
  );
}
