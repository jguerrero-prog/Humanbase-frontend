import { useSyncExternalStore } from 'react';

export const PHONE_QUERY = '(width < 48rem)';

const queryList = (query: string) => (typeof window.matchMedia === 'function' ? window.matchMedia(query) : undefined);

export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      const list = queryList(query);
      list?.addEventListener('change', onChange);
      return () => list?.removeEventListener('change', onChange);
    },
    () => queryList(query)?.matches ?? false,
    () => false,
  );
}
