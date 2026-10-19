import { ApiError, useDeepseaJob, type DeepseaJob } from '@humanbase/data';
import { Alert, ContextLabel, EmptyState, ResultFiles, Skeleton, type JobStep } from '@humanbase/ui';
import { useEffect } from 'react';
import { elapsed, jobDateTime, JobWaiting, syncJobHistory, useJobActions, useJobTitle } from '../Jobs/JobPage';
import { deepseaFormLink, deepseaJobLink } from './DeepseaForm';
import { DeepseaResultView } from './DeepseaResultView';
import './Deepsea.css';

export interface DeepseaJobViewProps {
  id: string;
  variant?: string | undefined;
  onVariantChange?: ((id: string) => void) | undefined;
}

function stepsOf(job: DeepseaJob, now: number): JobStep[] {
  const submitted: JobStep = { label: 'Submitted', detail: jobDateTime.format(job.created), state: 'done' };
  if (job.status === 'queued') return [submitted, { label: 'Queued', detail: 'Waiting to start', state: 'current' }, { label: 'Running', state: 'upcoming' }, { label: 'Results ready', state: 'upcoming' }];
  if (job.status === 'failed') return [submitted, { label: 'Queued', state: 'done' }, { label: 'Running', detail: job.failure ? `Stopped: ${job.failure}` : 'Stopped before it finished', state: 'stopped' }];
  return [submitted, { label: 'Queued', state: 'done' }, { label: 'Running', detail: `${elapsed(job.created, now)} so far.`, state: 'current' }, { label: 'Results ready', state: 'upcoming' }];
}

/** A Sei, Beluga or Seqweaver job: its progress while it runs, then its results. */
export function DeepseaJobView({ id, variant, onVariantChange }: DeepseaJobViewProps) {
  const job = useDeepseaJob(id);
  const data = job.data;
  const { title, rename } = useJobTitle(data && { id: data.id, tool: data.model.tool, title: data.title });
  const { copyButton, renameButton, overlays } = useJobActions(title, rename);
  // When the job was last read; elapsed times move on with each poll.
  const now = job.dataUpdatedAt;

  useEffect(() => {
    if (data) syncJobHistory({ id: data.id, tool: data.model.tool, title: data.title, status: data.status, created: data.created }, deepseaJobLink(data.id), data.model.tool);
  }, [data]);

  if (job.isError) {
    return job.error instanceof ApiError && job.error.isNotFound ? (
      <EmptyState
        title="This job isn’t available"
        text="No job has this link. Check that it was copied whole, or run Sei, Beluga or Seqweaver again."
        actions={
          <a className="button button-secondary" href="/sei/">
            Run a sequence model
          </a>
        }
      />
    ) : (
      <Alert tone="error" title="This job couldn’t load" action={{ label: 'Try again', onSelect: () => void job.refetch() }}>
        Humanbase didn’t answer. The job keeps running, so trying again in a moment is safe.
      </Alert>
    );
  }

  if (!data) {
    return (
      <div className="job-page" aria-busy="true">
        <Skeleton width="240px" />
        <Skeleton width="420px" />
      </div>
    );
  }

  const tools = (
    <>
      {copyButton}
      {renameButton}
    </>
  );

  if (data.status === 'finished') {
    return (
      <>
        <title>{`Finished · ${title} · Humanbase`}</title>
        <DeepseaResultView job={data} title={title} tools={tools} variant={variant} onVariantChange={onVariantChange} />
        {overlays}
      </>
    );
  }

  const tool = data.model.tool;
  const badge = data.status === 'queued' ? 'Queued' : data.status === 'running' ? `Running for ${elapsed(data.created, now)}` : `Failed${data.failure ? `: ${data.failure}` : ''}`;
  return (
    <>
      <title>{`${badge} · ${title} · Humanbase`}</title>
      <JobWaiting
        title={title}
        status={data.status}
        badge={badge}
        note={data.status === 'running' ? `${elapsed(data.created, now)} so far.` : data.status === 'queued' ? 'Waiting for a worker to start it.' : undefined}
        next={
          data.status === 'failed'
            ? { title: 'What to do', text: `The job stopped before it finished. Check the file against the ${tool} rules and run it again.` }
            : { title: 'You can leave this page', text: 'Jobs in the top bar shows its progress from any page, and the link works on any device. If you gave an email address, the results link is sent there too.' }
        }
        actions={
          data.status === 'failed' && (
            <a className="button button-secondary button-medium" href={deepseaFormLink(data.model.id)}>
              Run {tool} again
            </a>
          )
        }
        steps={stepsOf(data, now)}
        details={
          <>
            <ContextLabel name="Tool" value={tool} />
            <ContextLabel name="Genome" value={data.genome} />
            <ContextLabel name="Input" value={data.kind.toUpperCase()} />
          </>
        }
        tools={tools}
      >
        {data.status !== 'failed' && data.resultFiles.length > 0 && (
          <section className="deepsea-files" aria-label="Result files">
            <h2>Result files</h2>
            <ResultFiles files={data.resultFiles.map((file) => ({ name: file.key === 'uploaded_query' ? 'Your query' : file.name, holds: file.holds, format: file.format }))} />
          </section>
        )}
      </JobWaiting>
      {overlays}
    </>
  );
}
