import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MultiSelect, multiSelectSummary } from './MultiSelect';

const types = [
  { value: 'coexp', label: 'Co-expression' },
  { value: 'interaction', label: 'Interaction' },
  { value: 'tf', label: 'TF binding' },
];

const panel = () => screen.getByText('Applies when the menu closes').parentElement as HTMLElement;

const close = (element: HTMLElement) => {
  const event = new Event('toggle');
  Object.assign(event, { newState: 'closed', oldState: 'open' });
  fireEvent(element, event);
};

describe('MultiSelect', () => {
  it('summarizes all, one or some of the options', () => {
    expect(multiSelectSummary(types, new Set(['coexp', 'interaction', 'tf']), 'types')).toBe('All 3 types');
    expect(multiSelectSummary(types, new Set(['tf']), 'types')).toBe('TF binding');
    expect(multiSelectSummary(types, new Set(['coexp', 'tf']), 'types')).toBe('2 of 3 types');
  });

  it('applies the whole change once, when the menu closes', async () => {
    const onChange = vi.fn();
    render(<MultiSelect label="Data types" noun="types" options={types} value={[]} onChange={onChange} />);
    panel().showPopover();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Co-expression' }));
    await userEvent.click(screen.getByRole('checkbox', { name: 'Interaction' }));
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Data types' })).toHaveTextContent('TF binding');
    close(panel());
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(onChange).toHaveBeenCalledWith(['tf']);
  });

  it('keeps at least one option and sends nothing when the choice is unchanged', async () => {
    const onChange = vi.fn();
    render(<MultiSelect label="Data types" noun="types" options={types} value={['tf']} onChange={onChange} />);
    panel().showPopover();
    await userEvent.click(screen.getByRole('checkbox', { name: 'TF binding' }));
    expect(screen.getByRole('checkbox', { name: 'TF binding' })).toBeChecked();
    close(panel());
    expect(onChange).not.toHaveBeenCalled();
  });
});
