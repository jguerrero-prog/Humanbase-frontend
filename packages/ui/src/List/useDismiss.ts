import { useEffect, type RefObject } from 'react';

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
