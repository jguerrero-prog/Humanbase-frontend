import { Humanbase, HumanbaseProvider, SampleClient } from '@humanbase/data';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { SeiHgmdBrowser, type SeiHgmdState } from './SeiHgmdBrowser';

const changes: Partial<SeiHgmdState>[] = [];

function Page({ start }: { start: SeiHgmdState }) {
  const [state, setState] = useState(start);
  const change = (next: Partial<SeiHgmdState>) => {
    changes.push(next);
    setState((current) => ({ ...current, ...next }));
  };
  return <SeiHgmdBrowser state={state} onStateChange={change} />;
}

describe('SeiHgmdBrowser', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  it('steps Previous and Next through all 853 variants in the chosen order, moving the view only to leave it', async () => {
    render(
      <HumanbaseProvider api={new Humanbase(SampleClient.bundled())}>
        <Page start={{ view: 'genome', order: 'default', location: 'chr17:73,789,907-73,889,907', variant: 'chr17-73839907-C-T' }} />
      </HumanbaseProvider>,
    );
    expect(await screen.findByText(/step through all 853 HGMD variants in the dataset’s order\.$/, {}, { timeout: 5000 })).toBeInTheDocument();
    const heading = (name: RegExp) => screen.findByRole('heading', { name }, { timeout: 5000 });
    expect(await heading(/^Molecular effects of chr17:73,839,907/)).toBeInTheDocument();

    await userEvent.click(screen.getByRole('button', { name: 'Next variant' }));
    expect(await heading(/^Molecular effects of chr17:73,839,908/)).toBeInTheDocument();
    expect(changes.at(-1)?.location).toBe('chr17:73,789,907-73,889,907');

    await userEvent.click(screen.getByRole('button', { name: 'Next variant' }));
    expect(await heading(/^Molecular effects of chrX:37,639,264/)).toBeInTheDocument();
    expect(changes.at(-1)?.location).toBe('chrX:37,589,264-37,689,264');

    await userEvent.click(screen.getByRole('button', { name: 'Previous variant' }));
    expect(changes.at(-1)).toEqual({ variant: 'chr17-73839908-G-A', location: 'chr17:73,789,908-73,889,908' });
  }, 20_000);
});
