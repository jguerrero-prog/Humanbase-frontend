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
