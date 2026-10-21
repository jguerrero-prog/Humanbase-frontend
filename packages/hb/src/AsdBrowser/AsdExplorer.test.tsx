import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AsdExplorer, type AsdState } from './AsdExplorer';

function Page({ start }: { start: AsdState }) {
  const [state, setState] = useState(start);
  return <AsdExplorer state={state} onStateChange={(next) => setState((current) => ({ ...current, ...next }))} />;
}

function renderPage(start: AsdState = { view: 'browser', set: 'dna' }) {
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <Page start={start} />
    </HumanbaseProvider>,
  );
}

describe('AsdExplorer', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('opens the browser on the variant nearest the middle, with its strongest DNA effects', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Molecular effects of chr1:2,337,101 A>C' }, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByText('Raises, 39 DNA features', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText(/^34 variants in view/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next variant' }));
    expect(await screen.findByRole('heading', { name: /^Molecular effects of chr1:2,346,/ }, { timeout: 5000 })).toBeInTheDocument();
  });

  it('links the ASD Browser’s score type documentation and its data file, as humanbase.io does', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Molecular effects of chr1:2,337,101 A>C' }, { timeout: 5000 });
    expect(screen.getByRole('link', { name: /Score type documentation/ })).toHaveAttribute('href', 'https://humanbase.readthedocs.io/en/latest/asdbrowser.html#output');
    expect(screen.getByRole('link', { name: /Download data/ })).toHaveAttribute('href', 'https://s3-us-west-2.amazonaws.com/humanbase/variants/dis_asd.tsv');
  });

  it('keeps the chosen effects tab while stepping to another variant', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'Heatmap' }, { timeout: 5000 }));
    await userEvent.click(screen.getByRole('button', { name: 'Next variant' }));
    expect(await screen.findByRole('heading', { name: /^Molecular effects of chr1:2,346,/ }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'Heatmap' })).toHaveAttribute('aria-selected', 'true');
  });

  it('lists every variant in pages of 25, and finds a gene’s variants', async () => {
    renderPage({ view: 'table', set: 'dna' });
    const table = await screen.findByRole('table', { name: 'ASD Browser variants' }, { timeout: 5000 });
    expect(within(table).getAllByRole('row')).toHaveLength(26);
    expect(screen.getByText('127,133 variants')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'CHD8' }));
    expect(await screen.findByText('2 variants', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('checkbox', { name: 'Only the genome browser’s range' })).toBeChecked();
  });

  it('explains a gene the samples don’t have while the API is off', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Find a gene, region or position' }), 'SHANK3{Enter}');
    expect(await screen.findByText(/the sample data covers chr1:2,230,000-2,440,000 and the CHD8, SCN2A and CHD9 examples/)).toBeInTheDocument();
  });
});
