import type { GenomeTracks } from '@humanbase/data';

export type Assembly = 'hg19' | 'hg38';

/** A stretch of one chromosome, 1-based and inclusive, with the chr prefix, such as chr1:2,230,000-2,440,000. */
export interface GenomeRegion {
  chrom: string;
  start: number;
  end: number;
}

interface DataTrackBase {
  name: string;
  /** The line under the track's name, such as "Model score, −0.4 to 3". */
  meta?: string;
  /** The page's own description of how to draw it, one rule or several; each engine reads the parts it understands. Colors may be design tokens, such as var(--viz-seq-6). */
  style?: Record<string, unknown> | readonly Record<string, unknown>[];
}

/** A score track a page adds to the engine's own tracks, such as the ASD disease impact scores. */
export interface GenomeScoreTrack extends DataTrackBase {
  /** A bigWig file the engine reads in byte ranges. */
  bigWigUrl: string;
  /** The scores' range, drawn from bottom to top of the track; bars grow from 0. */
  range?: readonly [number, number];
}

/** A segment track, such as chromatin states: a bigBed file whose segments are drawn in the file's own colors. */
export interface GenomeSegmentTrack extends DataTrackBase {
  bigBedUrl: string;
}

export type GenomeDataTrack = GenomeScoreTrack | GenomeSegmentTrack;

export const isSegmentTrack = (track: GenomeDataTrack): track is GenomeSegmentTrack => 'bigBedUrl' in track;

export const trackFile = (track: GenomeDataTrack) => (isSegmentTrack(track) ? track.bigBedUrl : track.bigWigUrl);

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
  /** Tracks left out from the start, by id (see genomeTrackList). */
  hidden?: readonly string[] | undefined;
}

/** The Export dialog's choices. */
export interface GenomeExportOptions {
  /** The tracks' width in pixels, beside the header column. */
  width: number;
  /** Includes the selected variant's marks. */
  highlights: boolean;
  /** Includes the vertical guideline through every track. */
  guideline: boolean;
  /** A line above the tracks, such as the location and assembly; none when left out. */
  title?: string | undefined;
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
  /** Shows every track but these, by id. */
  showTracks(hidden: readonly string[]): void;
  /** The current view as an SVG file. */
  exportSvg(options: GenomeExportOptions): Promise<Blob>;
  destroy(): void;
}

/** Makes an engine; files reads the track files, from S3 with the API on or the samples with it off. */
export type GenomeBrowserEngineFactory = (files: GenomeTracks) => GenomeBrowserEngine;

export const withChr = (chrom: string) => (chrom.startsWith('chr') ? chrom : `chr${chrom}`);

export const sameRegion = (a: GenomeRegion, b: GenomeRegion) => withChr(a.chrom) === withChr(b.chrom) && Math.round(a.start) === Math.round(b.start) && Math.round(a.end) === Math.round(b.end);
