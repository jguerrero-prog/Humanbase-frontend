import { assemblyNames, type GenomeTracks } from '@humanbase/data';
import { createRoot, type Root } from 'react-dom/client';
import type { GenomeBrowserEngine, GenomeMountOptions, GenomeRegion } from '../GenomeBrowserEngine';
import { TrackPanel } from './TrackPanel';

type Listener = () => void;

/** What the page has asked the engine to show, read by the panel through useSyncExternalStore. */
export interface TrackEngineView {
  region: GenomeRegion;
  highlight: { chrom: string; position: number } | undefined;
}

/**
 * The design system's own genome browser: it reads the track files through GenomeTracks
 * and draws ruler, sequence, score tracks and genes as SVG with tokens.
 */
export class TrackEngine implements GenomeBrowserEngine {
  private root: Root | undefined;
  private view: TrackEngineView;
  private readonly listeners = new Set<Listener>();

  constructor(private readonly files: GenomeTracks) {
    this.view = { region: { chrom: 'chr1', start: 1, end: 1 }, highlight: undefined };
  }

  mount(container: HTMLElement, options: GenomeMountOptions): Promise<void> {
    // The panel renders into its own element, so the page can clear the container while React unmounts.
    const host = document.createElement('div');
    host.className = 'track-engine-host';
    container.append(host);
    this.view = { ...this.view, region: options.region };
    this.root = createRoot(host);
    this.root.render(
      <TrackPanel
        engine={this}
        files={this.files}
        assembly={options.assembly}
        assemblyName={assemblyNames[options.assembly]}
        tracks={options.tracks}
        onRegionChange={(region) => {
          this.update({ region });
          options.onRegionChange?.(region);
        }}
      />,
    );
    return Promise.resolve();
  }

  showRegion(region: GenomeRegion): void {
    this.update({ region });
  }

  highlight(position: { chrom: string; position: number } | undefined): void {
    this.update({ highlight: position });
  }

  destroy(): void {
    const root = this.root;
    this.root = undefined;
    this.listeners.clear();
    // React can't unmount a root while the page's own render is under way.
    queueMicrotask(() => root?.unmount());
  }

  readonly subscribe = (listener: Listener) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly snapshot = () => this.view;

  private update(change: Partial<TrackEngineView>) {
    this.view = { ...this.view, ...change };
    for (const listener of this.listeners) listener();
  }
}
