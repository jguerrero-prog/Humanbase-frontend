import { scoreTrackHeight } from '@humanbase/ui';
import { isSegmentTrack, type Assembly, type GenomeDataTrack } from '../GenomeBrowserEngine';
import { humanbaseTracks } from '../humanbaseFiles';

// The live Humanbase site's Biodalliance setup (hb.flatironinstitute.org, October 2026).
// A fork that configures Biodalliance differently replaces this file or passes its own config to BiodallianceEngine.

const grch37 = { speciesName: 'Human', taxon: 9606, auth: 'GRCh', version: '37', ucscName: 'hg19' };
const grch38 = { speciesName: 'Human', taxon: 9606, auth: 'GRCh', version: '38', ucscName: 'hg38' };

// The live site's gencode.xml rules (pseudogenes, RNA genes, then the rest), in the genome browser docs' colors:
// genes in --text-secondary (grey 600); pseudogenes lighter, as on the live site.
const geneBox = (fg: string, bg: string, labelled: boolean) => ({ glyph: 'BOX', HEIGHT: 10, FGCOLOR: fg, BGCOLOR: bg, ...(labelled ? { BUMP: 'yes', LABEL: 'yes' } : {}) });
const geneRules = (method: string | undefined, transcript: [string, string], exon: [string, string]) =>
  ['bb-transcript', 'transcript'].flatMap((type, index) => [
    { type, ...(method ? { method } : {}), style: geneBox(...transcript, true) },
    { type: ['bb-translation', 'translation'][index], ...(method ? { method } : {}), style: geneBox(...exon, false) },
  ]);

export const humanbaseGeneStyle = [
  ...geneRules('.*pseudogene.*', ['var(--text-muted)', 'var(--surface-page)'], ['var(--text-muted)', 'var(--text-muted)']),
  ...geneRules('.*RNA.*', ['var(--text-secondary)', 'var(--text-secondary)'], ['var(--text-secondary)', 'var(--text-secondary)']),
  ...geneRules(undefined, ['var(--text-secondary)', 'var(--surface-page)'], ['var(--text-secondary)', 'var(--text-secondary)']),
];

// title and desc are what the design system's track headers show (title, then the line under it).
const gencode19 = {
  name: 'GENCODE 19',
  title: 'Genes',
  desc: 'GENCODE 19',
  bwgURI: `${humanbaseTracks}/gencode.bb`,
  style: humanbaseGeneStyle,
  collapseSuperGroups: true,
  trixURI: `${humanbaseTracks}/geneIndex.ix`,
};

/** The live site's GM12878 ChromHMM style: BGITEM fills each segment with the file's own itemRgb. */
export const chromHmmStyle = [
  { type: 'bigbed', style: { glyph: 'BOX', FGCOLOR: 'black', BGCOLOR: 'blue', HEIGHT: 8, BUMP: false, LABEL: false, ZINDEX: 20, BGITEM: true, id: 'style1' } },
  { type: 'bb-translation', style: { glyph: 'BOX', FGCOLOR: 'black', BGITEM: true, BGCOLOR: 'red', HEIGHT: 10, BUMP: true, ZINDEX: 20, id: 'style2' } },
  { type: 'bb-transcript', style: { glyph: 'BOX', FGCOLOR: 'black', BGCOLOR: 'white', HEIGHT: 10, ZINDEX: 10, BUMP: true, LABEL: true, id: 'style3' } },
];

/** A page's track in Biodalliance's style: scores as viz-seq-6 bars over their range, segments as ChromHMM, a fallback color as BGCOLOR. */
export function trackStyle(track: GenomeDataTrack): Record<string, unknown>[] {
  if (isSegmentTrack(track)) return track.fallbackColor ? chromHmmStyle.map((rule) => ({ ...rule, style: { ...rule.style, BGCOLOR: track.fallbackColor } })) : chromHmmStyle;
  const range = track.range && { MIN: track.range[0], MAX: track.range[1] };
  return [{ type: 'default', style: { glyph: 'HISTOGRAM', BGCOLOR: 'var(--viz-seq-6)', HEIGHT: scoreTrackHeight, ...range } }];
}

export interface BiodallianceAssembly {
  coordSystem: Record<string, unknown>;
  sources: readonly Record<string, unknown>[];
}

export const humanbaseAssemblies: Record<Assembly, BiodallianceAssembly> = {
  hg19: {
    coordSystem: grch37,
    sources: [
      { name: 'Genome', title: 'Position', twoBitURI: `${humanbaseTracks}/hg19.2bit`, tier_type: 'sequence', pinned: true },
      gencode19,
      // Conservation and GM12878 ChromHMM are page tracks (suggestedTracks), so the Tracks drawer can show and hide them.
    ],
  },
  hg38: {
    coordSystem: grch38,
    sources: [
      { name: 'Genome', title: 'Position', twoBitURI: `${humanbaseTracks}/GRCh38/hg38.2bit`, tier_type: 'sequence', pinned: true },
      {
        name: 'GENCODE 21',
        title: 'Genes',
        desc: 'GENCODE 21',
        bwgURI: `${humanbaseTracks}/GRCh38/gencode.v21.annotation.bb`,
        style: humanbaseGeneStyle,
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
  noTrackEditor: true,
  // The design system draws track headers and score ranges beside the tracks, so Biodalliance's are off.
  rulerLocation: 'none',
  // Only Biodalliance's layout stylesheet loads (see BiodallianceEngine); its Bootstrap and Font Awesome don't.
  noSourceCSS: true,
  tierBackgroundColors: ['var(--surface-page)', 'var(--surface-page)'],
  // Genome browser docs: the selected variant is a 1px ink line at 50% through all tracks.
  defaultHighlightFill: 'var(--text-default)',
  defaultHighlightAlpha: 0.5,
  // The design draws the sequence as plain letters, so every base shares one neutral color.
  baseColors: { A: 'var(--text-secondary)', C: 'var(--text-secondary)', G: 'var(--text-secondary)', T: 'var(--text-secondary)', '-': 'var(--text-muted)', I: 'var(--text-muted)' },
  // The coded genome browser places tracks 60px apart; this keeps that pitch when no score is in view.
  minTierHeight: 60,
  // Tracks load on the main thread; this is the setup the live checks cover.
  useFetchWorkers: false,
};
