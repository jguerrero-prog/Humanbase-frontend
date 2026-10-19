import type { JobsMenuSummary } from '@humanbase/ui';

export { productSections } from '@humanbase/hb';

export const productJobs: JobsMenuSummary = {
  jobs: [
    { title: 'IL1B region variants', detail: 'Seqweaver, for 4 minutes', status: 'running', href: '/jobs/il1b/' },
    { title: 'Untitled Seqweaver job', detail: 'Seqweaver, finished Oct 16, 8:02 PM', status: 'finished', href: '/jobs/example/' },
  ],
  total: 6,
  allHref: '/jobs/',
};
