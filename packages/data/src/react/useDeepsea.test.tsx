import { fireEvent, render, screen } from '@testing-library/react';
import { useState, type ReactNode } from 'react';
import type { DataClient } from '../DataClient';
import { Humanbase } from '../Humanbase';
import type { VariantModel } from '../jobs/VariantFileCheck';
import { SampleClient } from '../sample/SampleClient';
import { HumanbaseProvider } from './HumanbaseProvider';
import { useDeepseaFeatureCount } from './useDeepsea';

function Count({ model }: { model: VariantModel }) {
  const count = useDeepseaFeatureCount(model);
  return <p>{count === undefined ? 'No count' : `${count} features`}</p>;
}

function Remounting({ model }: { model: VariantModel }) {
  const [shown, setShown] = useState(true);
  return (
    <>
      {shown && <Count model={model} />}
      <button type="button" onClick={() => setShown((value) => !value)}>
        Toggle
      </button>
    </>
  );
}

function renderWith(client: DataClient, ui: ReactNode) {
  const get = vi.spyOn(client, 'get');
  render(<HumanbaseProvider api={new Humanbase(client)}>{ui}</HumanbaseProvider>);
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

  it('gives Sei’s 21,907 profiles without loading its 4 MB list', async () => {
    const calls = renderWith(SampleClient.bundled(), <Count model="sei" />);
    await screen.findByText('21907 features');
    expect(calls('deepsea/Sei/features/')).toBe(0);
  });
});
