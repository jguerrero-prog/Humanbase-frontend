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
    renderExplorer(new NetworkQuery([3553, 7124, 100188314], undefined, 'v1'));
    const table = await screen.findByRole('table', { name: /Genes functionally related to IL1B, TNF and AUTS12/ });
    expect(await within(table).findByRole('button', { name: /^ICAM1/ })).toBeInTheDocument();
    expect(within(table).getAllByRole('row')).toHaveLength(14);
    expect(await screen.findByText('AUTS12 was left out because it isn’t in any Humanbase network. This network uses IL1B and TNF.')).toBeInTheDocument();
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('IL1B interleukin 1 beta TNF tumor necrosis factor');
    expect(screen.getByText(/Showing 15 of 52 genes: 2 query genes and 13 related genes, \d+ connections above 0\.48\.$/)).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Score' })).toHaveAttribute('aria-sort', 'descending');
  });

  it('with uniqueness, splits the count and claims no Score sort', async () => {
    renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'), { view: new NetworkView(15, undefined, true) });
    const table = await screen.findByRole('table', { name: /Genes functionally related to IL1B and TNF/ });
    expect(await screen.findByText('Showing 16 of 52 genes: 2 query genes and 14 related genes, 40 connections above 0.48.')).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'Score' })).not.toHaveAttribute('aria-sort');
    expect(screen.getByText(/Rows are ranked by uniqueness to the query genes\./)).toBeInTheDocument();
  });

  it('says when related genes are hidden for having no connection above the cutoff', async () => {
    renderExplorer(new NetworkQuery([3553], undefined, 'v1'), { view: new NetworkView(15, undefined, true) });
    expect(await screen.findByText(/^Showing 6 of \d+ genes: 1 query gene and 5 related genes, 5 connections above 0\.84\. Genes with no connection above the cutoff are hidden\.$/)).toBeInTheDocument();
  });

  it('ranks terms with extended annotation counts on GIANT when extended_universe asks, and says so', async () => {
    renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1', [], undefined, undefined, true));
    expect(await screen.findByText('Showing legacy extended universe (cross-organism) annotation counts.')).toBeInTheDocument();
    await screen.findByRole('table', { name: /Genes functionally related/ });
    await userEvent.click(screen.getByRole('tab', { name: /Processes/ }));
    expect(await screen.findByRole('table', { name: /Biological processes and diseases over-represented/ })).toBeInTheDocument();
  });

  it('warns when a MAGE page ignored extended_universe', async () => {
    renderExplorer(new NetworkQuery([3553, 7124]), { extendedUniverseIgnored: true });
    const warning = await screen.findByText('Extended universe not applied');
    expect(warning.closest('[role="status"]')).toHaveTextContent('flag is a legacy setting available only on GIANT networks; this is a non-GIANT page so the flag was ignored.');
    expect(screen.queryByText(/Showing legacy extended universe/)).not.toBeInTheDocument();
  });

  it('shows a MAGE page as the tissue network alone, as humanbase.io does', async () => {
    renderExplorer(new NetworkQuery([3553, 7124]), { view: new NetworkView().with({ tab: 'process' }) });
    expect(await screen.findByRole('table', { name: /Genes functionally related/ })).toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Process network' })).not.toBeInTheDocument();
    expect(screen.queryByRole('tab', { name: 'Tissue network' })).not.toBeInTheDocument();
    expect(screen.queryByText(/Choose a biological process/)).not.toBeInTheDocument();
  });

  it('selects a gene from the table and adds a gene to the query', async () => {
    const { onQueryChange, onViewChange } = renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'));
    const table = await screen.findByRole('table', { name: /Genes functionally related/ });
    await within(table).findByRole('button', { name: /^ICAM1/ });
    await userEvent.click(within(table).getByRole('button', { name: /^ICAM1/ }));
    expect(onViewChange.mock.calls[0]?.[0].selection).toEqual({ kind: 'gene', entrez: 3383 });
    await userEvent.click(within(table).getByRole('button', { name: 'Add ICAM1 to the query' }));
    expect(onQueryChange.mock.calls[0]?.[0].entrez).toEqual([3553, 7124, 3383]);
  });

  it('filters the genes table', async () => {
    renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'));
    const table = await screen.findByRole('table', { name: /Genes functionally related/ });
    await within(table).findByRole('button', { name: /^ICAM1/ });
    await userEvent.type(screen.getByRole('searchbox', { name: 'Filter genes' }), 'chemokine');
    expect(within(table).getAllByRole('row').length).toBeLessThan(16);
    await userEvent.type(screen.getByRole('searchbox', { name: 'Filter genes' }), 'zzz');
    expect(within(table).getByText('No genes match “chemokinezzz”')).toBeInTheDocument();
  });

  it('stars a tissue to highlight its genes, and lists starred sets in the graph toolbar', async () => {
    const { onViewChange } = renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'));
    await screen.findByRole('table', { name: /Genes functionally related/ });
    await userEvent.click(screen.getByRole('tab', { name: /Tissues/ }));
    const star = await screen.findByRole('button', { name: 'Highlight peripheral blood genes in the network' });
    expect(star).toHaveAttribute('aria-pressed', 'false');
    await userEvent.click(star);
    expect(onViewChange.mock.calls.at(-1)?.[0].starred).toEqual(['BTO:0000553']);
  });

  it('rings starred genes and offers to remove them', async () => {
    const { onViewChange } = renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'), { view: new NetworkView().with({ starred: ['BTO:0000553'] }) });
    await userEvent.click(await screen.findByRole('tab', { name: /Tissues/ }));
    expect(await screen.findByRole('button', { name: 'Highlight peripheral blood genes in the network' })).toHaveAttribute('aria-pressed', 'true');
    const ringed = await vi.waitFor(() => {
      const nodes = [...document.querySelectorAll('.force-graph-node')].filter((node) => node.querySelector('.force-graph-star'));
      expect(nodes.length).toBeGreaterThan(0);
      return nodes.map((node) => node.getAttribute('aria-label')?.split(',')[0]).sort();
    });
    expect(ringed).toEqual(['CCL20', 'RELB', 'TNFRSF1B']);
    await userEvent.click(screen.getByRole('button', { name: 'Starred sets, 1' }));
    await userEvent.click(screen.getByRole('menuitem', { name: /Remove peripheral blood/ }));
    expect(onViewChange.mock.calls.at(-1)?.[0].starred).toEqual([]);
  });

  it('explains a gene that is in no network', async () => {
    renderExplorer(new NetworkQuery([100188314], undefined, 'v1'));
    expect(await screen.findByText('AUTS12 is not in this network')).toBeInTheDocument();
  });

  it('offers data types for GIANT only', async () => {
    renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'));
    expect(await screen.findByRole('button', { name: 'Data types' })).toHaveTextContent('All 5 types');
  });

  it('draws the selection it is given and hands it to the detail slot', async () => {
    const detail = vi.fn<(context: NetworkDetailContext) => React.ReactNode>(() => <p>Detail for the selection</p>);
    render(
      <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
        <NetworkExplorer query={new NetworkQuery([3553, 7124], undefined, 'v1')} view={new NetworkView().with({ selection: { kind: 'gene', entrez: 3383 } })} onQueryChange={vi.fn()} onViewChange={vi.fn()} detail={detail} />
      </HumanbaseProvider>,
    );
    expect(await screen.findByText('Detail for the selection')).toBeInTheDocument();
    expect(detail.mock.lastCall?.[0]).toMatchObject({ selection: { kind: 'gene', entrez: 3383 } });
  });

  it('ranks processes and tissues against the genes in the graph', async () => {
    renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'));
    await screen.findByRole('table', { name: /Genes functionally related/ });
    await userEvent.click(await screen.findByRole('tab', { name: /^Processes \d+$/ }));
    const processes = await screen.findByRole('table', { name: /Biological processes and diseases over-represented/ });
    const first = () => processes.querySelector('tbody tr');
    await vi.waitFor(() => expect(first()).toHaveTextContent(/Gene Ontology \(BP\), \d+ genes/));
    expect(first()).toHaveTextContent(/× 10⁻/);
    await userEvent.click(screen.getByRole('tab', { name: /^Tissues \d+$/ }));
    const tissues = await screen.findByRole('table', { name: /Tissues and cell types/ });
    expect(await within(tissues).findAllByText('BRENDA Ontology')).not.toHaveLength(0);
  });

  it('opens the gene drawer with aliases, IDs and annotations', async () => {
    render(
      <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
        <NetworkExplorer query={new NetworkQuery([3553, 7124], undefined, 'v1')} view={new NetworkView().with({ selection: { kind: 'gene', entrez: 3383 } })} onQueryChange={vi.fn()} onViewChange={vi.fn()} />
      </HumanbaseProvider>,
    );
    const drawer = await screen.findByRole('dialog', { name: 'ICAM1' });
    expect(within(drawer).getByText('BB2, P3.58, CD54')).toBeInTheDocument();
    expect(within(drawer).getByRole('link', { name: /Entrez 3383/ })).toHaveAttribute('href', 'https://www.ncbi.nlm.nih.gov/gene/3383');
    const annotations = within(drawer).getByRole('region', { name: 'Annotations' });
    expect((await within(annotations).findAllByRole('rowheader')).length).toBeGreaterThan(0);
    expect(within(drawer).getByRole('button', { name: 'Add to query' })).toBeInTheDocument();
  });

  it('opens the connection drawer with the evidence behind it', async () => {
    render(
      <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
        <NetworkExplorer query={new NetworkQuery([3553, 7124], undefined, 'v1')} view={new NetworkView().with({ selection: { kind: 'connection', source: 7185, target: 6348 } })} onQueryChange={vi.fn()} onViewChange={vi.fn()} />
      </HumanbaseProvider>,
    );
    const drawer = await screen.findByRole('dialog', { name: 'TRAF1 and CCL3' });
    expect(await within(drawer).findByText('MSigDB CGP')).toBeInTheDocument();
    expect(within(drawer).getByText(/GSEA perturbations, Co-expression|Co-expression, GSEA perturbations/)).toBeInTheDocument();
    await userEvent.click(within(drawer).getByRole('radio', { name: 'All networks' }));
    expect(await within(drawer).findByRole('table', { name: /Connection weight in each network/ })).toBeInTheDocument();
  });

  it('lists the connections as a table and switches back to the graph', async () => {
    const { onViewChange } = renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'), { view: new NetworkView().with({ display: 'table' }) });
    const table = await screen.findByRole('table', { name: /Connections between the genes in the global network graph/ });
    expect(within(table).getAllByRole('row')).toHaveLength(9);
    expect(screen.getByText(/Showing 8 of \d+ connections/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: /^Show 25 more connections/ }));
    expect(within(table).getAllByRole('row')).toHaveLength(34);
    await userEvent.click(within(table).getAllByRole('button', { name: /connection details/ })[0] as HTMLElement);
    expect(onViewChange.mock.lastCall?.[0].selection).toMatchObject({ kind: 'connection' });
    await userEvent.click(screen.getByRole('button', { name: 'View as graph' }));
    expect(onViewChange.mock.lastCall?.[0].display).toBe('graph');
  });

  it('expands the graph to the full width', async () => {
    const { onViewChange } = renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'));
    await screen.findByRole('table', { name: /Genes functionally related/ });
    await userEvent.click(screen.getByRole('button', { name: 'Expand' }));
    expect(onViewChange.mock.lastCall?.[0].expanded).toBe(true);
  });

  it('shows where the query genes are expressed, with a column per gene', async () => {
    renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'), { view: new NetworkView().with({ tab: 'expression' }) });
    expect(await screen.findByRole('heading', { name: 'Where IL1B and TNF are expressed' })).toBeInTheDocument();
    expect(await screen.findByRole('checkbox', { name: 'Hematopoietic system' })).toBeChecked();
    expect(await screen.findByRole('columnheader', { name: 'Average' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Download predictions' })).toBeEnabled();
  });

  it('lists biological processes with each gene’s confidence', async () => {
    renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'), { view: new NetworkView().with({ tab: 'processes' }) });
    const table = await screen.findByRole('table', { name: 'Biological processes linked to IL1B and TNF' });
    expect(within(table).getByRole('columnheader', { name: 'IL1B confidence' })).toBeInTheDocument();
    expect(within(table).getByRole('columnheader', { name: 'TNF confidence' })).toBeInTheDocument();
    expect(screen.getByText(/Showing 50 of \d+ processes/)).toBeInTheDocument();
  });

  it('lists diseases the same way', async () => {
    renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'), { view: new NetworkView().with({ tab: 'diseases' }) });
    expect(await screen.findByRole('table', { name: 'Diseases linked to IL1B and TNF' })).toBeInTheDocument();
  });

  it('asks for a process, then requests that process network', async () => {
    const { onQueryChange } = renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'), { view: new NetworkView().with({ tab: 'process' }) });
    expect(await screen.findByText('Choose a biological process to see its network')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Choose a process' }));
    await userEvent.click(await screen.findByRole('option', { name: 'Acute inflammatory response' }));
    expect(onQueryChange.mock.lastCall?.[0].process).toBe('acute-inflammatory-response');
  });

  it('draws the chosen process network', async () => {
    renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1', [], 'acute-inflammatory-response'), { view: new NetworkView().with({ tab: 'process' }) });
    expect(await screen.findByRole('table', { name: /Genes functionally related to IL1B and TNF in the acute inflammatory response network/ })).toBeInTheDocument();
  });

  it('adds a network to compare from the Compare dialog', async () => {
    const { onQueryChange } = renderExplorer(new NetworkQuery([3553, 7124], undefined, 'v1'));
    await userEvent.click(await screen.findByRole('button', { name: 'Compare' }));
    const dialog = await screen.findByRole('dialog', { name: 'Add a network to compare' });
    expect(within(dialog).getByRole('button', { name: 'Add network' })).toBeDisabled();
    await userEvent.click(within(dialog).getByRole('combobox', { name: 'Tissue' }));
    await userEvent.click(await within(dialog).findByRole('option', { name: 'Mononuclear phagocyte' }));
    await userEvent.click(within(dialog).getByRole('button', { name: 'Add network' }));
    expect(onQueryChange.mock.lastCall?.[0].compare).toEqual({ tissue: 'mononuclear-phagocyte', dataTypes: [] });
  });

  it('draws both networks side by side and lets the genes panel follow either', async () => {
    const query = new NetworkQuery([3553, 7124], undefined, 'v1', [], undefined, { tissue: 'mononuclear-phagocyte', dataTypes: [] });
    const { onQueryChange, onViewChange } = renderExplorer(query);
    const compared = await screen.findByRole('region', { name: 'mononuclear phagocyte network' });
    expect(screen.getByRole('region', { name: 'global network' })).toBeInTheDocument();
    expect(await within(compared).findByText(/connections above 0\.51/)).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Compare' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('radio', { name: 'Mononuclear phagocyte' }));
    expect(onViewChange.mock.lastCall?.[0].focus).toBe('compare');
    await userEvent.click(within(compared).getByRole('button', { name: 'Remove the mononuclear phagocyte network' }));
    expect(onQueryChange.mock.lastCall?.[0].compare).toBeUndefined();
    await userEvent.click(screen.getByRole('button', { name: 'Remove the global network' }));
    expect(onQueryChange.mock.lastCall?.[0].tissue).toBe('mononuclear-phagocyte');
  });
});
