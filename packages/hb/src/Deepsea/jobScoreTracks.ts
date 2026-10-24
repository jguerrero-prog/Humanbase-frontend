import { scoreTypeLabel, type DeepseaJob, type ScoreType } from '@humanbase/data';
import { scoreTrack, type GenomeScoreTrack } from '@humanbase/genome';

// humanbase.io's ranges for a job's tracks: ExPecto's signed expression effect over −0.5 to 0.5, every other score over 0 to 3.
const rangeOf = (type: ScoreType): readonly [number, number] => (type.short_name === 'expecto' ? [-0.5, 0.5] : [0, 3]);

/** The job's own score files as genome tracks, one per variant-level score type that has a bigWig file, as humanbase.io draws them. */
export function jobScoreTracks(job: DeepseaJob, types: readonly ScoreType[]): GenomeScoreTrack[] {
  return types.flatMap((type) => {
    const file = job.scoreTrackFile(type.short_name);
    return file ? [scoreTrack({ name: scoreTypeLabel(type), source: 'This job', bigWigUrl: file.url, range: rangeOf(type) })] : [];
  });
}
