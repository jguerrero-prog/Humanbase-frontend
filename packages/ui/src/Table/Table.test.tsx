import { act, render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Cell, HeaderCell, ScoreCell, SelectAllCell, SelectCell, Table, TableMessage, useRowSelection, useTableSort } from './Table';

describe('Table', () => {
  it('is a real table named by its caption, in a scroll region that can take focus', () => {
    render(
      <Table caption="Genes functionally related to IL1B">
        <tbody>
          <tr>
            <Cell type="gene" rowHeader>IL1R1</Cell>
            <ScoreCell value={0.9712} />
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByRole('table', { name: 'Genes functionally related to IL1B' })).toBeInTheDocument();
    expect(screen.getByRole('region', { name: 'Genes functionally related to IL1B' })).toHaveAttribute('tabindex', '0');
    expect(screen.getByRole('rowheader', { name: 'IL1R1' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: '0.97' })).toBeInTheDocument();
  });

  it('keeps cells to one line unless they wrap', () => {
    render(
      <Table caption="Data sources" density="compact">
        <tbody>
          <tr>
            <Cell rowHeader>MAGE</Cell>
            <Cell wrap>289 tissue and cell-type networks</Cell>
            <Cell type="number">7,463</Cell>
          </tr>
        </tbody>
      </Table>,
    );
    expect(screen.getByRole('rowheader', { name: 'MAGE' })).not.toHaveClass('table-cell-wrap');
    expect(screen.getByRole('cell', { name: '289 tissue and cell-type networks' })).toHaveClass('table-cell', 'table-cell-text', 'table-cell-wrap');
    expect(screen.getByRole('cell', { name: '7,463' })).not.toHaveClass('table-cell-wrap');
  });

  it('marks only the sorted column and sorts from a header button', async () => {
    const onSort = vi.fn();
    render(
      <Table caption="Enriched GO terms">
        <thead>
          <tr>
            <HeaderCell sort="none" onSort={onSort}>Term</HeaderCell>
            <HeaderCell align="end" sort="ascending">q-value</HeaderCell>
            <HeaderCell>GO ID</HeaderCell>
          </tr>
        </thead>
      </Table>,
    );
    expect(screen.getByRole('columnheader', { name: 'q-value' })).toHaveAttribute('aria-sort', 'ascending');
    expect(screen.getByRole('columnheader', { name: 'Term' })).not.toHaveAttribute('aria-sort');
    expect(screen.queryByRole('button', { name: 'GO ID' })).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Term' }));
    expect(onSort).toHaveBeenCalledOnce();
  });

  it('keeps the header in place when there is nothing to show', () => {
    render(
      <Table caption="Related genes">
        <tbody>
          <TableMessage columns={2} title="No genes match “IL1Z”" text="Check the spelling or clear the filter." />
        </tbody>
      </Table>,
    );
    expect(screen.getByRole('cell', { name: /No genes match/ })).toHaveAttribute('colspan', '2');
  });
});

describe('Row selection cells', () => {
  function Genes() {
    const ids = ['IL1R1', 'PTGS2'];
    const selection = useRowSelection(ids);
    return (
      <Table caption="Related genes">
        <thead>
          <tr>
            <SelectAllCell label="Select all genes" state={selection.state} onToggle={selection.toggleAll} />
          </tr>
        </thead>
        <tbody>
          {ids.map((id) => (
            <tr key={id}>
              <SelectCell label={`Select ${id}`} checked={selection.isSelected(id)} onToggle={() => selection.toggle(id)} />
            </tr>
          ))}
        </tbody>
      </Table>
    );
  }

  it('shows a mixed select-all box while some rows are selected', async () => {
    render(<Genes />);
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select PTGS2' }));
    expect(screen.getByRole('checkbox', { name: 'Select all genes' })).toBePartiallyChecked();
    await userEvent.click(screen.getByRole('checkbox', { name: 'Select all genes' }));
    expect(screen.getByRole('checkbox', { name: 'Select IL1R1' })).toBeChecked();
  });
});

describe('useTableSort', () => {
  it('reverses the sorted column and starts a new one in its own first direction', () => {
    const { result } = renderHook(() => useTableSort<'score' | 'gene'>({ column: 'score', direction: 'descending' }));
    act(() => result.current.toggle('score'));
    expect(result.current.directionOf('score')).toBe('ascending');
    act(() => result.current.toggle('gene'));
    expect(result.current.sort).toEqual({ column: 'gene', direction: 'ascending' });
    expect(result.current.directionOf('score')).toBe('none');
  });
});

describe('useRowSelection', () => {
  it('selects rows one at a time or all at once', () => {
    const { result } = renderHook(() => useRowSelection(['IL1R1', 'PTGS2', 'ICAM1']));
    act(() => result.current.toggle('PTGS2'));
    expect(result.current.state).toBe('some');
    act(() => result.current.toggleAll());
    expect(result.current.count).toBe(3);
    expect(result.current.state).toBe('all');
    act(() => result.current.toggleAll());
    expect(result.current.state).toBe('none');
  });
});
