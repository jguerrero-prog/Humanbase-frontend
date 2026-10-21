import { GenomeLocation, type GenomeTracks } from '@humanbase/data';
import { genomeCommand, SegmentTable, TrackHeader, type GenomeCommand } from '@humanbase/ui';
import { useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react';
import { sameRegion, withChr, type Assembly, type GenomeBrowserEngine, type GenomeBrowserEngineFactory, type GenomeDataTrack, type GenomeExportOptions, type GenomeRegion, type GenomeTrackLayout } from './GenomeBrowserEngine';
import { useSegmentTracks } from './tracks/useTrackData';
import './genome.css';

export type EngineStatus = 'loading' | 'ready' | 'failed';

/** What a page can ask of the mounted engine. */
export interface GenomeEngineHandle {
  exportSvg(options: GenomeExportOptions): Promise<Blob>;
}

export interface GenomeEngineViewProps {
  engine: GenomeBrowserEngineFactory;
  /** Reads the track files for engines that draw their own tracks. */
  files: GenomeTracks;
  label: string;
  assembly: Assembly;
  region: GenomeRegion;
  tracks: readonly GenomeDataTrack[];
  /** Tracks left out, by id (see genomeTrackList). */
  hidden?: readonly string[] | undefined;
  /** The selected position, marked across every track. */
  selected?: { chrom: string; position: number } | undefined;
  onRegionChange?: (region: GenomeRegion) => void;
  onStatusChange?: (status: EngineStatus, error?: Error) => void;
  /** Keyboard commands from the genome browser's key map; with it, the tracks take focus and keys. */
  onCommand?: ((command: GenomeCommand) => void) | undefined;
  ref?: Ref<GenomeEngineHandle> | undefined;
}

/** Mounts a genome browser engine and keeps it on the page's region and selection. */
const noneHidden: readonly string[] = [];

export function GenomeEngineView({ engine, files, label, assembly, region, tracks, hidden = noneHidden, selected, onRegionChange, onStatusChange, onCommand, ref }: GenomeEngineViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<GenomeBrowserEngine | null>(null);
  const [ready, setReady] = useState(false);
  const [layout, setLayout] = useState<readonly GenomeTrackLayout[]>([]);
  const shown = useRef(region);
  const events = useRef({ onRegionChange, onStatusChange });
  useLayoutEffect(() => {
    events.current = { onRegionChange, onStatusChange };
  });
  // The engine is built once per assembly, file reader and track set; region and selection changes go through it.
  const first = useRef({ region, label });
  const latestHidden = useRef(hidden);
  useLayoutEffect(() => {
    latestHidden.current = hidden;
  });
  useImperativeHandle(ref, () => ({
    exportSvg: (options) => instance.current?.exportSvg(options) ?? Promise.reject(new Error('The genome browser hasn’t started yet.')),
  }), []);

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const browser = engine(files);
    let live = true;
    setReady(false);
    events.current.onStatusChange?.('loading');
    browser
      .mount(element, {
        label: first.current.label,
        assembly,
        region: first.current.region,
        tracks,
        hidden: latestHidden.current,
        onRegionChange: (moved) => {
          shown.current = moved;
          events.current.onRegionChange?.(moved);
        },
        onTrackLayout: (tracks) => {
          if (live) setLayout(tracks);
        },
      })
      .then(() => {
        if (!live) return;
        instance.current = browser;
        setReady(true);
        events.current.onStatusChange?.('ready');
      })
      .catch((error: unknown) => {
        if (live) events.current.onStatusChange?.('failed', error instanceof Error ? error : new Error(String(error)));
      });
    return () => {
      live = false;
      browser.destroy();
      instance.current = null;
      setLayout([]);
      element.replaceChildren();
    };
  }, [engine, files, assembly, tracks]);

  useEffect(() => {
    if (!ready || sameRegion(region, shown.current)) return;
    shown.current = region;
    instance.current?.showRegion(region);
  }, [ready, region]);

  const hiddenKey = hidden.join('\n');
  useEffect(() => {
    if (ready) instance.current?.showTracks(hiddenKey ? hiddenKey.split('\n') : []);
  }, [ready, hiddenKey]);

  const mark = selected ? `${selected.chrom}:${selected.position}` : '';
  useEffect(() => {
    if (!ready) return;
    const [chrom = '', position = ''] = mark.split(':');
    instance.current?.highlight(mark ? { chrom, position: Number(position) } : undefined);
  }, [ready, mark]);

  // Segment tracks are listed as tables under any engine, so their states never rest on color alone.
  const span = { chrom: withChr(region.chrom), start: Math.round(region.start), end: Math.round(region.end) };
  const segmentTracks = useSegmentTracks(files, tracks.filter((track) => !hidden.includes(track.name)), span);
  const location = new GenomeLocation(span.chrom, span.start, span.end, assembly);

  // An engine that reports its tracks gets the design system's headers beside them; others keep their own labels.
  const headed = layout.length > 0;
  const surface = { ref: container, className: 'genome-engine', 'aria-label': label, 'aria-busy': !ready || undefined };
  return (
    <>
      <div className={headed ? 'genome-engine-frame is-headed' : 'genome-engine-frame'}>
        {headed && (
          <div className="genome-engine-headers">
            {layout.map((track) => (
              <div key={track.name} className="genome-engine-header" style={{ insetBlockStart: track.top, blockSize: track.height }}>
                <TrackHeader name={track.name} source={track.meta ?? ''} />
              </div>
            ))}
          </div>
        )}
        {onCommand ? (
          // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- the tracks pan and zoom with keys, as in the design system's Keyboard spec
          <div
            {...surface}
            role="application"
            aria-roledescription="genome browser"
            aria-keyshortcuts="ArrowLeft ArrowRight + - Control+ArrowLeft Control+ArrowRight"
            // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
            tabIndex={0}
            onKeyDown={(event) => {
              const command = genomeCommand(event);
              if (!command) return;
              event.preventDefault();
              onCommand(command);
            }}
          />
        ) : (
          <div {...surface} role="region" />
        )}
      </div>
      {segmentTracks.map((track) => (
        <SegmentTable key={track.name} track={track} where={`${location.format()}, ${location.assemblyName}`} />
      ))}
    </>
  );
}
