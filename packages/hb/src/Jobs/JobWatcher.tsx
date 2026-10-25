import { JobHistory, useDeepseaJob, useModuleResult, useNetwasJob, type JobEntry, type JobState } from '@humanbase/data';
import { useLinkHref } from '@humanbase/ui';
import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react';
import { notifications } from '../Notifications/Notifications';

type Done = (job: JobEntry, status: Extract<JobState, 'finished' | 'failed'>) => void;

// Each watcher reads its job through the same query as the job page, so an open job page doesn't double the requests.
function WatchDeepsea({ job, onDone }: { job: JobEntry; onDone: Done }) {
  const status = useDeepseaJob(job.id).data?.status;
  useEffect(() => {
    if (status === 'finished' || status === 'failed') onDone(job, status);
  }, [status, job, onDone]);
  return null;
}

function WatchNetwas({ job, onDone }: { job: JobEntry; onDone: Done }) {
  const status = useNetwasJob(job.id).data?.status;
  useEffect(() => {
    if (status === 'finished' || status === 'failed') onDone(job, status);
  }, [status, job, onDone]);
  return null;
}

function WatchModules({ job, onDone }: { job: JobEntry; onDone: Done }) {
  const result = useModuleResult(job.id);
  const status = result.data ? 'finished' : result.isError ? 'failed' : undefined;
  useEffect(() => {
    if (status) onDone(job, status);
  }, [status, job, onDone]);
  return null;
}

function watcherFor(job: JobEntry) {
  if (job.link.startsWith('/modules/')) return WatchModules;
  if (job.link.startsWith('/netwas/')) return WatchNetwas;
  if (job.link.startsWith('/deepsea/jobs/')) return WatchDeepsea;
  return undefined;
}

/** Checks this browser's running jobs from any page, keeps the list current and says when one finishes. */
export function JobWatcher() {
  const linkHref = useLinkHref();
  const stored = useSyncExternalStore(JobHistory.subscribe, () => JobHistory.snapshot(), () => '');
  const active = useMemo(() => new JobHistory({ getItem: () => stored, setItem: () => undefined }).list().filter((job) => job.status === 'queued' || job.status === 'running'), [stored]);

  const onDone = useCallback<Done>(
    (job, status) => {
    const history = new JobHistory();
    const entry = history.list().find((item) => item.id === job.id);
    if (!entry || entry.status === status) return;
    history.add({ ...entry, status });
    // On the job page itself the page turns into its finished state instead.
    if (window.location.pathname + window.location.search === linkHref(job.link)) return;
    const title = JobHistory.titleOf(entry);
    notifications.show(
      status === 'finished'
        ? { tone: 'success', message: `${entry.tool} finished: ${title}`, action: { label: 'View results', href: job.link } }
        : { tone: 'error', message: `${entry.tool} stopped: ${title}`, action: { label: 'See why', href: job.link } },
    );
    },
    [linkHref],
  );

  return active.map((job) => {
    const Watch = watcherFor(job);
    return Watch ? <Watch key={job.id} job={job} onDone={onDone} /> : null;
  });
}
