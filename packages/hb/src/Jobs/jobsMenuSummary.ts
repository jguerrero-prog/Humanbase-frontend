import { JobHistory } from '@humanbase/data';
import type { JobsMenuSummary } from '@humanbase/ui';
import { useMemo, useSyncExternalStore } from 'react';

const shownJobs = 5;

// The top bar's Jobs menu, built from the jobs started in this browser.
export function jobsMenuSummary(history = new JobHistory()): JobsMenuSummary {
  const jobs = history.list();
  return {
    jobs: jobs.slice(0, shownJobs).map((job) => ({ title: JobHistory.titleOf(job), detail: job.detail ?? job.tool, status: job.status, href: job.link })),
    total: jobs.length,
    allHref: '/jobs/',
  };
}

/** The Jobs menu summary, read again whenever a job is added, renamed or changes status. */
export function useJobsMenuSummary(): JobsMenuSummary {
  const stored = useSyncExternalStore(JobHistory.subscribe, () => JobHistory.snapshot(), () => '');
  return useMemo(() => jobsMenuSummary(new JobHistory({ getItem: () => stored, setItem: () => undefined })), [stored]);
}
