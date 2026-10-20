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
  /** A bigWig file the engine reads in byte ranges. */
  bigWigUrl: string;
  /** The page's own description of how to draw it; each engine reads the parts it understands. */
  style?: Record<string, unknown>;
}

export interface GenomeBrowserEvents {
  /** Called after someone drags or zooms inside the engine. */
  onRegionChange?: (region: GenomeRegion) => void;
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
