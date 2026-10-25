import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import type { GenomeBrowserEngine } from '@humanbase/genome';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { AsdExplorer, type AsdState } from './AsdExplorer';

// Drawing the tracks reads the genome samples in the background; TrackEngine has its own tests.
class BlankEngine implements GenomeBrowserEngine {
  async mount() {}
  showRegion() {}
  highlight() {}
  showTracks() {}
  arrangeTracks() {}
  async exportSvg() {
    return new Blob([], { type: 'image/svg+xml' });
  }
  destroy() {}
}
const blankEngine = () => new BlankEngine();

function Page({ start }: { start: AsdState }) {
  const [state, setState] = useState(start);
  return <AsdExplorer state={state} engine={blankEngine} onStateChange={(next) => setState((current) => ({ ...current, ...next }))} />;
}

function renderPage(start: AsdState = { view: 'browser', set: 'dna' }) {
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <Page start={start} />
    </HumanbaseProvider>,
  );
}

describe('AsdExplorer', () => {
  // The first render loads the samples and compiles the page, which would otherwise slow whichever test runs first.
  beforeAll(async () => {
    renderPage();
    await screen.findByText('Molecular effects of chr1:2,337,101 A>C', {}, { timeout: 5000 });
    await userEvent.click(screen.getByText('Tracks', { selector: 'button' }));
    cleanup();
  });

  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('opens the browser on the variant nearest the middle, with its strongest DNA effects', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Molecular effects of chr1:2,337,101 A>C' }, { timeout: 5000 })).toBeInTheDocument();
    expect(await screen.findByRole('tab', { name: 'Heatmap' }, { timeout: 5000 })).toHaveAttribute('aria-selected', 'true');
    await userEvent.click(screen.getByRole('tab', { name: 'Strongest effects' }));
    expect(await screen.findByText('Raises, 39 DNA features', {}, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText(/^34 variants in view/)).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Next variant' }));
    expect(await screen.findByRole('heading', { name: /^Molecular effects of chr1:2,346,/ }, { timeout: 5000 })).toBeInTheDocument();
  });

  it('links the ASD Browser’s score type documentation and its data file, as humanbase.io does', async () => {
    renderPage();
    await screen.findByRole('heading', { name: 'Molecular effects of chr1:2,337,101 A>C' }, { timeout: 5000 });
    expect(screen.getByRole('link', { name: /Score type documentation/ })).toHaveAttribute('href', '/docs/asdbrowser/#output');
    expect(screen.getByRole('link', { name: /Download data/ })).toHaveAttribute('href', 'https://s3-us-west-2.amazonaws.com/humanbase/variants/dis_asd.tsv');
  });

  it('keeps the chosen effects tab while stepping to another variant', async () => {
    renderPage();
    await userEvent.click(await screen.findByRole('tab', { name: 'All features' }, { timeout: 5000 }));
    await userEvent.click(screen.getByRole('button', { name: 'Next variant' }));
    expect(await screen.findByRole('heading', { name: /^Molecular effects of chr1:2,346,/ }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('tab', { name: 'All features' })).toHaveAttribute('aria-selected', 'true');
  });

  it('starts the effects afresh for a variant picked with Next variant', async () => {
    renderPage();
    const search = await screen.findByRole('searchbox', { name: 'Find a DNA feature or cell type' }, { timeout: 5000 });
    await userEvent.type(search, 'K562');
    await userEvent.click(screen.getByRole('button', { name: 'Next variant' }));
    expect(await screen.findByRole('heading', { name: /^Molecular effects of chr1:2,346,/ }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByRole('searchbox', { name: 'Find a DNA feature or cell type' })).toHaveValue('');
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

  it('shows and hides tracks from the Tracks drawer, remembers the choice, and opens Export', async () => {
    renderPage();
    await screen.findByText('Molecular effects of chr1:2,337,101 A>C', {}, { timeout: 5000 });
    await userEvent.click(screen.getByText('Tracks', { selector: 'button' }));
    const drawer = within(screen.getByRole('dialog', { name: 'Tracks' }));
    expect(drawer.getAllByRole('checkbox').map((box) => (box as HTMLInputElement).labels?.[0]?.textContent)).toEqual(['Sequence', 'DNA disease impact score', 'RNA disease impact score', 'Conservation', 'GM12878 ChromHMM', 'Genes']);
    expect(drawer.getByLabelText('GM12878 ChromHMM')).not.toBeChecked();
    expect(drawer.getByLabelText('By URL')).toHaveAttribute('type', 'radio');
    expect(drawer.getByLabelText('Conservation')).not.toBeChecked();
    await userEvent.click(drawer.getByLabelText('Conservation'));
    expect(screen.getByLabelText(/5 tracks$/)).toHaveAttribute('role', 'application');
    await userEvent.click(drawer.getByLabelText('Genes'));
    expect(drawer.getByLabelText('Conservation')).toBeChecked();
    expect(JSON.parse(localStorage.getItem('humanbase:genome-tracks:asd:hg19') ?? '')).toEqual(['GM12878 ChromHMM', 'genes']);
    await userEvent.click(drawer.getByText('Reset to default tracks', { selector: 'button' }));
    expect(drawer.getByLabelText('Conservation')).not.toBeChecked();
    expect(drawer.getByLabelText('Genes')).toBeChecked();
    await userEvent.click(drawer.getByText('Done', { selector: 'button' }));
    await userEvent.click(screen.getByRole('button', { name: 'Export' }));
    expect(screen.getByRole('dialog', { name: 'Export the view' })).toBeInTheDocument();
  });

  it('explains a gene the samples don’t have while the API is off', async () => {
    renderPage();
    await userEvent.type(screen.getByRole('searchbox', { name: 'Find a gene, region or position' }), 'SHANK3{Enter}');
    expect(await screen.findByText(/the sample data covers chr1:2,230,000-2,440,000 and the CHD8, SCN2A and CHD9 examples/)).toBeInTheDocument();
  });
});
