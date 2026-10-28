import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Breadcrumbs } from './Breadcrumbs';
import { TopBar } from './TopBar';
import type { NavSection } from './types';

const sections: NavSection[] = [
  {
    label: 'Network analysis',
    columns: [[{ links: [{ label: 'Networks', href: '/networks/' }, { label: 'Modules', href: '/modules/' }, { label: 'NetWAS', href: '/netwas/' }] }]],
  },
  { label: 'Data', columns: [[{ links: [{ label: 'Data sources', href: '/data/' }] }]] },
  { label: 'Docs', href: '/docs/' },
];

const jobs = {
  jobs: [{ title: 'IL1B region variants', detail: 'Seqweaver, for 4 minutes', status: 'running', href: '/jobs/il1b/' }] as const,
  total: 3,
  allHref: '/jobs/',
};

const renderBar = () => render(<TopBar sections={sections} current="Network analysis" jobs={jobs} />);

describe('TopBar', () => {
  it('marks the current section and links the plain sections', () => {
    renderBar();
    const main = screen.getByRole('navigation', { name: 'Main' });
    expect(within(main).getByRole('button', { name: 'Network analysis' })).toHaveAttribute('aria-current', 'true');
    expect(within(main).getByRole('link', { name: 'Docs' })).toHaveAttribute('href', '/docs/');
  });

  it('leaves the search out when the page has its own', () => {
    const { container } = render(<TopBar sections={sections} jobs={jobs} search={false} />);
    expect(container.querySelector('search')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Search' })).not.toBeInTheDocument();
  });

  it('opens the jobs menu from the Jobs button', async () => {
    renderBar();
    const button = screen.getByRole('button', { name: 'Jobs 1 running' });
    await userEvent.click(button);
    expect(button).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('link', { name: 'See all 3 jobs' })).toHaveAttribute('href', '/jobs/');
  });

  it('opens one section menu at a time on click', async () => {
    renderBar();
    const network = screen.getByRole('button', { name: 'Network analysis' });
    const data = screen.getByRole('button', { name: 'Data' });
    await userEvent.click(network);
    expect(network).toHaveAttribute('aria-expanded', 'true');
    await userEvent.click(data);
    expect(network).toHaveAttribute('aria-expanded', 'false');
    expect(data).toHaveAttribute('aria-expanded', 'true');
  });

  it('opens with Down Arrow, moves with arrows and closes with Escape', async () => {
    renderBar();
    const network = screen.getByRole('button', { name: 'Network analysis' });
    network.focus();
    await userEvent.keyboard('{ArrowDown}');
    expect(screen.getByRole('link', { name: 'Networks' })).toHaveFocus();
    await userEvent.keyboard('{ArrowDown}{End}');
    expect(screen.getByRole('link', { name: 'NetWAS' })).toHaveFocus();
    await userEvent.keyboard('{Escape}');
    expect(network).toHaveFocus();
    expect(network).toHaveAttribute('aria-expanded', 'false');
  });
});

describe('Breadcrumbs', () => {
  const items = [{ label: 'Modules', href: '/modules/' }, { label: 'Autism gene set', href: '/modules/autism/' }, { label: 'Module 3' }];

  it('links every step but the current page', () => {
    render(<Breadcrumbs items={items} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
    expect(screen.getAllByRole('link')).toHaveLength(2);
    expect(screen.getByText('Module 3')).toHaveAttribute('aria-current', 'page');
  });

  it('shows only a link back to the parent when compact', () => {
    render(<Breadcrumbs items={items} compact />);
    expect(screen.getByRole('link', { name: 'Back to Autism gene set' })).toHaveAttribute('href', '/modules/autism/');
  });
});
