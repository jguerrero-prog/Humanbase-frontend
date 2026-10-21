export type Assembly = 'hg19' | 'hg38';

/** A stretch of one chromosome, 1-based and inclusive, with the chr prefix, such as chr1:2,230,000-2,440,000. */
export interface GenomeRegion {
  chrom: string;
  start: number;
  end: number;
}

/** A data track a page adds to the engine's own tracks, such as the ASD disease impact scores. */
export interface GenomeDataTrack {
  name: string;
  /** Where the scores come from and their range, shown under the track's name, such as "Model score, −0.4 to 3". */
  meta?: string;
  /** A bigWig file the engine reads in byte ranges. */
  bigWigUrl: string;
  /** The page's own description of how to draw it; each engine reads the parts it understands. Colors may be design tokens, such as var(--viz-seq-6). */
  style?: Record<string, unknown>;
}

/** Where one track sits inside the engine, so the page can draw its header beside it. */
export interface GenomeTrackLayout {
  name: string;
  meta?: string | undefined;
  top: number;
  height: number;
}

export interface GenomeBrowserEvents {
  /** Called after someone drags or zooms inside the engine. */
  onRegionChange?: (region: GenomeRegion) => void;
  /**
   * Called when tracks are added, resized or reordered. An engine that reports its tracks
   * gets the design system's track headers; one that draws its own labels can leave this out.
   */
  onTrackLayout?: (tracks: readonly GenomeTrackLayout[]) => void;
}

export interface GenomeMountOptions extends GenomeBrowserEvents {
  /** Names the browser for screen readers, such as "Genome browser, chr1:2,230,000-2,440,000". */
  label: string;
  assembly: Assembly;
  region: GenomeRegion;
  tracks: readonly GenomeDataTrack[];
}

/**
 * Anything that can draw a genome region. Pages only talk to this interface,
 * so a fork can swap in another engine, or Biodalliance configured its own way.
 */
export interface GenomeBrowserEngine {
  /** Draws into the container; resolves once the engine is ready to take a region. */
  mount(container: HTMLElement, options: GenomeMountOptions): Promise<void>;
  showRegion(region: GenomeRegion): void;
  /** Marks one position, such as the selected variant; undefined clears the mark. */
  highlight(position: { chrom: string; position: number } | undefined): void;
  destroy(): void;
}

export type GenomeBrowserEngineFactory = () => GenomeBrowserEngine;

export const withChr = (chrom: string) => (chrom.startsWith('chr') ? chrom : `chr${chrom}`);

export const sameRegion = (a: GenomeRegion, b: GenomeRegion) => withChr(a.chrom) === withChr(b.chrom) && Math.round(a.start) === Math.round(b.start) && Math.round(a.end) === Math.round(b.end);
