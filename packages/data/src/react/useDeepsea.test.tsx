import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import type { DataClient } from '../DataClient';
import { Humanbase } from '../Humanbase';
import type { VariantModel } from '../jobs/VariantFileCheck';
import { SampleClient } from '../sample/SampleClient';
import { HumanbaseProvider } from './HumanbaseProvider';
import { useDeepseaFeatureCount, useDeepseaFeatures } from './useDeepsea';

function Count({ model }: { model: VariantModel }) {
  const count = useDeepseaFeatureCount(model);
  return <p>{count === undefined ? 'No count' : `${count} features`}</p>;
}

function Remounting({ model, preload = false }: { model: VariantModel; preload?: boolean }) {
  const [shown, setShown] = useState(true);
  return (
    <>
      {preload && <Preload model={model} />}
      {shown && <Count model={model} />}
      <button type="button" onClick={() => setShown((value) => !value)}>
        Toggle
      </button>
    </>
  );
}

function Preload({ model }: { model: VariantModel }) {
  useDeepseaFeatures(model);
  return null;
}

function renderWith(client: DataClient, ui: ReactNode) {
  const get = vi.spyOn(client, 'get');
  render(<HumanbaseProvider api={new Humanbase(client, true)}>{ui}</HumanbaseProvider>);
  return (path: string) => get.mock.calls.filter(([called]) => called === path).length;
}

describe('useDeepseaFeatureCount', () => {
  it('counts Beluga’s recorded list, read once for the session', async () => {
    const calls = renderWith(SampleClient.bundled(), <Remounting model="beluga" />);
    await screen.findByText('2002 features');
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    expect(screen.queryByText('2002 features')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Toggle' }));
    await screen.findByText('2002 features');
    expect(calls('deepsea/Beluga/features/')).toBe(1);
  });

  it('never loads Sei’s 4 MB list just to count it', async () => {
    const calls = renderWith(SampleClient.bundled(), <Count model="sei" />);
    await screen.findByText('No count');
    expect(calls('deepsea/Sei/features/')).toBe(0);
  });

  it('counts Sei’s list when another view has already loaded it', async () => {
    const client: DataClient = { get: async <T,>() => ({ model_features: [{ idx: 0 }, { idx: 1 }, { idx: 2 }] }) as T, post: async () => Promise.reject(new Error('No posts')), text: async () => '' };
    const calls = renderWith(client, <Remounting model="sei" preload />);
    await screen.findByText('3 features');
    expect(calls('deepsea/Sei/features/')).toBe(1);
  });
});
