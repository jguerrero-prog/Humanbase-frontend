import { useLayoutEffect, useRef } from 'react';

/** A ref that always holds the latest value, for listeners that are attached once. */
export function useLatest<T>(value: T) {
  const latest = useRef(value);
  useLayoutEffect(() => {
    latest.current = value;
  });
  return latest;
}
