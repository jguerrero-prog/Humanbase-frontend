import { ApiError, Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { TopBarSearch } from './TopBarSearch';

function renderSearch(api = new Humanbase(SampleClient.bundled())) {
  render(
    <HumanbaseProvider api={api}>
      <TopBarSearch />
    </HumanbaseProvider>,
  );
  return screen.getByRole('combobox', { name: 'Search genes' });
}

describe('TopBarSearch', () => {
  it('lists a gene with the pages it can open in', async () => {
    await userEvent.type(renderSearch(), 'SHANK3');
    const row = await screen.findByRole('row', { name: /SHANK3/ }, { timeout: 2000 });
    expect(within(row).getByRole('link', { name: 'SHANK3 in Networks' })).toHaveAttribute('href', '/networks/?entrez=85358&version=v3');
    expect(within(row).getByRole('link', { name: 'SHANK3 in Expression effects' })).toHaveAttribute('href', '/expression-effects/genes/85358/');
    expect(within(row).getByRole('link', { name: 'SHANK3 in Genome browser' })).toHaveAttribute('href', '/genome/?gene=SHANK3');
  });

  it('shows the first five genes of many, with the diseases each matched', async () => {
    await userEvent.type(renderSearch(), 'autism');
    expect(await screen.findByText('5 of 21', {}, { timeout: 2000 })).toBeInTheDocument();
    expect(screen.getAllByRole('row')).toHaveLength(5);
    expect(within(screen.getByRole('row', { name: /PTCHD1/ })).getByText('autism spectrum disorder')).toBeInTheDocument();
  });

  it('says when no gene matches', async () => {
    await userEvent.type(renderSearch(), 'NOTAGENE123');
    expect(await screen.findByText('No genes match “NOTAGENE123”', { selector: 'p:not(.visually-hidden)' }, { timeout: 2000 })).toBeInTheDocument();
  });

  it('says the search failed, not that no gene matches, and Try again searches again', async () => {
    const api = new Humanbase(SampleClient.bundled());
    const failing = vi.spyOn(api.search, 'suggest').mockRejectedValue(new ApiError(502, 'genes/search/partial/'));
    await userEvent.type(renderSearch(api), 'SHANK3');
    expect(await screen.findByText('Suggestions couldn’t load', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.queryByText(/No genes match/)).not.toBeInTheDocument();
    failing.mockRestore();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(await screen.findByRole('row', { name: /SHANK3/ }, { timeout: 2000 })).toBeInTheDocument();
  });
});
