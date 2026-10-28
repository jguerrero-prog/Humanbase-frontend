import { JobHistory, type JobEntry, type JobState } from '@humanbase/data';
import { Alert, Breadcrumbs, Button, Dialog, EmptyState, JobSteps, Skeleton, StatusBadge, TextInput, useLinkHref, type Crumb, type JobStep } from '@humanbase/ui';
import { useId, useMemo, useState, useSyncExternalStore, type ReactNode } from 'react';
import { useCopyLink } from './useCopyLink';
import './JobPage.css';

export interface JobIdentity {
  id: string;
  tool: string;
  title?: string | undefined;
}

export const jobDateTime = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });

/** "4 minutes", "1 hour": how long since a moment, in the words job pages use. */
export function elapsed(since: Date, now = Date.now()): string {
  const minutes = Math.floor((now - since.getTime()) / 60_000);
  if (minutes < 1) return 'less than a minute';
  if (minutes < 60) return `${minutes} ${minutes === 1 ? 'minute' : 'minutes'}`;
  const hours = Math.floor(minutes / 60);
  return `${hours} ${hours === 1 ? 'hour' : 'hours'}`;
}

/** The job's title, and Rename, which keeps a new title in this browser's job history because no endpoint renames a job. */
export function useJobTitle(job: JobIdentity | undefined, fallback = job ? `Untitled ${job.tool} job` : '') {
  const [renamed, setRenamed] = useState<string | undefined>();
  const stored = useSyncExternalStore(JobHistory.subscribe, () => JobHistory.snapshot(), () => '');
  const id = job?.id;
  const saved = useMemo(() => (id ? new JobHistory({ getItem: () => stored, setItem: () => undefined }).list().find((entry) => entry.id === id)?.title : undefined), [stored, id]);
  // What the job was named or renamed to; an empty rename goes back to the job's own title.
  const given = (renamed ?? saved) || job?.title || undefined;
  const rename = (next: string) => {
    if (!job) return;
    const history = new JobHistory();
    const entry = history.list().find((item) => item.id === job.id);
    if (entry) history.add({ ...entry, title: next || undefined });
    setRenamed(next);
  };
  return { title: given ?? fallback, given, rename };
}

/** Copy link and Rename, with the dialog Rename needs, titled "Rename this job" or another subject. */
export function useJobActions(title: string, rename: (title: string) => void, subject = 'job') {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');
  const { copyButton } = useCopyLink();
  const startRename = () => {
    setDraft(title);
    setRenaming(true);
  };
  const renameButton = (
    <Button variant="ghost" size="small" onClick={startRename}>
      Rename
    </Button>
  );
  const overlays = (
    <Dialog
      title={`Rename this ${subject}`}
      open={renaming}
      onClose={() => setRenaming(false)}
      actions={
        <>
          <Button variant="ghost" onClick={() => setRenaming(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              rename(draft.trim());
              setRenaming(false);
            }}
          >
            Rename
          </Button>
        </>
      }
    >
      <TextInput label="Title" value={draft} hint="Kept in this browser and shown in your job list." onChange={(event) => setDraft(event.target.value)} />
    </Dialog>
  );
  return { copyButton, renameButton, startRename, overlays };
}

/** Sets a job's status in this browser's job list. A job missing from the list is added only when newEntry is given. */
export function syncJobStatus(id: string, status: JobState, newEntry?: Omit<JobEntry, 'status'>) {
  const history = new JobHistory();
  const entry = history.list().find((item) => item.id === id);
  if (entry?.status === status) return;
  const next = entry ?? newEntry;
  if (next) history.add({ ...next, status });
}

/** Keeps this browser's job list in step with what the job page last read. */
export function syncJobHistory(job: JobIdentity & { status: JobState; created: Date }, link: string, detail: string) {
  syncJobStatus(job.id, job.status, { id: job.id, tool: job.tool, startedAt: job.created.toISOString(), link, title: job.title, detail });
}

export interface TimedJob {
  status: JobState;
  created: Date;
  failure?: string | undefined;
}

/** A queued, running or failed job's badge, note and steps. usualTime follows the time so far, such as "Jobs usually take 10 minutes." */
export function jobProgress(job: TimedJob, now: number, usualTime?: string): { badge: string; note: string | undefined; steps: JobStep[] } {
  const submitted: JobStep = { label: 'Submitted', detail: jobDateTime.format(job.created), state: 'done' };
  if (job.status === 'queued') {
    return {
      badge: 'Queued',
      note: 'Waiting for a worker to start it.',
      steps: [submitted, { label: 'Queued', detail: 'Waiting to start', state: 'current' }, { label: 'Running', state: 'upcoming' }, { label: 'Results ready', state: 'upcoming' }],
    };
  }
  if (job.status === 'failed') {
    return {
      badge: `Failed${job.failure ? `: ${job.failure}` : ''}`,
      note: undefined,
      steps: [submitted, { label: 'Queued', state: 'done' }, { label: 'Running', detail: job.failure ? `Stopped: ${job.failure}` : 'Stopped before it finished', state: 'stopped' }],
    };
  }
  const soFar = [`${elapsed(job.created, now)} so far.`, usualTime].filter(Boolean).join(' ');
  return {
    badge: `Running for ${elapsed(job.created, now)}`,
    note: soFar,
    steps: [submitted, { label: 'Queued', state: 'done' }, { label: 'Running', detail: soFar, state: 'current' }, { label: 'Results ready', state: 'upcoming' }],
  };
}

export interface JobLoadErrorProps {
  /** True when the API says no job has this link. */
  missing: boolean;
  /** What the page says when no job has this link, and where to run one. */
  notFound: { title: string; text: string; run: { label: string; href: string } };
  failedTitle?: string;
  onRetry: () => void;
}

/** A job page whose job couldn't be read: gone for good, or worth trying again. */
export function JobLoadError({ missing, notFound, failedTitle = 'This job couldn’t load', onRetry }: JobLoadErrorProps) {
  const linkHref = useLinkHref();
  return missing ? (
    <EmptyState
      title={notFound.title}
      text={notFound.text}
      actions={
        <a className="button button-secondary" href={linkHref(notFound.run.href)}>
          {notFound.run.label}
        </a>
      }
    />
  ) : (
    <Alert tone="error" title={failedTitle} action={{ label: 'Try again', onSelect: onRetry }}>
      Humanbase didn’t answer. The job keeps running, so trying again in a moment is safe.
    </Alert>
  );
}

/** A job page while its job is first read. */
export function JobLoading() {
  return (
    <div className="job-page" aria-busy="true">
      <Skeleton width="240px" />
      <Skeleton width="420px" />
    </div>
  );
}

export interface JobWaitingProps {
  title: string;
  /** Category, tool, then the job's title, as on the job's results. */
  crumbs: readonly Crumb[];
  status: JobState;
  /** The badge text, such as Running for 4 minutes. */
  badge: string;
  note?: string | undefined;
  next: { title: string; text: string };
  /** Shown under the next step, such as Edit and resubmit after a failure. */
  actions?: ReactNode;
  /** Shown below, such as the files the job will write. */
  children?: ReactNode;
  steps: readonly JobStep[];
  details: ReactNode;
  tools: ReactNode;
}

/** A queued, running or failed job: the status and what to do on the left, how it went and its details on the right. */
export function JobWaiting({ title, crumbs, status, badge, note, next, actions, children, steps, details, tools }: JobWaitingProps) {
  const id = useId();
  return (
    <div className="job-page-columns">
      <div className="job-page">
        <Breadcrumbs items={crumbs} />
        <h1>{title}</h1>
        <p className="job-page-status" role="status">
          <StatusBadge status={status}>{badge}</StatusBadge>
          {note && <span>{note}</span>}
        </p>
        <div className="job-page-next">
          <h2>{next.title}</h2>
          <p>{next.text}</p>
        </div>
        {actions && <div className="job-page-actions">{actions}</div>}
        {children}
      </div>
      <aside className="job-page-aside" aria-labelledby={`${id}-how`}>
        <h2 id={`${id}-how`}>How it went</h2>
        <JobSteps label="How the job went" steps={steps} />
        <h2>Details</h2>
        <div className="job-page-details">{details}</div>
        <div className="job-page-actions">{tools}</div>
      </aside>
    </div>
  );
}
