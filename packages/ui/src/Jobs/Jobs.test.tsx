import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Table } from '../Table/Table';
import { JobRow } from './JobRow';
import { JobsMenu } from './JobsMenu';

const jobs = [
  { title: 'IL1B region variants', detail: 'Seqweaver, for 4 minutes', status: 'running' as const, href: '/jobs/a/' },
  { title: 'BMI GWAS, adipose tissue', detail: 'NetWAS, waiting to start', status: 'queued' as const, href: '/jobs/b/' },
  { title: 'Untitled Seqweaver job', detail: 'Seqweaver, finished Oct 16, 8:02 PM', status: 'finished' as const, href: '/jobs/c/' },
];

describe('JobRow', () => {
  it('names the job as the row header and its action after the job', () => {
    render(
      <Table caption="Jobs">
        <tbody>
          <JobRow title="Height GWAS" detail="NetWAS, height_gwas.txt, global" status="failed" statusDetail="No p-value column" started="Oct 12, 9:30 AM" action={{ label: 'See why', href: '/jobs/d/' }} />
        </tbody>
      </Table>,
    );
    expect(screen.getByRole('rowheader')).toHaveTextContent('Height GWAS');
    expect(screen.getByText('Failed')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See why: Height GWAS' })).toHaveAttribute('href', '/jobs/d/');
  });
});

describe('JobsMenu', () => {
  it('counts running and queued jobs and opens a list of links', async () => {
    render(<JobsMenu jobs={jobs} total={6} allHref="/jobs/" />);
    const button = screen.getByRole('button', { name: 'Jobs 2 running' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('list', { name: 'Jobs in this browser' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'See all 6 jobs' })).toHaveAttribute('href', '/jobs/');
  });

  it('closes on Escape and returns focus to the button', async () => {
    render(<JobsMenu jobs={jobs} total={3} allHref="/jobs/" />);
    const button = screen.getByRole('button', { name: /Jobs/ });
    await userEvent.click(button);
    await userEvent.keyboard('{Escape}');
    expect(button).toHaveAttribute('aria-expanded', 'false');
    expect(button).toHaveFocus();
  });

  it('says where jobs will appear when this browser has none', async () => {
    render(<JobsMenu jobs={[]} total={0} allHref="/jobs/" />);
    await userEvent.click(screen.getByRole('button', { name: 'Jobs' }));
    expect(screen.getByText('Jobs you start in this browser appear here.')).toBeVisible();
    expect(screen.queryByRole('link', { name: /See all/ })).not.toBeInTheDocument();
  });
});
