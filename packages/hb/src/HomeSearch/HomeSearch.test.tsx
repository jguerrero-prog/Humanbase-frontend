import { Humanbase, HumanbaseProvider, SampleClient, type NetworkQuery } from '@humanbase/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeSearch } from './HomeSearch';

function renderSearch() {
  const onShowNetwork = vi.fn<(query: NetworkQuery) => void>();
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <HomeSearch onShowNetwork={onShowNetwork} onChooseAnalysis={vi.fn()} onExampleSet={vi.fn()} />
    </HumanbaseProvider>,
  );
  return { onShowNetwork };
}

describe('HomeSearch', () => {
  it('runs an example search straight away and switches to Networks', async () => {
    renderSearch();
    await userEvent.click(screen.getByRole('button', { name: 'IL1B' }));
    const table = await screen.findByRole('table', { name: 'How your genes matched' });
    expect(within(table).getByText('interleukin 1 beta')).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Analysis' })).toHaveTextContent('Networks');
    expect(screen.getByRole('button', { name: 'Show network for 1 gene' })).toBeEnabled();
  });

  it('warns about a gene that is in no network and leaves it out of the network', async () => {
    const { onShowNetwork } = renderSearch();
    const box = screen.getByRole('combobox', { name: 'Search genes' });
    await userEvent.type(box, 'AUTS12 IL1B TNF{Enter}');
    expect(await screen.findByText('2 genes will be analyzed in MAGE')).toBeInTheDocument();
    expect(screen.getByText(/AUTS12 is a recognized gene, but it is not part of any Humanbase network/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove AUTS12 from the list' }));
    expect(screen.queryByText('2 genes will be analyzed in MAGE')).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show network for 2 genes' }));
    expect(onShowNetwork.mock.calls[0]?.[0].href).toBe('/networks/?entrez=3553&entrez=7124&version=v3');
  });

  it('suggests genes while typing and says which alias matched', async () => {
    renderSearch();
    await userEvent.type(screen.getByRole('combobox', { name: 'Search genes' }), 'IL1B');
    expect(await screen.findByRole('option', { name: /CASP1/ }, { timeout: 2000 })).toHaveTextContent('Matched on its alias IL1BC');
  });
});
