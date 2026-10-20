import { Humanbase, HumanbaseProvider, JobHistory, SampleClient } from '@humanbase/data';
import { render, screen } from '@testing-library/react';
import { elapsed } from '../Jobs/JobPage';
import { NetwasJobView } from './NetwasJobView';

const job = (n: number) => `00000000-0000-4000-8000-00000000000${n}`;

function renderJob(id: string) {
  const onEditAndResubmit = vi.fn();
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <NetwasJobView id={id} onEditAndResubmit={onEditAndResubmit} />
    </HumanbaseProvider>,
  );
  return { onEditAndResubmit };
}

describe('NetwasJobView', () => {
  beforeEach(() => localStorage.clear());

  it('says how long a running job has run and saves it in this browser', async () => {
    renderJob(job(1));
    expect(await screen.findByText(/^Running for /)).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1, name: 'Untitled NetWAS job' })).toBeInTheDocument();
    expect(screen.getByText('You can leave this page')).toBeInTheDocument();
    expect(new JobHistory().list()[0]).toMatchObject({ id: job(1), tool: 'NetWAS', status: 'running', link: `/netwas/${job(1)}/` });
  });

  it('says why a job failed and hands its settings back to the form', async () => {
    const { onEditAndResubmit } = renderJob(job(2));
    expect(await screen.findByText('Failed: no p-value column')).toBeInTheDocument();
    screen.getByRole('button', { name: 'Edit and resubmit' }).click();
    expect(onEditAndResubmit).toHaveBeenCalledWith({ version: 'v1', tissue: 'global', pValue: 0.01, mhc: null, title: 'Height GWAS', email: undefined });
  });

  it('shows a finished job’s ranked genes with their names and a link into Networks', async () => {
    renderJob('c66b3d05-2f49-4522-b910-1605609e4083');
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled NetWAS job' })).toBeInTheDocument();
    expect(await screen.findByText('keratin 6B', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open in Networks for KRT6B' })).toHaveAttribute('href', '/networks/?entrez=3854&tissue=adipose-tissue&version=v1');
    expect(screen.getByRole('button', { name: 'Download result file' })).toBeEnabled();
  });

  it('says when no job has the link', async () => {
    renderJob('00000000-0000-4000-8000-000000000000');
    expect(await screen.findByText('This NetWAS job isn’t available')).toBeInTheDocument();
  });

  it('words elapsed time the way job pages do', () => {
    const start = new Date('2026-10-17T14:00:00Z');
    expect(elapsed(start, start.getTime() + 30_000)).toBe('less than a minute');
    expect(elapsed(start, start.getTime() + 4 * 60_000)).toBe('4 minutes');
    expect(elapsed(start, start.getTime() + 61 * 60_000)).toBe('1 hour');
  });
});
