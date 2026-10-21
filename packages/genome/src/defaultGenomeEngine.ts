import type { GenomeBrowserEngineFactory } from './GenomeBrowserEngine';
import { TrackEngine } from './tracks/TrackEngine';

/** The engine pages use: the design system's own tracks. A fork can return new BiodallianceEngine() here instead. */
export const defaultGenomeEngine: GenomeBrowserEngineFactory = (files) => new TrackEngine(files);
