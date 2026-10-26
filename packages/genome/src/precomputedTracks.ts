import type { GenomeScoreTrack } from './GenomeBrowserEngine';
import { scoreTrack } from './scoreTrack';

const tracks = 'https://s3-us-west-2.amazonaws.com/humanbase/tracks';
const impactRange = [-0.4, 3] as const;

/**
 * The precomputed DNA and RNA disease impact scores for every position (GRCh37/hg19), as the ASD Browser draws them.
 * `trainedOn` names the cohort where the page doesn't, as humanbase.io's /genome does with "(de novo ASD)".
 */
export function diseaseImpactTracks(trainedOn?: string): GenomeScoreTrack[] {
  return (['DNA', 'RNA'] as const).map((kind) =>
    scoreTrack({ name: `${kind} disease impact score${trainedOn ? ` (${trainedOn})` : ''}`, source: 'Model score', bigWigUrl: `${tracks}/dis_${kind.toLowerCase()}.bw`, range: impactRange }),
  );
}

/** Seqweaver's precomputed effect for gnomAD variants (log e-value, GRCh37/hg19), over the range the page draws: humanbase.io's /seqweaver 1.5 to 3, its /genome 0 to 3. */
export function seqweaverGnomadTrack(range: readonly [number, number]): GenomeScoreTrack {
  return scoreTrack({ name: 'Seqweaver gnomAD', source: 'log e-value', bigWigUrl: `${tracks}/seqweaver_gnomad.diff.meanlog.bw`, range });
}
