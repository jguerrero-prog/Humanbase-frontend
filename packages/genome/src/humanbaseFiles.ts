import type { GenomeSegmentTrack } from './GenomeBrowserEngine';

/** Where the live Humanbase site keeps its genome files, for every engine. */
export const humanbaseTracks = 'https://humanbase.s3.amazonaws.com/tracks';

/** The live site's GM12878 ChromHMM track, each segment in the file's own itemRgb. */
export const chromHmmTrack: GenomeSegmentTrack = { name: 'GM12878 ChromHMM', meta: 'Genome segmentation', bigBedUrl: `${humanbaseTracks}/gm12878.ChromHMM.bb` };
