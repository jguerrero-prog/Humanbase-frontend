import { useEffect, useState, type RefObject } from 'react';
import { useLatest } from './useLatest';

/** Measures a scrolling element as it scrolls or it and its children resize; re-renders only when the measure changes. */
export function useScrollState<T>(scroller: RefObject<HTMLElement | null>, measure: (element: HTMLElement) => T, initial: T): T {
  const [state, setState] = useState(initial);
  const latest = useLatest(measure);
  useEffect(() => {
    const element = scroller.current;
    if (!element) return;
    const update = () => setState(latest.current(element));
    update();
    const observer = typeof ResizeObserver === 'undefined' ? undefined : new ResizeObserver(update);
    for (const target of [element, ...element.children]) observer?.observe(target);
    element.addEventListener('scroll', update, { passive: true });
    return () => {
      observer?.disconnect();
      element.removeEventListener('scroll', update);
    };
  }, [scroller, latest]);
  return state;
}

const hasMore = (element: HTMLElement) => element.scrollLeft + element.clientWidth < element.scrollWidth - 1;

/** True while there is more to scroll to the right, for the fade that says so. */
export function useMoreToScroll(scroller: RefObject<HTMLElement | null>) {
  return useScrollState(scroller, hasMore, false);
}
