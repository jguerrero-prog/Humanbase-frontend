import type { GeneModel, GenomeTracks, ScorePoint, SequenceSpan } from '@humanbase/data';
import { GenomeTrackView, type ActionMenuItem, type GeneShape, type TrackOf } from '@humanbase/ui';
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from 'react';
import { isSegmentTrack, trackFile, withChr, type Assembly, type GenomeDataTrack, type GenomeGene, type GenomeRegion, type GenomeScoreTrack } from '../GenomeBrowserEngine';
import { builtInTracks, genesTrack, genomeTrackList, sequenceTrack } from '../genomeTrackList';
import { geneDetails, scoreDetails, segmentDetails } from './itemDetails';
import type { DrawnTracks, TrackEngine } from './TrackEngine';
import { fileState, readEach, readLimit, useOutside, useSegmentTracks, useTrackData, type Loaded } from './useTrackData';

interface TrackPanelProps {
  engine: TrackEngine;
  files: GenomeTracks;
  assembly: Assembly;
  tracks: readonly GenomeDataTrack[];
  trackMenu?: ((id: string) => readonly ActionMenuItem[]) | undefined;
  onRegionChange: (region: GenomeRegion) => void;
  onGeneSelect?: ((gene: GenomeGene) => void) | undefined;
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

export function TrackPanel({ engine, files, assembly, tracks: allTracks, trackMenu, onRegionChange, onGeneSelect }: TrackPanelProps) {
  const { region, highlight, hidden, arrangement, markedGene } = useSyncExternalStore(engine.subscribe, engine.snapshot);
  // Data tracks use their name as id; the view orders tracks by name.
  const nameOf = new Map(genomeTrackList(assembly, allTracks).map((track) => [track.id, track.name]));
  const menu = (id: string) => ({ menu: trackMenu?.(id) });
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
  // Past the recorded sample windows, tracks draw nothing and the page says why once.
  const outside = useOutside(files, assembly, span, shownTracks.map(trackFile));
  const reach = <T,>(loaded: Loaded<T>, file = ''): Loaded<T> => (outside.has(file) ? { state: 'outside' } : loaded);

  const sequence = useTrackData<SequenceSpan | undefined>(readable ? () => files.sequence(assembly, span) : undefined, readable ? where : 'none');
  const nearGenes = showGenes && bases <= readLimit;
  const genes = useTrackData<GeneModel[]>(nearGenes ? () => files.genes(assembly, span) : undefined, nearGenes ? where : 'far');
  const urls = tracks.map((track) => track.bigWigUrl).join(' ');
  const scores = useTrackData<Record<string, ScorePoint[] | null>>(
    width > 0 && tracks.length > 0 ? () => readEach(tracks.map((track) => track.bigWigUrl), (url) => files.scores(url, span, bins)) : undefined,
    `${where} ${bins} ${urls}`,
  );

  const segments = useSegmentTracks(files, shownTracks, span, outside).map((track) => ({ ...track, data: track.data?.map((segment) => ({ ...segment, details: segmentDetails(chrom, segment) })) }));

  const genesInReach = reach(genes);
  const geneTrack: TrackOf<readonly GeneShape[]> = { name: named.genes.name, meta: named.genes.meta, ...(bases > readLimit ? { state: 'ready', data: [] } : { state: genesInReach.state, data: genesInReach.data?.map((gene) => shapeOf(chrom, gene)) }) };

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
    sequence: showSequence ? { name: named.sequence.name, meta: named.sequence.meta, ...(readable ? reach(sequence) : { state: 'ready' }), ...menu(sequenceTrack) } : undefined,
    scores: tracks.map((track) => {
      const { state, data: values } = reach(fileState(scores, track.bigWigUrl), track.bigWigUrl);
      const { height, range = track.range } = arrangement.settings[track.name] ?? {};
      const data = values && { min: range?.[0] ?? 0, max: range?.[1] ?? 1, values: values.map((point) => ({ ...point, details: scoreDetails(chrom, point) })) };
      return { name: track.name, meta: track.meta ?? '', state, data, height, ...menu(track.name) };
    }),
    segments: segments.map((track) => ({ ...track, ...menu(track.name) })),
    genes: showGenes ? { ...geneTrack, ...menu(genesTrack) } : undefined,
    order: arrangement.order.flatMap((id) => nameOf.get(id) ?? []),
    selected: highlight && withChr(highlight.chrom) === chrom ? { position: highlight.position, label: `${chrom}:${count.format(highlight.position)}` } : undefined,
  };
  useLayoutEffect(() => {
    engine.remember(drawn);
  });
  const selectGene =
    onGeneSelect &&
    ((shape: GeneShape) => {
      const gene = genesInReach.data?.find((model) => model.name === shape.name && model.start === shape.start);
      if (gene) onGeneSelect({ name: gene.name, chrom, start: gene.start, end: gene.end, strand: gene.strand, type: gene.type, source: named.genes.meta });
    });

  return (
    <div ref={element} className="track-engine">
      <GenomeTrackView {...drawn} onPan={pan} shift={shift} onGene={selectGene} openGene={markedGene} />
    </div>
  );
}
