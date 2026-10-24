import { JobHistory, type JobState } from '@humanbase/data';
import { Breadcrumbs, Button, Dialog, JobSteps, StatusBadge, TextInput, type Crumb, type JobStep } from '@humanbase/ui';
import { useId, useState, type ReactNode } from 'react';
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
export function useJobTitle(job: JobIdentity | undefined) {
  const [renamed, setRenamed] = useState<string | undefined>();
  const fallback = job ? `Untitled ${job.tool} job` : '';
  const saved = job ? new JobHistory().list().find((entry) => entry.id === job.id)?.title : undefined;
  const title = renamed ?? saved ?? job?.title ?? fallback;
  const rename = (next: string) => {
    if (!job) return;
    const history = new JobHistory();
    const entry = history.list().find((item) => item.id === job.id);
    if (entry) history.add({ ...entry, title: next || undefined });
    setRenamed(next || job.title || fallback);
  };
  return { title, rename };
}

/** Copy link and Rename, with the dialog and toast they need. */
export function useJobActions(title: string, rename: (title: string) => void) {
  const [renaming, setRenaming] = useState(false);
  const [draft, setDraft] = useState('');
  const { copyButton, toastRegion } = useCopyLink();
  const renameButton = (
    <Button
      variant="ghost"
      size="small"
      onClick={() => {
        setDraft(title);
        setRenaming(true);
      }}
    >
      Rename
    </Button>
  );
  const overlays = (
    <>
      <Dialog
        title="Rename this job"
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
      {toastRegion}
    </>
  );
  return { copyButton, renameButton, overlays };
}

/** Keeps this browser's job list in step with what the job page last read. */
export function syncJobHistory(job: JobIdentity & { status: JobState; created: Date }, link: string, detail: string) {
  const history = new JobHistory();
  const entry = history.list().find((item) => item.id === job.id);
  if (entry?.status === job.status) return;
  history.add({ ...(entry ?? { id: job.id, tool: job.tool, startedAt: job.created.toISOString(), link, title: job.title, detail }), status: job.status });
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
