import { scoreTrackHeight } from '@humanbase/ui';
import type { GenomeScoreTrack } from './GenomeBrowserEngine';

export interface ScoreTrackOptions {
  name: string;
  /** Where the scores come from, such as "Model score"; the range follows it in the track's meta line. */
  source: string;
  bigWigUrl: string;
  range: readonly [number, number];
}

const signed = (value: number) => String(value).replace('-', '−');

/** A bigWig score track as the genome browser docs draw it: viz-seq-6 bars, 60px tall in both engines, over the scores' range. */
export function scoreTrack({ name, source, bigWigUrl, range }: ScoreTrackOptions): GenomeScoreTrack {
  return {
    name,
    meta: `${source}, ${signed(range[0])} to ${signed(range[1])}`,
    bigWigUrl,
    range,
    style: { type: 'default', style: { glyph: 'HISTOGRAM', BGCOLOR: 'var(--viz-seq-6)', HEIGHT: scoreTrackHeight, MIN: range[0], MAX: range[1] } },
  };
}
