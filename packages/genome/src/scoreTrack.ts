import type { GenomeScoreTrack } from './GenomeBrowserEngine';

export interface ScoreTrackOptions {
  name: string;
  /** Where the scores come from, such as "Model score"; the range follows it in the track's meta line. */
  source: string;
  bigWigUrl: string;
  range: readonly [number, number];
}

const signed = (value: number) => String(value).replace('-', '−');

/** A bigWig score track over the scores' range, with the range in its meta line. */
export function scoreTrack({ name, source, bigWigUrl, range }: ScoreTrackOptions): GenomeScoreTrack {
  return {
    name,
    meta: `${source}, ${signed(range[0])} to ${signed(range[1])}`,
    bigWigUrl,
    range,
  };
}
