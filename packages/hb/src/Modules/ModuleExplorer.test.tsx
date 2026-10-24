import { Humanbase, HumanbaseProvider, JobHistory, ModuleView, SampleClient } from '@humanbase/data';
import type { GraphRenderer } from '@humanbase/graph';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { ModuleExplorer, type ModuleDraft } from './ModuleExplorer';

const renal = '2339dc3cd05964ab3f691a8f4851c7a9aab78ad9';

// Laying out the renal result's 369 genes takes most of this suite's time, and ForceGraphRenderer has its own tests.
class BlankRenderer implements GraphRenderer {
  mount() {}
  render() {}
  select() {}
  hover() {}
  highlight() {}
  zoomBy() {}
  fit() {}
  exportSvg() {
    return new Blob([], { type: 'image/svg+xml' });
  }
  destroy() {}
}
const blankRenderer = () => new BlankRenderer();

function Explorer({ bodyTag, onEditGenes }: { bodyTag: string; onEditGenes: (draft: ModuleDraft) => void }) {
  const [view, setView] = useState(new ModuleView());
  return <ModuleExplorer bodyTag={bodyTag} view={view} onViewChange={setView} onEditGenes={onEditGenes} onStarted={vi.fn()} renderer={blankRenderer} />;
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
    expect(within(drawer).getByText('64 genes, 149 enriched terms in Gene Ontology (BP)')).toBeInTheDocument();
    expect((await within(drawer).findAllByText('FGF8, GREB1L, HNF1B, ITGA8 and more'))[0]).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: 'Open M1 genes in Networks' })).toHaveAttribute('href', expect.stringMatching(/^\/networks\/\?entrez=.*&tissue=kidney/));
    await userEvent.click(within(drawer).getByRole('radio', { name: 'Genes' }));
    const genes = within(drawer).getByRole('table', { name: 'Genes in M1' });
    expect(genes).toHaveTextContent('ABCB11');
    expect(within(genes).getAllByRole('row')).toHaveLength(10);
    await userEvent.click(within(genes).getByRole('button', { name: 'Show all 64 genes' }));
    expect(within(genes).getAllByRole('row')).toHaveLength(65);
  });

  it('opens a gene of a module in the same drawer, moves to its neighbors and goes back', async () => {
    renderExplorer();
    await userEvent.click(within(await screen.findByRole('table', { name: 'Modules and their top terms' })).getByRole('button', { name: 'M1' }));
    const module = await screen.findByRole('dialog', { name: 'M1, renal system development' });
    await userEvent.click(within(module).getByRole('radio', { name: 'Genes' }));
    await userEvent.type(within(module).getByRole('searchbox', { name: 'Filter M1 genes' }), 'HNF1');
    await userEvent.click(within(module).getByRole('button', { name: 'HNF1B' }));

    const gene = await screen.findByRole('dialog', { name: 'HNF1B' });
    expect(within(gene).getByText('HNF1 homeobox B, in M1 renal system development')).toBeInTheDocument();
    expect(within(gene).getByRole('heading', { level: 2, name: 'HNF1B' })).toHaveFocus();
    expect(within(within(gene).getByRole('table', { name: 'Enriched terms of M1 that include HNF1B' })).getAllByRole('row')).toHaveLength(10);
    expect(within(gene).getAllByText('FGF8, GREB1L, ITGA8, NPHS1 and 3 more')[0]).toBeInTheDocument();
    expect(within(gene).getByRole('link', { name: 'Open HNF1B in Networks' })).toHaveAttribute('href', expect.stringMatching(/^\/networks\/\?entrez=6928&tissue=kidney/));
    await userEvent.click(within(gene).getByRole('radio', { name: 'Gene neighbors' }));
    const neighbors = within(gene).getByRole('table', { name: 'Genes connected to HNF1B' });
    expect(within(neighbors).getAllByRole('row').slice(1).map((row) => row.textContent)).toEqual([expect.stringMatching(/^HNF4A.*M10\.13/), expect.stringMatching(/^KCNJ1.*M10\.10/)]);

    await userEvent.click(within(neighbors).getByRole('button', { name: 'HNF4A' }));
    const next = await screen.findByRole('dialog', { name: 'HNF4A' });
    expect(within(next).getByRole('table', { name: 'Genes connected to HNF4A' })).toHaveTextContent('HNF1B');
    await userEvent.click(within(next).getByRole('button', { name: 'Back to M1' }));
    expect(await screen.findByRole('dialog', { name: 'M1, renal system development' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Back to M1' })).not.toBeInTheDocument();
  });

  it('lists genes by module and shows modules with no enriched terms on request', async () => {
    renderExplorer();
    await userEvent.click(await screen.findByRole('tab', { name: 'Genes' }));
    const genes = screen.getByRole('table', { name: 'Genes in each module' });
    expect(await within(genes).findByText('ABCB11')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Hide modules with no enriched terms' }));
    expect(screen.getByText('Showing 20 modules of 2 genes or more. Edges hidden.')).toBeInTheDocument();
  });

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
  });

  it('explains a result that no longer exists', async () => {
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    renderExplorer('0000');
    expect(await screen.findByText('This module result isn’t available')).toBeInTheDocument();
  });
});
