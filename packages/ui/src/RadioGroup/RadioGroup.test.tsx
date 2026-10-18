import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadioGroup } from './RadioGroup';

const networks = [
  { value: 'tissue', label: 'Tissue-specific network', description: 'Uses genes active in the tissue you choose.' },
  { value: 'global', label: 'Global network', description: 'Uses all tissues.' },
];

describe('RadioGroup', () => {
  it('is a fieldset named by its legend, with a hint', () => {
    render(<RadioGroup legend="Network" hint="Which network NetWAS uses." options={networks} defaultValue="tissue" />);
    const group = screen.getByRole('group', { name: 'Network' });
    expect(group).toHaveAccessibleDescription('Which network NetWAS uses.');
    expect(screen.getByRole('radio', { name: /Tissue-specific network/ })).toBeChecked();
  });

  it('reports the chosen value', async () => {
    const onChange = vi.fn();
    render(<RadioGroup legend="Network" options={networks} onChange={onChange} />);
    await userEvent.click(screen.getByText('Global network'));
    expect(onChange).toHaveBeenCalledWith('global');
    expect(screen.getByRole('radio', { name: /Global network/ })).toBeChecked();
  });

  it('describes the group with the error', () => {
    render(<RadioGroup legend="Network" options={networks} error="Choose a network so NetWAS knows which genes to compare." />);
    expect(screen.getByRole('group')).toHaveAccessibleDescription('Error: Choose a network so NetWAS knows which genes to compare.');
  });
});
