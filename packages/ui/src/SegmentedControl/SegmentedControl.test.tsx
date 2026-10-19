import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SegmentedControl } from './SegmentedControl';

const views = [
  { value: 'network', label: 'Network' },
  { value: 'table', label: 'Table' },
  { value: 'heatmap', label: 'Heatmap' },
];

describe('SegmentedControl', () => {
  it('is a radio group named by its visible label', () => {
    render(<SegmentedControl label="View" segments={views} />);
    expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: 'Network' })).toBeChecked();
  });

  it('changes the view on click and with the arrow keys', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="View" segments={views} onChange={onChange} />);
    await userEvent.click(screen.getByText('Table'));
    expect(onChange).toHaveBeenLastCalledWith('table');
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('radio', { name: 'Heatmap' })).toBeChecked();
    expect(onChange).toHaveBeenLastCalledWith('heatmap');
  });

  it('keeps the label for screen readers when it is hidden', () => {
    render(<SegmentedControl label="Show top" hideLabel size="small" segments={[{ value: '10', label: '10' }, { value: '25', label: '25' }]} defaultValue="25" />);
    expect(screen.getByRole('radiogroup', { name: 'Show top' })).toBeInTheDocument();
    expect(screen.getByRole('radio', { name: '25' })).toBeChecked();
  });
});
