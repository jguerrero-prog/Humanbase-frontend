import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { sameRegion, type Assembly, type GenomeBrowserEngine, type GenomeBrowserEngineFactory, type GenomeDataTrack, type GenomeRegion } from './GenomeBrowserEngine';
import './genome.css';

export type EngineStatus = 'loading' | 'ready' | 'failed';

export interface GenomeEngineViewProps {
  engine: GenomeBrowserEngineFactory;
  label: string;
  assembly: Assembly;
  region: GenomeRegion;
  tracks: readonly GenomeDataTrack[];
  /** The selected position, marked across every track. */
  selected?: { chrom: string; position: number } | undefined;
  onRegionChange?: (region: GenomeRegion) => void;
  onStatusChange?: (status: EngineStatus, error?: Error) => void;
}

/** Mounts a genome browser engine and keeps it on the page's region and selection. */
export function GenomeEngineView({ engine, label, assembly, region, tracks, selected, onRegionChange, onStatusChange }: GenomeEngineViewProps) {
  const container = useRef<HTMLDivElement>(null);
  const instance = useRef<GenomeBrowserEngine | null>(null);
  const [ready, setReady] = useState(false);
  const shown = useRef(region);
  const events = useRef({ onRegionChange, onStatusChange });
  useLayoutEffect(() => {
    events.current = { onRegionChange, onStatusChange };
  });
  // The engine is built once per assembly and track set; region and selection changes go through it.
  const first = useRef({ region, label });

  useEffect(() => {
    const element = container.current;
    if (!element) return;
    const browser = engine();
    let live = true;
    setReady(false);
    events.current.onStatusChange?.('loading');
    browser
      .mount(element, {
        label: first.current.label,
        assembly,
        region: first.current.region,
        tracks,
        onRegionChange: (moved) => {
          shown.current = moved;
          events.current.onRegionChange?.(moved);
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
      element.replaceChildren();
    };
  }, [engine, assembly, tracks]);

  useEffect(() => {
    if (!ready || sameRegion(region, shown.current)) return;
    shown.current = region;
    instance.current?.showRegion(region);
  }, [ready, region]);

  const mark = selected ? `${selected.chrom}:${selected.position}` : '';
  useEffect(() => {
    if (!ready) return;
    const [chrom = '', position = ''] = mark.split(':');
    instance.current?.highlight(mark ? { chrom, position: Number(position) } : undefined);
  }, [ready, mark]);

  return <div ref={container} className="genome-engine" aria-busy={!ready || undefined} />;
}
