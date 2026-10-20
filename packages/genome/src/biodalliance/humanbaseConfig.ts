import type { Assembly } from '../GenomeBrowserEngine';

// The live Humanbase site's Biodalliance setup (hb.flatironinstitute.org, October 2026).
// A fork that configures Biodalliance differently replaces this file or passes its own config to BiodallianceEngine.

export const humanbaseTracks = 'https://humanbase.s3.amazonaws.com/tracks';

const grch37 = { speciesName: 'Human', taxon: 9606, auth: 'GRCh', version: '37', ucscName: 'hg19' };
const grch38 = { speciesName: 'Human', taxon: 9606, auth: 'GRCh', version: '38', ucscName: 'hg38' };

const gencode19 = {
  name: 'GENCODE 19',
  desc: 'Gene structures from GENCODE 19',
  bwgURI: `${humanbaseTracks}/gencode.bb`,
  stylesheet_uri: `${humanbaseTracks}/gencode.xml`,
  collapseSuperGroups: true,
  trixURI: `${humanbaseTracks}/geneIndex.ix`,
};

const chromHmm = {
  name: 'GM12878 ChromHMM',
  desc: 'GM12878 ChromHMM Genome Segmentation',
  pennant: 'https://genome.ucsc.edu/images/encodeThumbnail.jpg',
  disabled: true,
  bwgURI: `${humanbaseTracks}/gm12878.ChromHMM.bb`,
  style: [
    { type: 'bigbed', style: { glyph: 'BOX', FGCOLOR: 'black', BGCOLOR: 'blue', HEIGHT: 8, BUMP: false, LABEL: false, ZINDEX: 20, BGITEM: true, id: 'style1' } },
    { type: 'bb-translation', style: { glyph: 'BOX', FGCOLOR: 'black', BGITEM: true, BGCOLOR: 'red', HEIGHT: 10, BUMP: true, ZINDEX: 20, id: 'style2' } },
    { type: 'bb-transcript', style: { glyph: 'BOX', FGCOLOR: 'black', BGCOLOR: 'white', HEIGHT: 10, ZINDEX: 10, BUMP: true, LABEL: true, id: 'style3' } },
  ],
};

export interface BiodallianceAssembly {
  coordSystem: Record<string, unknown>;
  sources: readonly Record<string, unknown>[];
}

export const humanbaseAssemblies: Record<Assembly, BiodallianceAssembly> = {
  hg19: {
    coordSystem: grch37,
    sources: [
      { name: 'Genome', twoBitURI: `${humanbaseTracks}/hg19.2bit`, tier_type: 'sequence', pinned: true },
      gencode19,
      { name: 'Conservation', desc: 'Conservation', bwgURI: `${humanbaseTracks}/phastCons46way.bw`, noDownsample: true, disabled: true },
      chromHmm,
    ],
  },
  hg38: {
    coordSystem: grch38,
    sources: [
      { name: 'Genome', twoBitURI: `${humanbaseTracks}/GRCh38/hg38.2bit`, tier_type: 'sequence', pinned: true },
      {
        name: 'GENCODE 21',
        desc: 'Gene structures from GENCODE 21',
        bwgURI: `${humanbaseTracks}/GRCh38/gencode.v21.annotation.bb`,
        stylesheet_uri: `${humanbaseTracks}/GRCh38/gencode2.xml`,
        collapseSuperGroups: true,
        trixURI: `${humanbaseTracks}/GRCh38/gencode.v21.annotation.ix`,
      },
      { ...gencode19, mapping: 'hg19ToHg38', disabled: true },
    ],
  },
};

/** Browser options the live site sets, plus the ones this front end needs: its own toolbar, and no cross-origin workers. */
export const humanbaseBrowserOptions: Record<string, unknown> = {
  noPersistView: true,
  fullScreen: false,
  noTitle: true,
  noHelp: true,
  rulerLocation: 'left',
  singleBaseHighlight: false,
  maxHeight: 1000,
  noPersist: true,
  disablePoweredBy: true,
  chains: { hg19ToHg38: { uri: `${humanbaseTracks}/GRCh38/hg19ToHg38.bb`, type: 'bigbed', coords: grch37 } },
  // The page draws location, zoom and variant controls, so Biodalliance's own toolbar is hidden.
  noLocationField: true,
  noZoomSlider: true,
  noLeapButtons: true,
  noTrackAdder: true,
  noExport: true,
  noOptions: true,
  noClearHighlightsButton: true,
  // Tracks load on the main thread; this is the setup the live checks cover.
  useFetchWorkers: false,
};
