import { assemblyNames, type UserTrack } from '@humanbase/data';
import type { Assembly, GenomeDataTrack, GenomeTrackArrangement } from './GenomeBrowserEngine';
import { chromHmmTrack, humanbaseTracks } from './humanbaseFiles';
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

// A file's summary gives full float precision; four significant digits keep the header readable.
const rounded = (value: number) => Number(value.toPrecision(4));

/** Every track in its usual place, drawn as usual. */
export const noArrangement: GenomeTrackArrangement = { order: [], settings: {} };

/** Ids in the stored order; ids it doesn't list, such as a new track, keep their place after the track before them. */
export function inOrder(ids: readonly string[], order: readonly string[]): string[] {
  const placed = order.filter((id) => ids.includes(id));
  ids.forEach((id, index) => {
    if (placed.includes(id)) return;
    const before = ids.slice(0, index).findLast((other) => placed.includes(other));
    placed.splice(before === undefined ? 0 : placed.indexOf(before) + 1, 0, id);
  });
  return placed;
}

/** A track's place among the shown tracks moved by one, skipping hidden ones; the order is unchanged at either end. */
export function moveTrack(order: readonly string[], hidden: readonly string[], id: string, by: -1 | 1): string[] {
  const shown = order.filter((other) => !hidden.includes(other));
  const neighbor = shown[shown.indexOf(id) + by];
  if (!shown.includes(id) || neighbor === undefined) return [...order];
  return order.map((other) => (other === id ? neighbor : other === neighbor ? id : other));
}

/** Tracks the live site offers beside the page's own, from the same files; hg19 only, as no GRCh38 copies exist. */
export const suggestedTracks: Record<Assembly, readonly GenomeDataTrack[]> = {
  hg19: [
    scoreTrack({ name: 'Conservation', source: 'phastCons 46-way', bigWigUrl: `${humanbaseTracks}/phastCons46way.bw`, range: [0, 1] }),
    chromHmmTrack,
  ],
  hg38: [],
};

/** Suggested tracks start hidden, as on the live site. */
export const hiddenByDefault = (assembly: Assembly): string[] => suggestedTracks[assembly].map((track) => track.name);

/** A track someone added: a bigWig drawn as bars over the file's own range, or a bigBed drawn as ChromHMM is, in the file's colors. */
export function userDataTrack(track: UserTrack): GenomeDataTrack {
  if (track.kind === 'bigBed') return { name: track.name, meta: track.source, bigBedUrl: track.key, fallbackColor: 'var(--viz-seq-6)' };
  const [min, max] = track.range ?? [0, 1];
  return scoreTrack({ name: track.name, source: track.source, bigWigUrl: track.key, range: [rounded(min), rounded(max)] });
}
