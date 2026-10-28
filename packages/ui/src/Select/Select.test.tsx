import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Select, type SelectOption } from './Select';

const tissues: SelectOption[] = [
  { value: 'adipose', label: 'Adipose tissue' },
  { value: 'blood', label: 'Blood', disabled: true },
  { value: 'vessel', label: 'Blood vessel', description: '25,825 genes' },
  { value: 'brain', label: 'Brain' },
];

const renderSelect = (props: Partial<Parameters<typeof Select>[0]> = {}) =>
  render(<Select label="Tissue network" placeholder="Choose a tissue" options={tissues} {...props} />);

describe('Select', () => {
  it('is a labelled combobox that shows the current value', () => {
    renderSelect({ defaultValue: 'brain' });
    const field = screen.getByRole('combobox', { name: /Tissue network/ });
    expect(field).toHaveTextContent('Brain');
    expect(field).toHaveAttribute('aria-expanded', 'false');
  });

  it('opens with Down Arrow, skips disabled options and chooses with Enter', async () => {
    const onChange = vi.fn();
    renderSelect({ onChange });
    await userEvent.tab();
    await userEvent.keyboard('{ArrowDown}');
    const field = screen.getByRole('combobox');
    expect(field).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('option', { name: 'Adipose tissue' })).toHaveAttribute('id', field.getAttribute('aria-activedescendant'));
    await userEvent.keyboard('{ArrowDown}{Enter}');
    expect(onChange).toHaveBeenCalledWith('vessel');
    expect(field).toHaveFocus();
    expect(field).toHaveTextContent('Blood vessel');
  });

  it('closes with Escape without changing the value', async () => {
    renderSelect({ defaultValue: 'adipose' });
    await userEvent.tab();
    await userEvent.keyboard('{Enter}{ArrowDown}{Escape}');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(screen.getByRole('combobox')).toHaveTextContent('Adipose tissue');
  });

  it('marks the selected option and announces matches as people filter', async () => {
    renderSelect({ defaultValue: 'vessel', searchable: true, filterLabel: 'Filter tissues' });
    await userEvent.click(screen.getByRole('combobox', { name: /Tissue network/ }));
    expect(screen.getByRole('option', { name: /Blood vessel/ })).toHaveAttribute('aria-selected', 'true');
    await userEvent.type(screen.getByRole('combobox', { name: 'Filter tissues' }), 'vessel');
    expect(screen.getAllByRole('option')).toHaveLength(1);
    expect(screen.getByText('1 match')).toBeInTheDocument();
  });

  it('closes when people click outside', async () => {
    render(
      <>
        <Select label="Tissue network" options={tissues} />
        <button type="button">Elsewhere</button>
      </>,
    );
    await userEvent.click(screen.getByRole('combobox'));
    await userEvent.click(screen.getByRole('button', { name: 'Elsewhere' }));
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
  });

  it('opens the list in the top layer, so a scrolling dialog never clips it', async () => {
    renderSelect();
    await userEvent.click(screen.getByRole('combobox'));
    const panel = screen.getByRole('listbox').parentElement;
    expect(panel).toHaveAttribute('popover', 'manual');
    expect(panel).toHaveStyle({ display: 'block' });
  });

  it('draws a docs preview in place', () => {
    renderSelect({ open: true });
    expect(screen.getByRole('listbox').parentElement).not.toHaveAttribute('popover');
  });
});
