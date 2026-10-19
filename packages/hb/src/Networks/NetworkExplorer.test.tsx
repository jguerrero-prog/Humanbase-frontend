import { Humanbase, HumanbaseProvider, NetworkQuery, NetworkView, SampleClient } from '@humanbase/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { NetworkExplorer, type NetworkDetailContext, type NetworkExplorerProps } from './NetworkExplorer';

function renderExplorer(query: NetworkQuery, props: Partial<NetworkExplorerProps> = {}) {
  const onQueryChange = vi.fn<(query: NetworkQuery) => void>();
  const onViewChange = vi.fn<(view: NetworkView) => void>();
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <NetworkExplorer query={query} view={new NetworkView()} onQueryChange={onQueryChange} onViewChange={onViewChange} {...props} />
    </HumanbaseProvider>,
  );
  return { onQueryChange, onViewChange };
}

describe('NetworkExplorer', () => {
  it('shows the related genes and says which requested gene was left out', async () => {
    renderExplorer(new NetworkQuery([3553, 7124, 100188314]));
    const table = await screen.findByRole('table', { name: /Genes functionally related to IL1B, TNF and AUTS12/ });
    expect(await within(table).findByRole('button', { name: /^ICAM1/ })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(16);
    expect(await screen.findByText('AUTS12 was left out because it isn’t in any Humanbase network. This network uses IL1B and TNF.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IL1B, TNF');
    expect(screen.getByText(/Showing 15 of 50 genes, \d+ connections at 0\.48 or more/)).toBeInTheDocument();
  });

  it('selects a gene from the table and adds a gene to the query', async () => {
    const { onQueryChange, onViewChange } = renderExplorer(new NetworkQuery([3553, 7124]));
    const table = await screen.findByRole('table', { name: /Genes functionally related/ });
    await within(table).findByRole('button', { name: /^ICAM1/ });
    await userEvent.click(within(table).getByRole('button', { name: /^ICAM1/ }));
    expect(onViewChange.mock.calls[0]?.[0].selection).toEqual({ kind: 'gene', entrez: 3383 });
    await userEvent.click(within(table).getByRole('button', { name: 'Add ICAM1 to the query' }));
    expect(onQueryChange.mock.calls[0]?.[0].entrez).toEqual([3553, 7124, 3383]);
  });

  it('filters the genes table', async () => {
    renderExplorer(new NetworkQuery([3553, 7124]));
    const table = await screen.findByRole('table', { name: /Genes functionally related/ });
    await within(table).findByRole('button', { name: /^ICAM1/ });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Filter genes' }), 'chemokine');
    expect(within(table).getAllByRole('row').length).toBeLessThan(16);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Filter genes' }), 'zzz');
    expect(within(table).getByText('No genes match “chemokinezzz”')).toBeInTheDocument();
  });

  it('explains a gene that is in no network', async () => {
    renderExplorer(new NetworkQuery([100188314]));
    expect(await screen.findByText('AUTS12 is not in this network')).toBeInTheDocument();
  });

  it('offers data types for GIANT only', async () => {
    renderExplorer(new NetworkQuery([3553, 7124]));
    expect(await screen.findByRole('button', { name: 'Data types' })).toHaveTextContent('All 5 types');
  });

  it('draws the selection it is given and hands it to the detail slot', async () => {
    const detail = vi.fn<(context: NetworkDetailContext) => React.ReactNode>(() => <p>Detail for the selection</p>);
    render(
      <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
        <NetworkExplorer query={new NetworkQuery([3553, 7124])} view={new NetworkView().with({ selection: { kind: 'gene', entrez: 3383 } })} onQueryChange={vi.fn()} onViewChange={vi.fn()} detail={detail} />
      </HumanbaseProvider>,
    );
    expect(await screen.findByText('Detail for the selection')).toBeInTheDocument();
    expect(detail.mock.lastCall?.[0]).toMatchObject({ selection: { kind: 'gene', entrez: 3383 } });
  });

  it('ranks processes and tissues against the genes in the graph', async () => {
    renderExplorer(new NetworkQuery([3553, 7124]));
    await screen.findByRole('table', { name: /Genes functionally related/ });
    await userEvent.click(await screen.findByRole('tab', { name: /^Processes \d+$/ }));
    const processes = await screen.findByRole('table', { name: /Biological processes over-represented/ });
    const [, first] = await within(processes).findAllByRole('row');
    expect(first).toHaveTextContent(/Gene Ontology \(BP\), \d+ genes/);
    expect(first).toHaveTextContent(/× 10⁻/);
    await userEvent.click(screen.getByRole('tab', { name: /^Tissues \d+$/ }));
    const tissues = await screen.findByRole('table', { name: /Tissues and cell types/ });
    expect(await within(tissues).findAllByText('BRENDA Ontology')).not.toHaveLength(0);
  });

  it('opens the gene drawer with aliases, IDs and annotations', async () => {
    render(
      <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
        <NetworkExplorer query={new NetworkQuery([3553, 7124])} view={new NetworkView().with({ selection: { kind: 'gene', entrez: 3383 } })} onQueryChange={vi.fn()} onViewChange={vi.fn()} />
      </HumanbaseProvider>,
    );
    const drawer = await screen.findByRole('dialog', { name: 'ICAM1' });
    expect(within(drawer).getByText('BB2, P3.58, CD54')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: /Entrez 3383/ })).toHaveAttribute('href', 'https://www.ncbi.nlm.nih.gov/gene/3383');
    const annotations = within(drawer).getByRole('region', { name: 'Annotations' });
    expect((await within(annotations).findAllByRole('listitem')).length).toBeGreaterThan(0);
    expect(within(drawer).getByRole('button', { name: 'Add to query' })).toBeInTheDocument();
  });

  it('opens the connection drawer with the evidence behind it', async () => {
    render(
      <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
        <NetworkExplorer query={new NetworkQuery([3553, 7124])} view={new NetworkView().with({ selection: { kind: 'connection', source: 7185, target: 6348 } })} onQueryChange={vi.fn()} onViewChange={vi.fn()} />
      </HumanbaseProvider>,
    );
    const drawer = await screen.findByRole('dialog', { name: 'TRAF1 and CCL3' });
    expect(await within(drawer).findByText('MSigDB CGP')).toBeInTheDocument();
    expect(within(drawer).getByText(/GSEA perturbations, Co-expression|Co-expression, GSEA perturbations/)).toBeInTheDocument();
    await userEvent.click(within(drawer).getByRole('radio', { name: 'All networks' }));
    expect(await within(drawer).findByRole('table', { name: /Connection weight in each network/ })).toBeInTheDocument();
  });
});
