import type { GeneModel, GenomeTracks, ScorePoint, SequenceSpan } from '@humanbase/data';
import { GenomeTrackView, type GeneShape, type TrackOf } from '@humanbase/ui';
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { isSegmentTrack, withChr, type Assembly, type GenomeDataTrack, type GenomeRegion, type GenomeScoreTrack } from '../GenomeBrowserEngine';
import { builtInTracks, genesTrack, sequenceTrack } from '../genomeTrackList';
import { geneDetails, scoreDetails, segmentDetails } from './itemDetails';
import type { DrawnTracks, TrackEngine } from './TrackEngine';
import { fileState, readEach, readLimit, useSegmentTracks, useTrackData } from './useTrackData';

interface TrackPanelProps {
  engine: TrackEngine;
  files: GenomeTracks;
  assembly: Assembly;
  tracks: readonly GenomeDataTrack[];
  onRegionChange: (region: GenomeRegion) => void;
}

const readableBase = 7;
const count = new Intl.NumberFormat('en-US');

const shapeOf = (chrom: string, gene: GeneModel): GeneShape => ({ ...gene, muted: gene.type.includes('pseudogene'), details: geneDetails(chrom, gene) });

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
  const shownTracks = allTracks.filter((track) => !hidden.includes(track.name));
  const tracks = shownTracks.filter((track): track is GenomeScoreTrack => !isSegmentTrack(track));
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
  const nearGenes = showGenes && bases <= readLimit;
  const genes = useTrackData<GeneModel[]>(nearGenes ? () => files.genes(assembly, span) : undefined, nearGenes ? where : 'far');
  const urls = tracks.map((track) => track.bigWigUrl).join(' ');
  const scores = useTrackData<Record<string, ScorePoint[] | null>>(
    width > 0 && tracks.length > 0 ? () => readEach(tracks.map((track) => track.bigWigUrl), (url) => files.scores(url, span, bins)) : undefined,
    `${where} ${bins} ${urls}`,
  );

  const segments = useSegmentTracks(files, shownTracks, span).map((track) => ({ ...track, data: track.data?.map((segment) => ({ ...segment, details: segmentDetails(chrom, segment) })) }));

  const geneTrack: TrackOf<readonly GeneShape[]> = { name: named.genes.name, meta: named.genes.meta, ...(bases > readLimit ? { state: 'ready', data: [] } : { state: genes.state, data: genes.data?.map((gene) => shapeOf(chrom, gene)) }) };

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
      const { state, data: values } = fileState(scores, track.bigWigUrl);
      return { name: track.name, meta: track.meta ?? '', state, data: values && { min: track.range?.[0] ?? 0, max: track.range?.[1] ?? 1, values: values.map((point) => ({ ...point, details: scoreDetails(chrom, point) })) } };
    }),
    segments,
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
