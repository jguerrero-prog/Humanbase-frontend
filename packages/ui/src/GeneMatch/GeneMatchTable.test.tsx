import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { GeneMatchList, type GeneMatch } from './GeneMatchList';
import { GeneMatchTable } from './GeneMatchTable';

const gene = (symbol: string, entrez: string): GeneMatch => ({ id: symbol, typed: [symbol], status: 'matched', candidates: [{ entrez, symbol, name: `${symbol} gene` }] });
const list = new GeneMatchList([gene('IL1B', '3553'), gene('TNF', '7124'), { id: 'FOOBAR1', typed: ['FOOBAR1'], status: 'not-found', candidates: [] }]);

describe('GeneMatchTable', () => {
  it('shows a not-found row with Edit and Remove', async () => {
    const onEdit = vi.fn();
    const onRemove = vi.fn();
    render(<GeneMatchTable list={list} onEdit={onEdit} onRemove={onRemove} />);
    const row = screen.getByRole('rowheader', { name: 'FOOBAR1' }).closest('tr') as HTMLElement;
    expect(within(row).getByText('Not found')).toBeInTheDocument();
    await userEvent.click(within(row).getByRole('button', { name: 'Edit' }));
    await userEvent.click(within(row).getByRole('button', { name: 'Remove FOOBAR1' }));
    expect(onEdit).toHaveBeenCalledWith('FOOBAR1');
    expect(onRemove).toHaveBeenCalledWith(['FOOBAR1']);
  });

  it('folds matched genes until asked', async () => {
    render(<GeneMatchTable list={list} foldMatched />);
    expect(screen.queryByRole('rowheader', { name: 'IL1B' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Show all 2' }));
    expect(screen.getByRole('rowheader', { name: 'IL1B' })).toBeInTheDocument();
  });

  it('removes selected rows from the selection bar, unless too few would remain', async () => {
    const onRemove = vi.fn();
    const { unmount } = render(<GeneMatchTable list={list} selectable defaultSelected={['IL1B']} onRemove={onRemove} />);
    expect(screen.getByText('1 gene selected: IL1B')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Remove from list' }));
    expect(onRemove).toHaveBeenCalledWith(['IL1B']);
    unmount();
    render(<GeneMatchTable list={list} selectable defaultSelected={['IL1B']} minimum={{ count: 20, reason: 'Modules needs at least 20 genes.' }} />);
    expect(screen.getByRole('button', { name: 'Remove from list' })).toBeDisabled();
  });
});
