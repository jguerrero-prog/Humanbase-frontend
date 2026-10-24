import { GenomeLocation, type GenomeTracks } from '@humanbase/data';
import { Alert, genomeCommand, SegmentTable, TrackHeader, type ActionMenuItem, type GenomeCommand } from '@humanbase/ui';
import { useCallback, useEffect, useImperativeHandle, useLayoutEffect, useRef, useState, type Ref } from 'react';
import { sameRegion, trackFile, withChr, type Assembly, type GenomeBrowserEngine, type GenomeBrowserEngineFactory, type GenomeDataTrack, type GenomeExportOptions, type GenomeRegion, type GenomeTrackArrangement, type GenomeTrackLayout } from './GenomeBrowserEngine';
import { noArrangement } from './genomeTrackList';
import { useOutside, useSegmentTracks } from './tracks/useTrackData';
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
  /** The tracks' order and score track settings. */
  arrangement?: GenomeTrackArrangement | undefined;
  /** Each track header's menu, by track id; headers have no menu without it. */
  trackMenu?: ((id: string) => readonly ActionMenuItem[]) | undefined;
  /** The selected position, marked across every track. */
  selected?: { chrom: string; position: number } | undefined;
  onRegionChange?: (region: GenomeRegion) => void;
  onStatusChange?: (status: EngineStatus, error?: Error) => void;
  /** Keyboard commands from the genome browser's key map; with it, the tracks take focus and keys. */
  onCommand?: ((command: GenomeCommand) => void) | undefined;
  ref?: Ref<GenomeEngineHandle> | undefined;
}

/** A move or removal can take the focused menu button out of the page; focus then goes back to that track's button, or to the tracks. */
function keepingFocus(items: readonly ActionMenuItem[]): ActionMenuItem[] {
  const restore = () => {
    const menuButton = document.activeElement;
    const [frame, label] = [menuButton?.closest('.genome-engine-frame'), menuButton?.getAttribute('aria-label')];
    requestAnimationFrame(() => {
      if (!frame || (document.activeElement && document.activeElement !== document.body)) return;
      const button = [...frame.querySelectorAll<HTMLElement>('[aria-label]')].find((element) => element.getAttribute('aria-label') === label);
      (button ?? frame.querySelector<HTMLElement>('.genome-engine'))?.focus();
    });
  };
  return items.map((item) => ({
    ...item,
    onSelect: () => {
      restore();
      item.onSelect?.();
    },
  }));
}

/** Mounts a genome browser engine and keeps it on the page's region and selection. */
const noneHidden: readonly string[] = [];

export function GenomeEngineView({ engine, files, label, assembly, region, tracks, hidden = noneHidden, arrangement = noArrangement, trackMenu, selected, onRegionChange, onStatusChange, onCommand, ref }: GenomeEngineViewProps) {
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
  const latest = useRef({ hidden, arrangement, trackMenu });
  useLayoutEffect(() => {
    latest.current = { hidden, arrangement, trackMenu };
  });
  const menuOf = useCallback((id: string) => keepingFocus(latest.current.trackMenu?.(id) ?? []), []);
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
        hidden: latest.current.hidden,
        arrangement: latest.current.arrangement,
        trackMenu: menuOf,
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
  }, [engine, files, assembly, tracks, menuOf]);

  useEffect(() => {
    if (!ready || sameRegion(region, shown.current)) return;
    shown.current = region;
    instance.current?.showRegion(region);
  }, [ready, region]);

  const hiddenKey = hidden.join('\n');
  useEffect(() => {
    if (ready) instance.current?.showTracks(hiddenKey ? hiddenKey.split('\n') : []);
  }, [ready, hiddenKey]);

  const arranged = JSON.stringify(arrangement);
  useEffect(() => {
    if (ready) instance.current?.arrangeTracks(JSON.parse(arranged) as GenomeTrackArrangement);
  }, [ready, arranged]);

  const mark = selected ? `${selected.chrom}:${selected.position}` : '';
  useEffect(() => {
    if (!ready) return;
    const [chrom = '', position = ''] = mark.split(':');
    instance.current?.highlight(mark ? { chrom, position: Number(position) } : undefined);
  }, [ready, mark]);

  // Segment tracks are listed as tables under any engine, so their states never rest on color alone.
  const span = { chrom: withChr(region.chrom), start: Math.round(region.start), end: Math.round(region.end) };
  const shownTracks = tracks.filter((track) => !hidden.includes(track.name));
  const outside = useOutside(files, assembly, span, shownTracks.map(trackFile));
  const segmentTracks = useSegmentTracks(files, shownTracks, span, outside);
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
                <TrackHeader name={track.name} source={track.meta ?? ''} menuItems={trackMenu && keepingFocus(trackMenu(track.id))} />
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
              // Keys pressed on a control inside the tracks, such as an item or its details, are that control's.
              const command = event.target === event.currentTarget ? genomeCommand(event) : undefined;
              if (!command) return;
              event.preventDefault();
              onCommand(command);
            }}
          />
        ) : (
          <div {...surface} role="region" />
        )}
      </div>
      {/* Under the tracks rather than above, so crossing a window's edge never shifts what's being dragged. */}
      {outside.size > 0 && (
        <Alert tone="info" title="Sample data covers only the area around each example variant" className="genome-outside-note">
          Turn the API on to browse the whole genome.
        </Alert>
      )}
      {segmentTracks.map((track) => (
        <SegmentTable key={track.name} track={track} where={`${location.format()}, ${location.assemblyName}`} />
      ))}
    </>
  );
}
