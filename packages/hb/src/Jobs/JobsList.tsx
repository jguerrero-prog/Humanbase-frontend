import { JobHistory, type JobEntry, type JobState } from '@humanbase/data';
import { ActionMenu, Button, Dialog, EmptyState, HeaderCell, JobRow, SearchField, Table, Tabs, TextInput, useLinkHref } from '@humanbase/ui';
import { useEffect, useMemo, useState, useSyncExternalStore, type FormEvent } from 'react';
import { notifications } from '../Notifications/Notifications';
import './JobsList.css';

type Filter = 'all' | 'active' | 'finished' | 'failed';

const started = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
const actions: Record<JobState, string> = { queued: 'Open', running: 'Open', finished: 'View results', failed: 'See why' };
const isActive = (job: JobEntry) => job.status === 'queued' || job.status === 'running';
const matchesFilter = (job: JobEntry, filter: Filter) => filter === 'all' || (filter === 'active' ? isActive(job) : job.status === filter);

function statusDetail(job: JobEntry, now: number): string {
  if (job.status === 'queued') return 'Waiting to start';
  // Jobs don't report when they finished or why they failed, so the badge says it alone.
  if (job.status === 'finished' || job.status === 'failed') return '';
  const minutes = Math.max(0, Math.round((now - Date.parse(job.startedAt)) / 60_000));
  if (minutes < 1) return 'For less than a minute';
  if (minutes < 90) return `For ${minutes} minute${minutes === 1 ? '' : 's'}`;
  return `For ${Math.round(minutes / 60)} hours`;
}

/** Where a pasted job link or ID opens: Modules keys its jobs by a body tag, NetWAS and the sequence tools by an ID. */
export function jobLinkFrom(text: string): string | undefined {
  const tag = /body_tag=([0-9a-f]{20,})/i.exec(text)?.[1];
  if (tag) return `/modules/?body_tag=${tag.toLowerCase()}`;
  const id = JobHistory.idFromLink(text);
  if (!id) return undefined;
  return /netwas/i.test(text) ? `/netwas/${id}/` : `/deepsea/jobs/${id}/`;
}

export interface JobsListProps {
  /** Opens a job page, such as one added by its link. */
  onOpenJob: (link: string) => void;
}

/** Every job started in this browser, from every tool, newest first. */
export function JobsList({ onOpenJob }: JobsListProps) {
  const linkHref = useLinkHref();
  const stored = useSyncExternalStore(JobHistory.subscribe, () => JobHistory.snapshot(), () => '');
  const jobs = useMemo(() => new JobHistory({ getItem: () => stored, setItem: () => undefined }).list(), [stored]);
  const [filter, setFilter] = useState<Filter>('all');
  const [search, setSearch] = useState('');
  const [adding, setAdding] = useState(false);
  const [link, setLink] = useState('');
  const [linkError, setLinkError] = useState<string>();
  const [clearing, setClearing] = useState(false);
  // Running times count up while the page is open.
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);
  const term = search.trim().toLowerCase();
  const shown = jobs.filter((job) => matchesFilter(job, filter) && `${JobHistory.titleOf(job)} ${job.tool} ${job.detail ?? ''}`.toLowerCase().includes(term));
  const finished = jobs.filter((job) => job.status === 'finished').length;
  const count = (value: Filter) => jobs.filter((job) => matchesFilter(job, value)).length;

  const addJob = (event: FormEvent) => {
    event.preventDefault();
    const target = jobLinkFrom(link);
    if (!target) return setLinkError('No job matches that link. Check that it was copied whole, or ask whoever sent it for the job page link.');
    if (target.startsWith('/modules/')) new JobHistory().add({ id: target.split('=')[1] ?? '', tool: 'Modules', status: 'running', startedAt: new Date().toISOString(), link: target });
    setAdding(false);
    setLink('');
    setLinkError(undefined);
    onOpenJob(target);
  };

  const clearFinished = () => {
    new JobHistory().clearFinished();
    setClearing(false);
  };

  const copyLink = async (job: JobEntry) => {
    await navigator.clipboard?.writeText(new URL(linkHref(job.link), window.location.origin).href);
    notifications.show({ tone: 'info', message: 'Link copied' });
  };

  return (
    <section className="jobs-list" aria-labelledby="jobs-title">
      <div className="jobs-list-head">
        <div>
          <h1 id="jobs-title">Jobs</h1>
          <p>Humanbase has no accounts, so a job lives in the browser that started it. Jobs you start here, or add by link, are listed below.</p>
        </div>
        <Button onClick={() => setAdding(true)}>Add a job by link</Button>
      </div>
      {jobs.length === 0 ? (
        <EmptyState title="No jobs in this browser yet" text="Jobs you start from a tool, such as NetWAS or Sei, appear here. To follow a job from another browser, add it by link." />
      ) : (
        <>
          <div className="jobs-list-filters">
            <Tabs
              label="Show jobs"
              value={filter}
              onChange={(value) => setFilter(value as Filter)}
              tabs={[
                { value: 'all', label: 'All', count: count('all') },
                { value: 'active', label: 'Running and queued', count: count('active') },
                { value: 'finished', label: 'Finished', count: count('finished') },
                { value: 'failed', label: 'Failed', count: count('failed') },
              ]}
            />
            <SearchField label="Filter by title or tool" placeholder="Filter by title or tool" size="medium" value={search} onChange={(event) => setSearch(event.target.value)} onClear={() => setSearch('')} />
          </div>
          {shown.length === 0 ? (
            <p className="jobs-list-none" role="status">
              No jobs match. Clear the filter to see every job in this browser.
            </p>
          ) : (
            <Table caption="Jobs in this browser" columnWidths={['auto', '280px', '200px', '240px']} minWidth="880px" pinFirstColumn>
              <thead>
                <tr>
                  <HeaderCell>Job</HeaderCell>
                  <HeaderCell>Status</HeaderCell>
                  <HeaderCell sort="descending">Started</HeaderCell>
                  <HeaderCell>
                    <span className="visually-hidden">Actions</span>
                  </HeaderCell>
                </tr>
              </thead>
              <tbody>
                {shown.map((job) => (
                  <JobRow
                    key={job.id}
                    title={JobHistory.titleOf(job)}
                    detail={job.detail ?? job.tool}
                    status={job.status}
                    statusDetail={statusDetail(job, now)}
                    started={started.format(new Date(job.startedAt))}
                    action={{ label: actions[job.status], href: job.link }}
                    menu={
                      <ActionMenu
                        label={`More actions for ${JobHistory.titleOf(job)}`}
                        size="small"
                        items={[
                          { label: 'Copy link', icon: 'link', onSelect: () => void copyLink(job) },
                          { label: 'Remove from this list', icon: 'x', onSelect: () => new JobHistory().remove(job.id) },
                        ]}
                      />
                    }
                  />
                ))}
              </tbody>
            </Table>
          )}
          <div className="jobs-list-footer">
            <p>Kept in this browser. Removing a job from the list doesn’t delete it; its link keeps working for as long as Humanbase keeps results.</p>
            {finished > 0 && (
              <Button variant="ghost" size="small" onClick={() => (finished > 1 ? setClearing(true) : clearFinished())}>
                Clear finished from this list
              </Button>
            )}
          </div>
        </>
      )}
      <Dialog
        title="Add a job by link"
        kind="form"
        open={adding}
        onClose={() => setAdding(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button type="submit" form="add-job">
              Add job
            </Button>
          </>
        }
      >
        <form id="add-job" onSubmit={addJob}>
          <TextInput label="Job link or ID" value={link} onChange={(event) => setLink(event.target.value)} hint="Paste the link from the job page or an email. The job is added to this browser’s list." error={linkError} />
        </form>
      </Dialog>
      <Dialog
        title={`Clear ${finished} finished jobs from this list?`}
        open={clearing}
        onClose={() => setClearing(false)}
        actions={
          <>
            <Button variant="ghost" onClick={() => setClearing(false)}>
              Keep them
            </Button>
            <Button onClick={clearFinished}>Clear finished</Button>
          </>
        }
      >
        <p>This only changes this browser’s list. Their links keep working.</p>
      </Dialog>
    </section>
  );
}
