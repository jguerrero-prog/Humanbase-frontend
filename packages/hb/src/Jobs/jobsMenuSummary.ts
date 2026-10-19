import { JobHistory } from '@humanbase/data';
import type { JobsMenuSummary } from '@humanbase/ui';

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
