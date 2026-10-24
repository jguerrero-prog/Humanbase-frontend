import { assemblyNames, type UserTrack } from '@humanbase/data';
import { chromHmm, humanbaseTracks } from './biodalliance/humanbaseConfig';
import type { Assembly, GenomeDataTrack } from './GenomeBrowserEngine';
import { scoreTrack } from './scoreTrack';

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

// Biodalliance falls back to BGCOLOR for a segment without itemRgb, so it gets the browser's track color too.
const userSegmentStyle = chromHmm.style.map((rule) => ({ ...rule, style: { ...rule.style, BGCOLOR: 'var(--viz-seq-6)' } }));
// A file's summary gives full float precision; four significant digits keep the header readable.
const rounded = (value: number) => Number(value.toPrecision(4));

/** Tracks the live site offers beside the page's own, from the same files; hg19 only, as no GRCh38 copies exist. */
export const suggestedTracks: Record<Assembly, readonly GenomeDataTrack[]> = {
  hg19: [
    scoreTrack({ name: 'Conservation', source: 'phastCons 46-way', bigWigUrl: `${humanbaseTracks}/phastCons46way.bw`, range: [0, 1] }),
    { name: chromHmm.name, meta: 'Genome segmentation', bigBedUrl: chromHmm.bigBedUrl, style: chromHmm.style },
  ],
  hg38: [],
};

/** Suggested tracks start hidden, as on the live site. */
export const hiddenByDefault = (assembly: Assembly): string[] => suggestedTracks[assembly].map((track) => track.name);

/** A track someone added: a bigWig drawn as bars over the file's own range, or a bigBed drawn as ChromHMM is, in the file's colors. */
export function userDataTrack(track: UserTrack): GenomeDataTrack {
  if (track.kind === 'bigBed') return { name: track.name, meta: track.source, bigBedUrl: track.key, style: userSegmentStyle };
  const [min, max] = track.range ?? [0, 1];
  return scoreTrack({ name: track.name, source: track.source, bigWigUrl: track.key, range: [rounded(min), rounded(max)] });
}
