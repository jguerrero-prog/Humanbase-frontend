import { Humanbase, HumanbaseProvider, JobHistory, SampleClient } from '@humanbase/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ModuleSearch } from './ModuleSearch';

function renderSearch(example?: string) {
  const onStarted = vi.fn<(link: string) => void>();
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <ModuleSearch example={example} onChooseAnalysis={vi.fn()} onStarted={onStarted} />
    </HumanbaseProvider>,
  );
  return { onStarted };
}

describe('ModuleSearch', () => {
  beforeEach(() => localStorage.clear());

  it('loads an example with its title and tissue, then checks every gene', async () => {
    renderSearch();
    await userEvent.click(screen.getByRole('button', { name: 'renal disease panel' }));
    expect((screen.getByRole('textbox', { name: 'Gene list' }) as HTMLTextAreaElement).value).toMatch(/^ABCB11\nABCB4\n/);
    expect(await screen.findByText('468 matched', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByText('36 to check')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Title' })).toHaveValue('Renal disease panel');
    expect(screen.getByText('Chosen by the example. Pick the tissue closest to your study.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find modules in 504 genes' })).toBeInTheDocument();
  });

  it('starts the job, saves it in this browser and opens its result', async () => {
    const { onStarted } = renderSearch('renal');
    const run = await screen.findByRole('button', { name: 'Find modules in 504 genes' }, { timeout: 3000 });
    await screen.findByRole('combobox', { name: 'Tissue' });
    await userEvent.click(run);
    await vi.waitFor(() => expect(onStarted).toHaveBeenCalledWith('/modules/?body_tag=faa09d1786f0998dbd03d7323f544f5457d98936'));
    expect(new JobHistory().list()[0]).toMatchObject({ tool: 'Modules', status: 'running', title: 'Renal disease panel' });
  });

  it('removes selected genes from the table and the list, and says so', async () => {
    renderSearch('autism');
    const table = await screen.findByRole('table', { name: 'How your 300 genes matched' }, { timeout: 3000 });
    const row = (symbol: string) => within(table).getAllByRole('row').find((item) => within(item).queryByText(symbol, { selector: 'td:first-child, th' }));
    await userEvent.click(within(table).getByRole('button', { name: 'Show all 296' }));
    for (const symbol of ['ASH1L', 'ASXL3', 'CUL3']) await userEvent.click(within(row(symbol) as HTMLElement).getByRole('checkbox'));
    await userEvent.click(screen.getByRole('button', { name: 'Remove from list' }));
    expect(await screen.findAllByText('3 genes removed from the list')).not.toHaveLength(0);
    expect((screen.getByRole('textbox', { name: 'Gene list' }) as HTMLTextAreaElement).value).not.toMatch(/ASH1L/);
    expect(screen.getByRole('button', { name: 'Find modules in 297 genes' })).toBeInTheDocument();
  });

  it('needs at least 20 genes', async () => {
    renderSearch();
    await userEvent.type(screen.getByRole('textbox', { name: 'Gene list' }), 'IL1B TNF');
    expect(await screen.findByText('Module detection needs 20 to 3,500 genes. This list has 2 genes.', {}, { timeout: 3000 })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Find modules in 2 genes' })).toBeDisabled();
  });
});
