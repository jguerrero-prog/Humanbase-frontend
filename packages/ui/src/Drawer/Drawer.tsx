import { useId, useRef, type ReactNode } from 'react';
import { LayerHeader } from '../Layer/LayerHeader';
import { useLayer } from '../Layer/useLayer';
import { PHONE_QUERY, useMediaQuery } from '../Layer/useMediaQuery';
import './Drawer.css';

export type DrawerSize = 'medium' | 'large';
export type DrawerPlacement = 'over' | 'beside';

export interface DrawerProps {
  title: string;
  subtitle?: string;
  open?: boolean;
  onClose?: () => void;
  size?: DrawerSize;
  placement?: DrawerPlacement;
  sheet?: boolean;
  footer?: ReactNode;
  inline?: boolean;
  className?: string;
  children: ReactNode;
}

const swipeToClose = 64;

export function Drawer({ title, subtitle, open = false, onClose = () => {}, size = 'medium', placement = 'over', sheet, footer, inline = false, className, children }: DrawerProps) {
  const titleId = useId();
  const phone = useMediaQuery(PHONE_QUERY);
  const asSheet = sheet ?? phone;
  const swipeStart = useRef(0);
  const layer = useLayer({
    open,
    inline,
    modal: asSheet,
    onClose,
    closeOnBackdrop: true,
    initialFocus: (element) => element.querySelector<HTMLElement>('.layer-title'),
  });

  return (
    <dialog
      {...layer}
      aria-labelledby={titleId}
      className={['layer', 'drawer', `drawer-${size}`, asSheet ? 'drawer-sheet' : `drawer-${placement}`, inline && 'layer-inline', className].filter(Boolean).join(' ')}
    >
      <div className="drawer-frame">
        {asSheet && (
          <div
            className="drawer-handle"
            aria-hidden="true"
            onPointerDown={(event) => (swipeStart.current = event.clientY)}
            onPointerUp={(event) => event.clientY - swipeStart.current > swipeToClose && onClose()}
          />
        )}
        <LayerHeader titleId={titleId} title={title} subtitle={subtitle} onClose={onClose} className="drawer-header" />
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the body scrolls, so it takes focus for arrow-key scrolling */}
        <div className="drawer-body" role="region" aria-labelledby={titleId} tabIndex={0}>
          {children}
        </div>
        {footer && <div className="drawer-footer">{footer}</div>}
      </div>
    </dialog>
  );
}

export function DrawerSection({ label, children }: { label: string; children: ReactNode }) {
  const labelId = useId();
  return (
    <section className="drawer-section" aria-labelledby={labelId}>
      <h3 id={labelId} className="drawer-section-label">
        {label}
      </h3>
      {children}
    </section>
  );
}
