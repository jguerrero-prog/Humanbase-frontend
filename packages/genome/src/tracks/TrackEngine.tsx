import type { GenomeTracks } from '@humanbase/data';
import { GenomeTrackFigure, standaloneSvg, type GenomeTrackViewProps } from '@humanbase/ui';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import type { GenomeBrowserEngine, GenomeExportOptions, GenomeMountOptions, GenomeRegion, GenomeTrackArrangement } from '../GenomeBrowserEngine';
import { noArrangement } from '../genomeTrackList';
import { TrackPanel } from './TrackPanel';

type Listener = () => void;

/** What the page has asked the engine to show, read by the panel through useSyncExternalStore. */
export interface TrackEngineView {
  region: GenomeRegion;
  highlight: { chrom: string; position: number } | undefined;
  hidden: readonly string[];
  arrangement: GenomeTrackArrangement;
  markedGene: string | undefined;
}

export type DrawnTracks = Omit<GenomeTrackViewProps, 'onPan' | 'shift'>;

/**
 * The design system's own genome browser: it reads the track files through GenomeTracks
 * and draws ruler, sequence, score tracks and genes as SVG with tokens.
 */
export class TrackEngine implements GenomeBrowserEngine {
  private root: Root | undefined;
  private host: HTMLElement | undefined;
  private view: TrackEngineView;
  private readonly listeners = new Set<Listener>();
  private drawn: DrawnTracks | undefined;

  constructor(private readonly files: GenomeTracks) {
    this.view = { region: { chrom: 'chr1', start: 1, end: 1 }, highlight: undefined, hidden: [], arrangement: noArrangement, markedGene: undefined };
  }

  mount(container: HTMLElement, options: GenomeMountOptions): Promise<void> {
    // The panel renders into its own element, so the page can clear the container while React unmounts.
    const host = document.createElement('div');
    host.className = 'track-engine-host';
    container.append(host);
    this.host = host;
    this.view = { ...this.view, region: options.region, hidden: options.hidden ?? [], arrangement: options.arrangement ?? noArrangement };
    this.root = createRoot(host);
    this.root.render(
      <TrackPanel
        engine={this}
        files={this.files}
        assembly={options.assembly}
        tracks={options.tracks}
        trackMenu={options.trackMenu}
        onGeneSelect={options.onGeneSelect}
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

  showTracks(hidden: readonly string[]): void {
    this.update({ hidden });
  }

  arrangeTracks(arrangement: GenomeTrackArrangement): void {
    this.update({ arrangement });
  }

  markGene(name: string | undefined): void {
    this.update({ markedGene: name });
  }

  /** Keeps what the panel last drew, so an export draws the same tracks and data. */
  remember(drawn: DrawnTracks): void {
    this.drawn = drawn;
  }

  exportSvg({ width, highlights, guideline, title }: GenomeExportOptions): Promise<Blob> {
    const { drawn, host } = this;
    if (!drawn || !host) return Promise.reject(new Error('The genome browser hasn’t drawn its tracks yet.'));
    // The figure is drawn on the page for a moment, so its colors and fonts come from the page's tokens.
    const holder = document.createElement('div');
    holder.className = 'track-engine-export';
    host.append(holder);
    const root = createRoot(holder);
    try {
      flushSync(() => root.render(<GenomeTrackFigure {...drawn} width={width} marks={highlights} guide={guideline} title={title} />));
      const svg = holder.querySelector('svg');
      return svg ? Promise.resolve(standaloneSvg(svg)) : Promise.reject(new Error('The figure didn’t draw.'));
    } finally {
      root.unmount();
      holder.remove();
    }
  }

  destroy(): void {
    const root = this.root;
    this.root = undefined;
    this.host = undefined;
    this.drawn = undefined;
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
