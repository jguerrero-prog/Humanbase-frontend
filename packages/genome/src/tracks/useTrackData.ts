import type { GenomeSpan, GenomeTracks, Segment } from '@humanbase/data';
import type { TrackOf, TrackState } from '@humanbase/ui';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { isSegmentTrack, type GenomeDataTrack } from '../GenomeBrowserEngine';

export interface Loaded<T> {
  state: TrackState;
  data?: T | undefined;
}

/** Gene models and segments are read up to this width; past it the track asks for a closer view. */
export const readLimit = 5_000_000;
const settle = 150;

/** Keeps the last data while new data loads, so a move never blanks a track. */
export function useTrackData<T>(read: (() => Promise<T>) | undefined, key: string): Loaded<T> {
  const [loaded, setLoaded] = useState<Loaded<T>>({ state: 'loading' });
  const reader = useRef(read);
  useLayoutEffect(() => {
    reader.current = read;
  });
  useEffect(() => {
    const current = reader.current;
    if (!current) return;
    let live = true;
    const timer = window.setTimeout(() => {
      current().then(
        (data) => live && setLoaded({ state: 'ready', data }),
        () => live && setLoaded({ state: 'failed' }),
      );
    }, settle);
    return () => {
      live = false;
      window.clearTimeout(timer);
    };
  }, [key]);
  return loaded;
}

/** The segment tracks among these, with their segments in the span. */
export function useSegmentTracks(files: GenomeTracks, tracks: readonly GenomeDataTrack[], span: GenomeSpan): TrackOf<readonly Segment[]>[] {
  const shown = tracks.filter(isSegmentTrack);
  const near = shown.length > 0 && span.end - span.start + 1 <= readLimit;
  const urls = shown.map((track) => track.bigBedUrl).join(' ');
  const loaded = useTrackData<Record<string, Segment[]>>(
    near ? async () => Object.fromEntries(await Promise.all(shown.map(async (track) => [track.bigBedUrl, await files.segments(track.bigBedUrl, span)] as const))) : undefined,
    near ? `${span.chrom}:${span.start}-${span.end} ${urls}` : 'far',
  );
  return shown.map((track) => {
    const named = { name: track.name, meta: track.meta ?? '' };
    if (!near) return { ...named, state: 'ready', data: [], empty: `Zoom in to under ${readLimit / 1_000_000} Mb to see ${track.name}.` };
    // A track just turned on has no data until its first read lands.
    const data = loaded.data?.[track.bigBedUrl];
    return { ...named, state: data || loaded.state === 'failed' ? loaded.state : 'loading', data };
  });
}
