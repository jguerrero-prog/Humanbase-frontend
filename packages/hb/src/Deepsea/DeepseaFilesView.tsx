import { useDeepseaFeatures, useDeepseaInputCount, type DeepseaJob } from '@humanbase/data';
import { ContextLabel, Icon, ResultFiles, type JobStep } from '@humanbase/ui';
import type { ReactNode } from 'react';
import { jobDateTime, JobWaiting } from '../Jobs/JobPage';
import { deepseaJobCrumbs } from './DeepseaForm';

export interface DeepseaFilesViewProps {
  job: DeepseaJob;
  title: string;
  /** Copy link and Rename. */
  tools: ReactNode;
}

/** A job's result files in the job page's words; links only once the job has finished. */
export function DeepseaResultFiles({ job, linked }: { job: DeepseaJob; linked: boolean }) {
  const files = job.resultFiles.filter((file) => !linked || file.key !== 'gz_file');
  if (!files.length) return null;
  return (
    <section className="deepsea-files" aria-label="Result files">
      <h2>Result files</h2>
      <ResultFiles files={files.map((file) => ({ name: file.key === 'uploaded_query' ? 'Your query' : file.name, holds: file.holds, format: file.format, href: linked ? file.url : undefined }))} />
    </section>
  );
}

/** A finished Sei, Beluga or Seqweaver job whose input humanbase.io doesn't plot: its results are files to download. */
export function DeepseaFilesView({ job, title, tools }: DeepseaFilesViewProps) {
  const profiles = useDeepseaFeatures(job.model.id).data?.model_features?.length;
  const inputs = useDeepseaInputCount(job).data;
  const archive = job.resultFiles.find((file) => file.key === 'gz_file');
  const steps: JobStep[] = [
    { label: 'Submitted', detail: jobDateTime.format(job.created), state: 'done' },
    { label: 'Queued', state: 'done' },
    { label: 'Ran', state: 'done' },
    { label: 'Results ready', state: 'done' },
  ];
  return (
    <JobWaiting
      title={title}
      crumbs={deepseaJobCrumbs(job.model, title)}
      status="finished"
      badge="Finished"
      next={{ title: 'Download the results', text: job.filesSummary(profiles, inputs) }}
      actions={
        archive && (
          <a className="button button-primary button-medium" href={archive.url}>
            <Icon name="download" size={16} />
            Download everything ({archive.format})
          </a>
        )
      }
      steps={steps}
      details={
        <>
          <ContextLabel name="Tool" value={job.model.tool} />
          <ContextLabel name="Input" value={job.inputLabel} />
        </>
      }
      tools={tools}
    >
      <DeepseaResultFiles job={job} linked />
    </JobWaiting>
  );
}
