import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { SearchField } from './SearchField';

describe('SearchField', () => {
  it('is a search box with a label that is hidden but present', () => {
    render(<SearchField label="Search genes" placeholder="Search a gene, for example IL1B" />);
    expect(screen.getByRole('searchbox', { name: 'Search genes' })).toBeInTheDocument();
  });

  it('shows a clear button once there is text, and clearing returns focus', async () => {
    render(<SearchField label="Search genes" />);
    const box = screen.getByRole('searchbox');
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    await userEvent.type(box, 'IL1B');
    await userEvent.click(screen.getByRole('button', { name: 'Clear search' }));
    expect(box).toHaveValue('');
    expect(box).toHaveFocus();
  });

  it('clears with Escape', async () => {
    const onClear = vi.fn();
    render(<SearchField label="Search genes" defaultValue="IL1B" onClear={onClear} />);
    await userEvent.type(screen.getByRole('searchbox'), '{Escape}');
    expect(screen.getByRole('searchbox')).toHaveValue('');
    expect(onClear).toHaveBeenCalledOnce();
  });

  it('swaps the clear button for a spinner while loading', () => {
    render(<SearchField label="Search genes" defaultValue="IL1B" loading />);
    expect(screen.queryByRole('button', { name: 'Clear search' })).not.toBeInTheDocument();
    expect(screen.getByRole('searchbox')).toHaveAttribute('aria-busy', 'true');
  });
});

describe('SearchField suggestions', () => {
  const genes = [
    { id: '3552', label: 'IL1A', description: 'interleukin 1 alpha', meta: '3552' },
    { id: '3553', label: 'IL1B', description: 'interleukin 1 beta', meta: '3553' },
  ];

  it('becomes a combobox that opens as people type and announces the count', async () => {
    render(<SearchField label="Search genes" suggestions={genes} />);
    const box = screen.getByRole('combobox', { name: 'Search genes' });
    await userEvent.type(box, 'IL1');
    expect(box).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getAllByRole('option')).toHaveLength(2);
    expect(screen.getByText('2 suggestions')).toBeInTheDocument();
  });

  it('opens the highlighted gene with Enter', async () => {
    const onSuggestionSelect = vi.fn();
    render(<SearchField label="Search genes" suggestions={genes} onSuggestionSelect={onSuggestionSelect} />);
    await userEvent.type(screen.getByRole('combobox'), 'IL1{ArrowDown}{ArrowDown}{Enter}');
    expect(onSuggestionSelect).toHaveBeenCalledWith(genes[1]);
  });

  it('closes on the first Escape and clears on the second', async () => {
    render(<SearchField label="Search genes" suggestions={genes} />);
    const box = screen.getByRole('combobox');
    await userEvent.type(box, 'IL1{Escape}');
    expect(box).toHaveAttribute('aria-expanded', 'false');
    expect(box).toHaveValue('IL1');
    await userEvent.keyboard('{Escape}');
    expect(box).toHaveValue('');
  });

  it('says when nothing matches', async () => {
    render(<SearchField label="Search genes" suggestions={[]} />);
    await userEvent.type(screen.getByRole('combobox'), 'IL1Z');
    expect(screen.getAllByText('No genes match “IL1Z”')).toHaveLength(2);
  });
});
