import { ApiError, Humanbase, HumanbaseProvider, SampleClient, type NetworkQuery } from '@humanbase/data';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { HomeSearch } from './HomeSearch';
import { hes1List } from './recordedLists.testdata';

function renderSearch(api = new Humanbase(SampleClient.bundled())) {
  const onShowNetwork = vi.fn<(query: NetworkQuery) => void>();
  render(
    <HumanbaseProvider api={api}>
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

  it('keeps both genes when two example searches finish out of order', async () => {
    renderSearch();
    fireEvent.click(screen.getByRole('button', { name: 'IL1B' }));
    fireEvent.click(screen.getByRole('button', { name: 'BRCA1' }));
    const table = await screen.findByRole('table', { name: 'How your genes matched' });
    expect(await within(table).findByText('BRCA1 DNA repair associated')).toBeInTheDocument();
    expect(within(table).getByText('interleukin 1 beta')).toBeInTheDocument();
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

  it('includes the first gene of a term that matched several, as humanbase.io does, and lets people pick another', async () => {
    const { onShowNetwork } = renderSearch();
    await userEvent.click(screen.getByRole('combobox', { name: 'Search genes' }));
    await userEvent.paste(hes1List.join('\n'));
    await userEvent.keyboard('{Enter}');
    const choice = await screen.findByRole('group', { name: 'Gene for HES1' });
    expect(within(choice).getByRole('radio', { name: /^HES1,/ })).toBeChecked();
    expect(within(choice).getByText('Using HES1. Pick another gene to change it.')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show network for 25 genes' })).toBeEnabled();
    await userEvent.click(within(choice).getByRole('radio', { name: /^GATD3,/ }));
    await userEvent.click(screen.getByRole('button', { name: 'Show network for 25 genes' }));
    expect(onShowNetwork.mock.calls[0]?.[0].href).toContain('entrez=8209');
  });

  it('suggests genes while typing and says which alias matched', async () => {
    renderSearch();
    await userEvent.type(screen.getByRole('combobox', { name: 'Search genes' }), 'IL1B');
    expect(await screen.findByRole('option', { name: /CASP1/ }, { timeout: 2000 })).toHaveTextContent('Matched on its alias IL1BC');
  });

  it('says the suggestions failed, not that no gene matches, and Try again searches again', async () => {
    const api = new Humanbase(SampleClient.bundled());
    const failing = vi.spyOn(api.search, 'suggest').mockRejectedValue(new ApiError(502, 'genes/search/partial/'));
    renderSearch(api);
    await userEvent.type(screen.getByRole('combobox', { name: 'Search genes' }), 'IL1B');
    expect(await screen.findByText('Suggestions couldn’t load', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText(/No genes match/)).not.toBeInTheDocument();
    failing.mockRestore();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('option', { name: /CASP1/ }, { timeout: 2000 })).toBeInTheDocument();
  });
});
