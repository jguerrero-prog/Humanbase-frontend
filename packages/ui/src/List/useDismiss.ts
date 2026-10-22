import { useEffect, useLayoutEffect, useRef, type RefObject } from 'react';

export function useDismiss(container: RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: Event) => {
      if (!container.current?.contains(event.target as Node)) close();
    };
    document.addEventListener('pointerdown', closeOutside);
    document.addEventListener('focusin', closeOutside);
    return () => {
      document.removeEventListener('pointerdown', closeOutside);
      document.removeEventListener('focusin', closeOutside);
    };
  }, [container, open, close]);
}

/** A pinned panel closes on a click or focus outside it, or on Escape, which also returns focus to what opened it. */
export function usePinned(container: RefObject<HTMLElement | null>, open: boolean, close: () => void, opener: () => HTMLElement | null | undefined) {
  useDismiss(container, open, close);
  const latestOpener = useRef(opener);
  useLayoutEffect(() => {
    latestOpener.current = opener;
  });
  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      close();
      latestOpener.current()?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [open, close]);
}
