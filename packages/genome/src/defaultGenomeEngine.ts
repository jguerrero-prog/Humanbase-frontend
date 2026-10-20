import type { GenomeBrowserEngineFactory } from './GenomeBrowserEngine';
import { BiodallianceEngine } from './biodalliance/BiodallianceEngine';

/** The engine pages use when the API is on. A fork with its own Biodalliance setup changes this line. */
export const defaultGenomeEngine: GenomeBrowserEngineFactory = () => new BiodallianceEngine();
