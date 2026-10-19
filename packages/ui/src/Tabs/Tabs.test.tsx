import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Tabs, type TabItem } from './Tabs';

const sections: TabItem[] = [
  { value: 'overview', label: 'Overview' },
  { value: 'interactions', label: 'Interactions', count: 210 },
  { value: 'functions', label: 'Functions', disabled: true },
  { value: 'diseases', label: 'Diseases', count: 12 },
];

describe('Tabs', () => {
  it('is a labelled tab list with one tab in the Tab order', () => {
    render(<Tabs label="IL1B sections" tabs={sections} defaultValue="interactions"><p>Partners</p></Tabs>);
    expect(screen.getByRole('tablist', { name: 'IL1B sections' })).toBeInTheDocument();
    const selected = screen.getByRole('tab', { name: 'Interactions 210' });
    expect(selected).toHaveAttribute('aria-selected', 'true');
    expect(selected).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('tabindex', '-1');
    expect(screen.getByRole('tabpanel', { name: 'Interactions 210' })).toHaveTextContent('Partners');
  });

  it('opens tabs with the arrow keys, skipping disabled ones, and with Home and End', async () => {
    const onChange = vi.fn();
    render(<Tabs label="IL1B sections" tabs={sections} defaultValue="interactions" onChange={onChange} />);
    await userEvent.tab();
    await userEvent.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Diseases 12' })).toHaveFocus();
    expect(onChange).toHaveBeenLastCalledWith('diseases');
    await userEvent.keyboard('{Home}');
    expect(screen.getByRole('tab', { name: 'Overview' })).toHaveAttribute('aria-selected', 'true');
    await userEvent.keyboard('{End}{ArrowLeft}');
    expect(onChange).toHaveBeenLastCalledWith('interactions');
  });

  it('selects the first enabled tab when no value is given', () => {
    render(<Tabs label="Results" tabs={sections.slice(2)} />);
    expect(screen.getByRole('tab', { name: 'Diseases 12' })).toHaveAttribute('aria-selected', 'true');
  });
});
