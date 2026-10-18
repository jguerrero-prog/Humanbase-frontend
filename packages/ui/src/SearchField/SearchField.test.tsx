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
