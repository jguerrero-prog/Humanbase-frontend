import { Humanbase, HumanbaseProvider, JobHistory, ModuleView, SampleClient } from '@humanbase/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ModuleExplorer, type ModuleDraft } from './ModuleExplorer';

const renal = '2339dc3cd05964ab3f691a8f4851c7a9aab78ad9';

function Explorer({ bodyTag, onEditGenes }: { bodyTag: string; onEditGenes: (draft: ModuleDraft) => void }) {
  const [view, setView] = useState(new ModuleView());
  return <ModuleExplorer bodyTag={bodyTag} view={view} onViewChange={setView} onEditGenes={onEditGenes} onStarted={vi.fn()} />;
}

function renderExplorer(bodyTag = renal) {
  const onEditGenes = vi.fn<(draft: ModuleDraft) => void>();
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <Explorer bodyTag={bodyTag} onEditGenes={onEditGenes} />
    </HumanbaseProvider>,
  );
  return { onEditGenes };
}

describe('ModuleExplorer', () => {
  beforeEach(() => localStorage.clear());

  it('shows the enriched modules with their top terms, under the name kept in this browser', async () => {
    // Examples are sent without a title, as on the live site; the example's name is kept in the job list.
    new JobHistory().add({ id: renal, tool: 'Modules', status: 'running', startedAt: '2026-10-19T00:00:00Z', link: `/modules/?body_tag=${renal}`, title: 'Renal disease panel' });
    renderExplorer();
    expect(await screen.findByRole('heading', { level: 1, name: 'Renal disease panel' })).toBeInTheDocument();
    expect(screen.getByText('14 enriched')).toBeInTheDocument();
    const table = screen.getByRole('table', { name: 'Modules and their top terms' });
    expect(within(table).getAllByRole('button').map((button) => button.textContent)).toEqual(['M1', 'M3', 'M4', 'M5', 'M6']);
    expect(within(table).getByText('renal system development')).toBeInTheDocument();
    expect(screen.getByText('Showing 14 enriched modules of 2 genes or more. Edges hidden.')).toBeInTheDocument();
  });

  it('names a result without a title', async () => {
    renderExplorer();
    expect(await screen.findByRole('heading', { level: 1, name: 'Untitled module search' })).toBeInTheDocument();
  });

  it('opens a module with its terms and genes', async () => {
    renderExplorer();
    const table = await screen.findByRole('table', { name: 'Modules and their top terms' });
    await userEvent.click(within(table).getByRole('button', { name: 'M1' }));
    const drawer = await screen.findByRole('dialog', { name: 'M1, renal system development' });
    expect(within(drawer).getByText('64 genes, 10 enriched terms in Gene Ontology (BP)')).toBeInTheDocument();
    expect(await within(drawer).findByText('NPHS2, NPHS1')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Open M1 genes in Networks' })).toHaveAttribute('href', expect.stringMatching(/^\/networks\/\?entrez=.*&tissue=kidney/));
    await userEvent.click(within(drawer).getByRole('radio', { name: 'Genes' }));
    expect(within(drawer).getByRole('table', { name: 'Genes in M1' })).toHaveTextContent('ABCB11');
  });

  it('lists genes by module and shows modules with no enriched terms on request', async () => {
    renderExplorer();
    await userEvent.click(await screen.findByRole('tab', { name: 'Genes' }));
    const genes = screen.getByRole('table', { name: 'Genes in each module' });
    expect(await within(genes).findByText('ABCB11')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Hide modules with no enriched terms' }));
    expect(screen.getByText('Showing 20 modules of 2 genes or more. Edges hidden.')).toBeInTheDocument();
  });

  // The real renal result lays out 369 genes, which takes over 5 seconds when the whole suite runs at once.
  it('renames the result in this browser and hands its list to Edit genes', async () => {
    new JobHistory().add({ id: renal, tool: 'Modules', status: 'running', startedAt: '2026-10-19T00:00:00Z', link: `/modules/?body_tag=${renal}`, title: 'Renal disease panel' });
    const { onEditGenes } = renderExplorer();
    await userEvent.click(await screen.findByRole('button', { name: 'Rename' }));
    const title = screen.getByRole('textbox', { name: 'Title' });
    await userEvent.clear(title);
    await userEvent.type(title, 'Kidney panel');
    await userEvent.click(within(screen.getByRole('dialog', { name: 'Rename this result' })).getByRole('button', { name: 'Rename' }));
    expect(screen.getByRole('heading', { level: 1, name: 'Kidney panel' })).toBeInTheDocument();
    expect(new JobHistory().list()[0]).toMatchObject({ title: 'Kidney panel', status: 'finished' });
    await userEvent.click(screen.getByRole('button', { name: 'Edit genes' }));
    expect(onEditGenes).toHaveBeenCalledWith(expect.objectContaining({ title: 'Kidney panel', tissue: 'kidney', version: 'v1' }));
    expect(onEditGenes.mock.calls[0]?.[0].entrez).toHaveLength(504);
  }, 15_000);

  it('explains a result that no longer exists', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderExplorer('0000');
    expect(await screen.findByText('This module result isn’t available')).toBeInTheDocument();
  });
});
