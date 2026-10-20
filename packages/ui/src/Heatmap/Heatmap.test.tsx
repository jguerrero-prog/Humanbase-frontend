import { fireEvent, render, screen } from '@testing-library/react';
import { Heatmap } from './Heatmap';
import { LegendStepped } from './LegendStepped';
import type { ScaleSpec } from './ScoreScale';

const spec: ScaleSpec = { title: 'Log fold change', kind: 'diverging', edges: [-1, -0.3, -0.1, 0.1, 0.3, 1], words: ['Decreases', 'Increases'] };

describe('LegendStepped', () => {
  it('names each step by its range for screen readers', () => {
    render(<LegendStepped spec={spec} />);
    const legend = screen.getByRole('group', { name: 'Log fold change' });
    const steps = screen.getAllByRole('listitem');
    expect(steps).toHaveLength(7);
    expect(steps[0]).toHaveTextContent('below −1');
    expect(steps[3]).toHaveTextContent('−0.1 to 0.1');
    expect(legend).toHaveTextContent('Increases');
  });
});

describe('Heatmap', () => {
  const props = {
    title: 'Predicted effect on IRGM expression',
    summary: 'Effects are small except in the nervous system.',
    scale: spec,
    columns: [{ label: 'a', position: 150226123 }, { label: 'b', position: 150226178 }],
    rows: [
      { label: 'nervous system', values: [-1.42, 0.05] },
      { label: 'integument', values: [null, 0.2] },
    ],
    rowHeader: 'Tissue system',
    columnHeader: 'Position',
  };

  it('labels every cell with its row, column and value, saying when it is past the legend', () => {
    render(<Heatmap {...props} />);
    expect(screen.getByRole('gridcell', { name: 'nervous system, 150,226,123: −1.42, past the end of the legend (−1)' })).toBeInTheDocument();
    expect(screen.getByRole('gridcell', { name: 'integument, 150,226,123: Not available' })).toBeInTheDocument();
  });

  it('moves focus with the arrow keys and shows the tooltip for the focused cell', () => {
    render(<Heatmap {...props} />);
    const first = screen.getByRole('gridcell', { name: /^nervous system, 150,226,123/ });
    expect(first).toHaveAttribute('tabindex', '0');
    first.focus();
    fireEvent.keyDown(first, { key: 'ArrowRight' });
    expect(screen.getByRole('gridcell', { name: /^nervous system, 150,226,178/ })).toHaveFocus();
    expect(screen.getByRole('tooltip')).toHaveTextContent('0.05');
  });

  it('lists a cell\'s detail rows and hint in its tooltip instead of the single value', () => {
    const detail = { rows: [['A', 'Reference'], ['C', '−0.04'], ['G', '+0.12', 'strongest, shown in the cell']] as const, hint: 'Strongest tissue: Spleen, GTEx' };
    render(<Heatmap {...props} rows={[{ label: 'nervous system', values: [-1.42, 0.05], details: [detail, undefined] }, { label: 'integument', values: [null, 0.2] }]} />);
    fireEvent.focus(screen.getByRole('gridcell', { name: /^nervous system, 150,226,123/ }));
    const tip = screen.getByRole('tooltip');
    expect(tip).toHaveTextContent('AReference');
    expect(tip).toHaveTextContent('G+0.12strongest, shown in the cell');
    expect(tip).toHaveTextContent('Strongest tissue: Spleen, GTEx');
  });

  it('outlines the cells in a step while that legend step is hovered', () => {
    render(<Heatmap {...props} />);
    fireEvent.pointerEnter(screen.getByText('below −1'));
    expect(screen.getAllByRole('gridcell')[0]).toHaveAttribute('data-outlined', 'true');
    expect(screen.getAllByRole('gridcell')[1]).not.toHaveAttribute('data-outlined');
  });

  it('offers the same values as a table', () => {
    render(<Heatmap {...props} />);
    expect(screen.getByRole('table', { name: props.summary })).toHaveTextContent('0.2');
  });
});
