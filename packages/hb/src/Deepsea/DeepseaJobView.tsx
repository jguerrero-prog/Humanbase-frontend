import { ApiError, useDeepseaJob } from '@humanbase/data';
import { ContextLabel, useLinkHref } from '@humanbase/ui';
import { useEffect } from 'react';
import { JobLoadError, JobLoading, jobProgress, JobWaiting, syncJobHistory, useJobActions, useJobTitle } from '../Jobs/JobPage';
import { DeepseaFilesView, DeepseaResultFiles } from './DeepseaFilesView';
import { deepseaFormLink, deepseaJobCrumbs, deepseaJobLink } from './DeepseaForm';
import { DeepseaResultView } from './DeepseaResultView';
import { InsilicoResultView } from './InsilicoResultView';
import './Deepsea.css';

export interface DeepseaJobViewProps {
  id: string;
  variant?: string | undefined;
  onVariantChange?: ((id: string) => void) | undefined;
  /** A BED job's region open in its genome browser. */
  region?: string | undefined;
  onRegionChange?: ((region: string | undefined) => void) | undefined;
}

/** A Sei, Beluga or Seqweaver job: its progress while it runs, then its results. */
export function DeepseaJobView({ id, variant, onVariantChange, region, onRegionChange }: DeepseaJobViewProps) {
  const linkHref = useLinkHref();
  const job = useDeepseaJob(id);
  const data = job.data;
  const { title, rename } = useJobTitle(data && { id: data.id, tool: data.model.inSentence ?? data.model.tool, title: data.title });
  const { copyButton, renameButton, overlays } = useJobActions(title, rename);
  // When the job was last read; elapsed times move on with each poll.
  const now = job.dataUpdatedAt;

  useEffect(() => {
    if (data) syncJobHistory({ id: data.id, tool: data.model.tool, title: data.title, status: data.status, created: data.created }, deepseaJobLink(data.id), data.model.tool);
  }, [data]);

  if (job.isError) {
    return (
      <JobLoadError
        missing={job.error instanceof ApiError && job.error.isNotFound}
        notFound={{ title: 'This job isn’t available', text: 'No job has this link. Check that it was copied whole, or run Sei, Beluga or Seqweaver again.', run: { label: 'Run a sequence model', href: deepseaFormLink('sei') } }}
        onRetry={() => void job.refetch()}
      />
    );
  }

  if (!data) return <JobLoading />;

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
        {data.model.insilico ? (
          <InsilicoResultView job={data} title={title} tools={tools} />
        ) : !data.plotsScores ? (
          <DeepseaFilesView job={data} title={title} tools={tools} region={region} onRegionChange={onRegionChange} />
        ) : (
          <DeepseaResultView job={data} title={title} tools={tools} variant={variant} onVariantChange={onVariantChange} />
        )}
        {overlays}
      </>
    );
  }

  const tool = data.model.tool;
  const named = data.model.inSentence ?? tool;
  const sequences = data.sequenceNames.length;
  const { badge, note, steps } = jobProgress(data, now);
  return (
    <>
      <title>{`${badge} · ${title} · Humanbase`}</title>
      <JobWaiting
        title={title}
        crumbs={deepseaJobCrumbs(data.model, title)}
        status={data.status}
        badge={badge}
        note={note}
        next={
          data.status === 'failed'
            ? { title: 'What to do', text: `The job stopped before it finished. Check the file against the ${tool} rules and run it again.` }
            : { title: 'You can leave this page', text: 'Jobs in the top bar shows its progress from any page, and the link works on any device. If you gave an email address, the results link is sent there too.' }
        }
        actions={
          data.status === 'failed' && (
            <a className="button button-secondary button-medium" href={linkHref(deepseaFormLink(data.model.id))}>
              Run {named} again
            </a>
          )
        }
        steps={steps}
        details={
          <>
            <ContextLabel name="Tool" value={tool} />
            <ContextLabel name="Genome" value={data.genome} />
            <ContextLabel name="Input" value={sequences ? `${sequences} ${sequences === 1 ? 'sequence' : 'sequences'}, FASTA` : data.kind.toUpperCase()} />
          </>
        }
        tools={tools}
      >
        {data.status !== 'failed' && <DeepseaResultFiles job={data} linked={false} />}
      </JobWaiting>
      {overlays}
    </>
  );
}
