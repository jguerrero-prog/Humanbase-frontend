import { useState } from 'react';
import type { GenomeLocation } from '../genome/GenomeLocation';

/** The range to read predictions for as the view moves (see GenomeLocation.readRange); a new key, such as another score, starts again from the view. */
export function useReadRange(view: GenomeLocation | undefined, key: string): GenomeLocation | undefined {
  const [read, setRead] = useState<{ key: string; range: GenomeLocation }>();
  if (!view) return undefined;
  const current = read?.key === key ? read.range : undefined;
  const next = view.readRange(current);
  if (next !== current) setRead({ key, range: next });
  return next;
}

/** placeholderData that keeps the last range's predictions while a moved view's range loads, so a drag carries on; another score or set starts empty. */
export function keepSameData<T>(key: readonly unknown[]) {
  return (previous: T | undefined, query: { queryKey: readonly unknown[] } | undefined) => (query && key.slice(0, -1).every((part, index) => query.queryKey[index] === part) ? previous : undefined);
}
