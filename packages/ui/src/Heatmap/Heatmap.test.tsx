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

  it('keeps the full row name for hover and screen readers when the label is cut', () => {
    render(<Heatmap {...props} />);
    const grid = screen.getByRole('grid');
    const label = screen.getAllByRole('rowheader').find((header) => grid.contains(header));
    expect(label).toHaveAccessibleName('nervous system');
    expect(label).toHaveAttribute('title', 'nervous system');
  });

  it('pins the tooltip on click with a genome browser link, ignores hover until Escape', () => {
    const linked = { ...props, columns: props.columns.map((column) => ({ ...column, href: `https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=chr1:${column.position}` })) };
    render(<Heatmap {...linked} />);
    fireEvent.click(screen.getByRole('gridcell', { name: /^nervous system, 150,226,123/ }));
    const pinned = screen.getByRole('dialog', { name: 'nervous system' });
    expect(screen.getByRole('link', { name: /Open in Genome Browser/ })).toHaveAttribute('href', 'https://genome.ucsc.edu/cgi-bin/hgTracks?db=hg19&position=chr1:150226123');
    fireEvent.pointerEnter(screen.getByRole('gridcell', { name: /^nervous system, 150,226,178/ }));
    expect(pinned).toHaveTextContent('Position 150,226,123');
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: /150,226,178/ })).toHaveLength(1);
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

function setBox(element: HTMLElement, box: { scrollLeft?: number; clientWidth: number; scrollWidth: number }) {
  for (const [key, value] of Object.entries(box)) Object.defineProperty(element, key, { configurable: true, value });
}

describe('Heatmap in a scrolling plot', () => {
  const columns = Array.from({ length: 60 }, (_, index) => ({ label: `c${index}`, position: 89_623_000 + index }));
  const props = {
    title: 'Cell types by position',
    summary: 'Predicted effects of 60 positions.',
    scale: { title: 'Expression effect, z-score', kind: 'diverging' as const, edges: [-100, -30, -10, 10, 30, 100], words: ['Decreases', 'Increases expression'] as const },
    columns,
    rows: [{ label: 'Microglia / brain', values: columns.map(() => 1) }],
    rowHeader: 'Cell type',
    columnHeader: 'Position',
    columnWidth: 'narrow' as const,
  };

  it('fades its edge while there is more, and hides a position label the scroll edge or the pinned row labels would cut', () => {
    const { container } = render(<Heatmap {...props} />);
    const plot = container.querySelector<HTMLElement>('.heatmap-plot');
    const labels = [...container.querySelectorAll<HTMLElement>('.heatmap-position-labels > span')];
    if (!plot) throw new Error('no plot');
    // Labels every 20th column at 160px + 9px per column, each 70px wide; the plot shows 420px of 700.
    labels.forEach((label, index) => {
      Object.defineProperty(label, 'offsetLeft', { configurable: true, value: 160 + index * 9 });
      Object.defineProperty(label, 'scrollWidth', { configurable: true, value: index % 20 === 0 ? 70 : 0 });
    });
    setBox(plot, { scrollLeft: 0, clientWidth: 420, scrollWidth: 700 });
    fireEvent.scroll(plot);
    expect(container.querySelector('.heatmap-frame')).toHaveAttribute('data-more');
    expect(labels.filter((label) => label.textContent).map((label) => label.hasAttribute('data-cut'))).toEqual([false, false, true]);
    setBox(plot, { scrollLeft: 280, clientWidth: 420, scrollWidth: 700 });
    fireEvent.scroll(plot);
    expect(container.querySelector('.heatmap-frame')).not.toHaveAttribute('data-more');
    // The cells now start at 440px, past the 160px of pinned row labels.
    expect(labels.filter((label) => label.textContent).map((label) => label.hasAttribute('data-cut'))).toEqual([true, true, false]);
  });

  it('makes each row label a button where the page passes onRowSelect, and keeps rows that share a label apart', () => {
    const onRowSelect = vi.fn();
    const twins = [
      { id: 'one', label: 'Haemophilia A (chrX:154251084)', values: [0.5, 1] },
      { id: 'two', label: 'Haemophilia A (chrX:154251084)', values: [-0.5, 2] },
    ];
    render(<Heatmap {...props} rows={twins} onRowSelect={onRowSelect} />);
    const buttons = screen.getAllByRole('button', { name: 'Haemophilia A (chrX:154251084)' });
    expect(buttons).toHaveLength(2);
    fireEvent.click(buttons[1] as HTMLElement);
    expect(onRowSelect).toHaveBeenCalledWith(1);
    expect(screen.getAllByRole('gridcell')).toHaveLength(4);
  });
});
