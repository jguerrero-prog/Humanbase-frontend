import { jobScoreTypes, scoreTypeLabel, type DeepseaJob, type ScoreType } from '@humanbase/data';
import { scoreTrack, type GenomeScoreTrack } from '@humanbase/genome';

const isExpecto = (type: ScoreType) => type.short_name === 'expecto';
// humanbase.io's ranges for a job's tracks: ExPecto's signed expression effect over −0.5 to 0.5, every other score over 0 to 3.
const rangeOf = (type: ScoreType): readonly [number, number] => (isExpecto(type) ? [-0.5, 0.5] : [0, 3]);

/** The job's own score files as genome tracks, as humanbase.io draws them: one per plotted score type with a bigWig file, in the job's score type order. */
export function jobScoreTracks(job: DeepseaJob, types: readonly ScoreType[]): GenomeScoreTrack[] {
  return jobScoreTypes(job.model, types).flatMap((type) => {
    const file = job.scoreTrackFile(type);
    return file ? [scoreTrack({ name: scoreTypeLabel(type), source: 'This job', bigWigUrl: file.url, range: rangeOf(type) })] : [];
  });
}
