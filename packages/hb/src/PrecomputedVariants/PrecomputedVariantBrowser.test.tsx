import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { PrecomputedVariantBrowser, type PrecomputedVariantState } from './PrecomputedVariantBrowser';
import { seqweaverGnomad } from './seqweaverGnomad';

function Page({ start }: { start: PrecomputedVariantState }) {
  const [state, setState] = useState(start);
  return <PrecomputedVariantBrowser set={seqweaverGnomad} state={state} onStateChange={setState} />;
}

function renderPage(start: PrecomputedVariantState = {}) {
  render(
    <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
      <Page start={start} />
    </HumanbaseProvider>,
  );
}

describe('PrecomputedVariantBrowser', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('opens on the gnomAD variant nearest the middle, as humanbase.io’s /seqweaver does, and steps to the next', async () => {
    renderPage();
    expect(await screen.findByRole('heading', { name: 'Molecular effects of chr1:2,334,919 C>T' }, { timeout: 5000 })).toBeInTheDocument();
    expect(screen.getByText(/^78 variants in view/)).toBeInTheDocument();
    expect(screen.getByText(/Seqweaver \(log e-value\)\. Showing the top 20 of 232 proteins/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Score type documentation/ })).toHaveAttribute('href', '/docs/seqweaver/#molecular-level-biochemical-effects-prediction');
    await userEvent.click(screen.getByRole('button', { name: 'Next variant' }));
    expect(await screen.findByRole('heading', { name: 'Molecular effects of chr1:2,335,285 G>A' }, { timeout: 5000 })).toBeInTheDocument();
  }, 20_000);

  it('says what the sample data covers when the view leaves it with the API off', async () => {
    renderPage({ location: 'chr1:2,230,000-2,440,000' });
    expect(await screen.findByText('The sample data doesn’t include this range', {}, { timeout: 5000 })).toBeInTheDocument();
  });
});
