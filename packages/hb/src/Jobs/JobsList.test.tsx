import { Humanbase, HumanbaseProvider, JobHistory, SampleClient, type JobEntry } from '@humanbase/data';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { jobLinkFrom, JobsList } from './JobsList';
import { Notifications } from '../Notifications/Notifications';
import { JobWatcher } from './JobWatcher';

const seqweaver = '76aea8fe-8ec7-4698-a193-a186c7665edb';
const beluga = '00000000-0000-4000-8000-000000000121';
const entry = (id: string, tool: string, status: JobEntry['status'], title?: string): JobEntry => ({ id, tool, status, startedAt: '2026-10-20T21:02:00.000Z', link: `/deepsea/jobs/${id}/`, title, detail: `${tool}, example.vcf` });

const withApi = (children: React.ReactNode) => <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>{children}</HumanbaseProvider>;

beforeEach(() => localStorage.clear());

describe('JobsList', () => {
  it('says the list is empty until a job is started or added', () => {
    render(<JobsList onOpenJob={() => undefined} />);
    expect(screen.getByText('No jobs in this browser yet')).toBeInTheDocument();
  });

  it('lists every job with its status, action and menu, and filters them', async () => {
    const history = new JobHistory();
    history.add(entry(seqweaver, 'Seqweaver', 'finished', 'IL1B region variants'));
    history.add(entry(beluga, 'Beluga', 'failed'));
    render(<JobsList onOpenJob={() => undefined} />);
    const table = screen.getByRole('table', { name: 'Jobs in this browser' });
    expect(within(table).getByRole('link', { name: 'View results: IL1B region variants' })).toHaveAttribute('href', `/deepsea/jobs/${seqweaver}/`);
    expect(within(table).getByRole('link', { name: 'See why: Untitled Beluga job' })).toBeInTheDocument();
    await userEvent.click(screen.getByRole('tab', { name: /Failed/ }));
    expect(screen.queryByText('IL1B region variants')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'More actions for Untitled Beluga job' })).toBeInTheDocument();
  });

  it('opens a pasted job link on its own tool page', () => {
    expect(jobLinkFrom(`https://humanbase.io/deepsea/jobs/${seqweaver}/`)).toBe(`/deepsea/jobs/${seqweaver}/`);
    expect(jobLinkFrom(`humanbase.io/netwas/${beluga}`)).toBe(`/netwas/${beluga}/`);
    expect(jobLinkFrom('humanbase.io/modules/?body_tag=2339dc3cd05964ab3f691a8f4851c7a9aab78ad9')).toBe('/modules/?body_tag=2339dc3cd05964ab3f691a8f4851c7a9aab78ad9');
    expect(jobLinkFrom('not a job')).toBeUndefined();
  });
});

describe('JobWatcher', () => {
  it('marks running jobs finished or failed and says so with a toast', async () => {
    const history = new JobHistory();
    history.add(entry(seqweaver, 'Seqweaver', 'running', 'IL1B region variants'));
    history.add(entry(beluga, 'Beluga', 'running'));
    render(
      withApi(
        <>
          <JobWatcher />
          <Notifications />
        </>,
      ),
    );
    const region = screen.getByRole('region', { name: 'Notifications' });
    await waitFor(() => expect(within(region).getAllByRole('listitem')).toHaveLength(2));
    const toasts = within(region).getAllByRole('listitem').map((toast) => toast.textContent);
    expect(toasts.some((text) => text?.includes('Seqweaver finished: IL1B region variants'))).toBe(true);
    expect(toasts.some((text) => text?.includes('Beluga stopped: Untitled Beluga job'))).toBe(true);
    expect(new JobHistory().list().map((job) => job.status).sort()).toEqual(['failed', 'finished']);
  });
});
