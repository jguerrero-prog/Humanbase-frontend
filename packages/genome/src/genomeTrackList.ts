import { assemblyNames, type UserTrack } from '@humanbase/data';
import { chromHmm, humanbaseTracks } from './biodalliance/humanbaseConfig';
import type { Assembly, GenomeDataTrack } from './GenomeBrowserEngine';

/** One track a browser can show or hide; data tracks use their name as id. */
export interface GenomeTrackEntry {
  id: string;
  name: string;
  meta: string;
}

export const sequenceTrack = 'sequence';
export const genesTrack = 'genes';

const geneSets: Record<Assembly, string> = { hg19: 'GENCODE 19', hg38: 'GENCODE 21' };

export const builtInTracks = (assembly: Assembly) => ({
  sequence: { id: sequenceTrack, name: 'Sequence', meta: assemblyNames[assembly] },
  genes: { id: genesTrack, name: 'Genes', meta: geneSets[assembly] },
});

/** Every track a browser draws, in the order it draws them: sequence, the data tracks, then genes. */
export function genomeTrackList(assembly: Assembly, tracks: readonly GenomeDataTrack[]): GenomeTrackEntry[] {
  const { sequence, genes } = builtInTracks(assembly);
  return [sequence, ...tracks.map((track) => ({ id: track.name, name: track.name, meta: track.meta ?? '' })), genes];
}

const conservationRange = [0, 1] as const;

/** Bars in viz-seq-6 from the range's bottom to its top, as the live site draws Conservation. */
const barStyle = ([min, max]: readonly [number, number]) => ({ type: 'default', style: { glyph: 'HISTOGRAM', BGCOLOR: 'var(--viz-seq-6)', HEIGHT: 50, MIN: min, MAX: max } });
const number = new Intl.NumberFormat('en-US', { maximumSignificantDigits: 4 });
const withMinus = (value: number) => number.format(value).replace('-', '−');

/** Tracks the live site offers beside the page's own, from the same files; hg19 only, as no GRCh38 copies exist. */
export const suggestedTracks: Record<Assembly, readonly GenomeDataTrack[]> = {
  hg19: [
    {
      name: 'Conservation',
      meta: 'phastCons 46-way, 0 to 1',
      bigWigUrl: `${humanbaseTracks}/phastCons46way.bw`,
      range: conservationRange,
      style: barStyle(conservationRange),
    },
    { name: chromHmm.name, meta: 'Genome segmentation', bigBedUrl: chromHmm.bigBedUrl, style: chromHmm.style },
  ],
  hg38: [],
};

/** Suggested tracks start hidden, as on the live site. */
export const hiddenByDefault = (assembly: Assembly): string[] => suggestedTracks[assembly].map((track) => track.name);

/** A track someone added: a bigWig drawn as bars over the file's own range, or a bigBed drawn as ChromHMM is, in the file's colors. */
export function userDataTrack(track: UserTrack): GenomeDataTrack {
  if (track.kind === 'bigBed') return { name: track.name, meta: track.source, bigBedUrl: track.key, style: chromHmm.style };
  const range = track.range ?? [0, 1];
  return { name: track.name, meta: `${track.source}, ${withMinus(range[0])} to ${withMinus(range[1])}`, bigWigUrl: track.key, range, style: barStyle(range) };
}
