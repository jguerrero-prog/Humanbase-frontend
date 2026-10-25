import { useLayoutEffect, useState, type RefObject } from 'react';

export interface RowWindow {
  /** The first row drawn, and one past the last. */
  start: number;
  end: number;
  /** A row's height plus the 1px gap, measured from a drawn row. */
  step: number;
}

const overscan = 12;
const firstStep = 27;
const firstRows = 40;

/** The rows of a tall grid that are on screen, plus a margin, kept up to date as the page scrolls or resizes. */
export function useRowWindow(grid: RefObject<HTMLElement | null>, count: number, enabled: boolean, measureKey: string): RowWindow {
  const [view, setView] = useState<RowWindow>({ start: 0, end: Math.min(count, firstRows), step: firstStep });

  useLayoutEffect(() => {
    const box = grid.current;
    if (!enabled || !box) return;
    let frame = 0;
    const measure = () => {
      frame = 0;
      const row = box.querySelector<HTMLElement>('[role="row"]');
      const step = row ? row.offsetHeight + 1 : firstStep;
      const top = box.getBoundingClientRect().top;
      const start = Math.min(count, Math.max(0, Math.floor(-top / step) - overscan));
      const end = Math.min(count, Math.max(start, Math.ceil((window.innerHeight - top) / step) + overscan));
      setView((last) => (last.start === start && last.end === end && last.step === step ? last : { start, end, step }));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(measure);
    };
    measure();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
    };
  }, [grid, count, enabled, measureKey]);

  return enabled ? view : { start: 0, end: count, step: firstStep };
}
