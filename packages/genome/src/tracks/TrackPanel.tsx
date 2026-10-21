import type { GeneModel, GenomeTracks, ScorePoint, SequenceSpan } from '@humanbase/data';
import { GenomeTrackView, type GeneShape, type TrackOf, type TrackState } from '@humanbase/ui';
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { withChr, type Assembly, type GenomeDataTrack, type GenomeRegion } from '../GenomeBrowserEngine';
import { builtInTracks, genesTrack, sequenceTrack } from '../genomeTrackList';
import type { DrawnTracks, TrackEngine } from './TrackEngine';

interface TrackPanelProps {
  engine: TrackEngine;
  files: GenomeTracks;
  assembly: Assembly;
  tracks: readonly GenomeDataTrack[];
  onRegionChange: (region: GenomeRegion) => void;
}

interface Loaded<T> {
  state: TrackState;
  data?: T | undefined;
}

// Gene models are read up to this width; past it the track asks for a closer view.
const geneLimit = 5_000_000;
const readableBase = 7;
const settle = 150;
const count = new Intl.NumberFormat('en-US');

const shapeOf = (gene: GeneModel): GeneShape => ({ ...gene, muted: gene.type.includes('pseudogene') });

/** Keeps the last data while new data loads, so a move never blanks a track. */
function useTrackData<T>(read: (() => Promise<T>) | undefined, key: string): Loaded<T> {
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

/** Measures the drawing area beside the header column. */
function useAreaWidth() {
  const element = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  useLayoutEffect(() => {
    const host = element.current;
    if (!host) return;
    const measure = () => setWidth(Math.max(0, host.clientWidth - (host.querySelector('.score-tracks-column')?.clientWidth ?? 0)));
    const observer = new ResizeObserver(measure);
    observer.observe(host);
    measure();
    return () => observer.disconnect();
  }, []);
  return { element, width };
}

export function TrackPanel({ engine, files, assembly, tracks: allTracks, onRegionChange }: TrackPanelProps) {
  const { region, highlight, hidden } = useSyncExternalStore(engine.subscribe, engine.snapshot);
  const tracks = allTracks.filter((track) => !hidden.includes(track.name));
  const [showSequence, showGenes] = [!hidden.includes(sequenceTrack), !hidden.includes(genesTrack)];
  const named = builtInTracks(assembly);
  const { element, width } = useAreaWidth();
  const [shift, setShift] = useState(0);
  const chrom = withChr(region.chrom);
  const span = { chrom, start: Math.round(region.start), end: Math.round(region.end) };
  const bases = span.end - span.start + 1;
  const bins = Math.max(1, Math.round(width));
  const readable = showSequence && width > 0 && width / bases >= readableBase;
  const where = `${chrom}:${span.start}-${span.end}`;

  const sequence = useTrackData<SequenceSpan | undefined>(readable ? () => files.sequence(assembly, span) : undefined, readable ? where : 'none');
  const nearGenes = showGenes && bases <= geneLimit;
  const genes = useTrackData<GeneModel[]>(nearGenes ? () => files.genes(assembly, span) : undefined, nearGenes ? where : 'far');
  const urls = tracks.map((track) => track.bigWigUrl).join(' ');
  const scores = useTrackData<Record<string, ScorePoint[]>>(
    width > 0 && tracks.length > 0 ? async () => Object.fromEntries(await Promise.all(tracks.map(async (track) => [track.bigWigUrl, await files.scores(track.bigWigUrl, span, bins)] as const))) : undefined,
    `${where} ${bins} ${urls}`,
  );

  const geneTrack: TrackOf<readonly GeneShape[]> = { name: named.genes.name, meta: named.genes.meta, ...(bases > geneLimit ? { state: 'ready', data: [] } : { state: genes.state, data: genes.data?.map(shapeOf) }) };

  const pan = (pixels: number, done: boolean) => {
    if (!done) {
      setShift(pixels);
      return;
    }
    setShift(0);
    const moved = Math.round((-pixels / Math.max(1, width)) * bases);
    if (moved === 0) return;
    const start = Math.max(1, span.start + moved);
    onRegionChange({ chrom, start, end: start + bases - 1 });
  };

  const drawn: DrawnTracks = {
    start: span.start,
    end: span.end,
    width,
    sequence: showSequence ? { name: named.sequence.name, meta: named.sequence.meta, state: readable ? sequence.state : 'ready', data: readable ? sequence.data : undefined } : undefined,
    scores: tracks.map((track) => {
      // A track just turned on has no data until its first read lands.
      const values = scores.data?.[track.bigWigUrl];
      return { name: track.name, meta: track.meta ?? '', state: values || scores.state === 'failed' ? scores.state : 'loading', data: values && { min: track.range?.[0] ?? 0, max: track.range?.[1] ?? 1, values } };
    }),
    genes: showGenes ? geneTrack : undefined,
    selected: highlight && withChr(highlight.chrom) === chrom ? { position: highlight.position, label: `${chrom}:${count.format(highlight.position)}` } : undefined,
  };
  useLayoutEffect(() => {
    engine.remember(drawn);
  });

  return (
    <div ref={element} className="track-engine">
      <GenomeTrackView {...drawn} onPan={pan} shift={shift} />
    </div>
  );
}
