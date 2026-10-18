import { cloneElement, useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent, type ReactElement } from 'react';
import { fitPlacement, type Placement } from './placement';
import { tooltips } from './TooltipController';
import './Tooltip.css';

export interface TooltipProps {
  text: string;
  children: ReactElement<{ 'aria-describedby'?: string }>;
  placement?: Placement;
  describes?: boolean;
  open?: boolean | undefined;
  className?: string | undefined;
}

const offset = 8;

export function Tooltip({ text, children, placement = 'top', describes = false, open: openProp, className }: TooltipProps) {
  const id = useId();
  const anchor = useRef<HTMLSpanElement>(null);
  const bubble = useRef<HTMLSpanElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [shown, setShown] = useState(false);
  const [side, setSide] = useState(placement);
  const open = openProp ?? shown;

  const hideNow = useCallback(() => {
    clearTimeout(timer.current);
    setShown(false);
  }, []);

  const show = (delay: number) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      tooltips.opened(hideNow);
      setShown(true);
    }, delay);
  };

  const hide = () => {
    clearTimeout(timer.current);
    timer.current = setTimeout(hideNow, tooltips.hideDelay);
  };

  useEffect(() => {
    if (!shown) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') hideNow();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('keydown', closeOnEscape);
      tooltips.closed(hideNow);
    };
  }, [shown, hideNow]);

  useEffect(() => () => clearTimeout(timer.current), []);

  useLayoutEffect(() => {
    if (!open || !anchor.current || !bubble.current) return;
    setSide(fitPlacement(placement, anchor.current.getBoundingClientRect(), bubble.current.getBoundingClientRect(), offset));
  }, [open, placement]);

  const enter = (event: PointerEvent) => {
    if (event.pointerType !== 'touch') show(tooltips.showDelay());
  };

  return (
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- listens for hover and focus on the trigger inside; the trigger stays the control
    <span ref={anchor} className={['tooltip-anchor', className].filter(Boolean).join(' ')} onPointerEnter={enter} onPointerLeave={hide} onFocus={() => show(0)} onBlur={hideNow}>
      {describes ? cloneElement(children, { 'aria-describedby': id }) : children}
      {(open || describes) && (
        <span ref={bubble} id={id} role="tooltip" className={`tooltip tooltip-${side}`} hidden={!open} aria-hidden={describes ? undefined : true}>
          {text}
        </span>
      )}
    </span>
  );
}
