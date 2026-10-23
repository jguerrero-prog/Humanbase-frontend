import { render, screen, within } from '@testing-library/react';
import { Heatmap } from './Heatmap';
import type { ScaleSpec } from './ScoreScale';

const spec: ScaleSpec = { title: 'Log fold change', kind: 'diverging', edges: [-1, -0.3, -0.1, 0.1, 0.3, 1], words: ['Decreases', 'Increases'] };

const props = {
  title: 'Predicted effect on IRGM expression',
  summary: 'Effects are small except in the nervous system.',
  scale: spec,
  columns: [
    { label: 'a', position: 150226123, href: 'https://genome.ucsc.edu/a' },
    { label: 'b', position: 150226178 },
  ],
  rows: [
    { label: 'nervous system', values: [-1.42, 0.05] },
    { label: 'integument', values: [null, 0.2] },
  ],
  rowHeader: 'Tissue system',
  columnHeader: 'Position',
};

describe('Heatmap as a table', () => {
  it('lists each value under its row and column headers, the same as the heatmap', () => {
    render(<Heatmap {...props} />);
    const table = screen.getByRole('table', { name: props.summary });
    expect(within(table).getAllByRole('columnheader').map((header) => header.textContent)).toEqual(['Tissue system', '150,226,123', '150,226,178']);
    expect(within(table).getByRole('rowheader', { name: 'integument' })).toBeInTheDocument();
    expect(within(table).getAllByRole('cell').map((cell) => cell.textContent)).toEqual(['−1.42*, past the end of the legend (−1)', '0.05', 'Not available', '0.2']);
  });

  it('links a position header to the genome browser and explains the asterisk', () => {
    render(<Heatmap {...props} />);
    expect(screen.getByRole('link', { name: /^150,226,123 ?opens in a new tab$/ })).toHaveAttribute('href', 'https://genome.ucsc.edu/a');
    expect(screen.getByText(/^\* Past the end of the legend/)).toBeInTheDocument();
  });

  it('leaves out the note when every value is inside the legend', () => {
    render(<Heatmap {...props} rows={[{ label: 'integument', values: [null, 0.2] }]} />);
    expect(screen.queryByText(/^\* Past the end of the legend/)).not.toBeInTheDocument();
  });
});
