import { fireEvent, render, screen } from '@testing-library/react';
import { useState } from 'react';
import { SubstitutionMap } from './SubstitutionMap';
import type { ScaleSpec } from './ScoreScale';

const scale: ScaleSpec = { title: 'Log2 fold change', kind: 'diverging', edges: [-0.5, -0.25, -0.1, 0.1, 0.25, 0.5], words: ['Mutation lowers', 'Mutation raises'] };
const column = (position: number) => ({ position, reference: 'T', values: { A: -4.63, C: -4, G: -4.24 } });

function Example() {
  const [start, setStart] = useState(10);
  const [selected, setSelected] = useState(11);
  return (
    <SubstitutionMap
      length={100}
      start={start}
      windowSize={5}
      onStart={setStart}
      columns={[0, 1, 2, 3, 4].map((offset) => column(start + offset))}
      overview={[1, 2, 3, 4, 5, 6, 7, 8, 9, 10]}
      selected={selected}
      onSelect={setSelected}
      scale={scale}
      genome={{ chromosome: 'chr1', start: 0 }}
      note="Log2 fold change for HepG2 / CEBPB."
    />
  );
}

describe('SubstitutionMap', () => {
  it('labels each cell, marks the reference and explains the selected position', () => {
    render(<Example />);
    expect(screen.getByRole('gridcell', { name: 'Position 10, T to A: −4.63' })).toBeInTheDocument();
    expect(screen.getAllByRole('gridcell', { name: /the reference base/ })).toHaveLength(5);
    const detail = screen.getByRole('region', { name: 'Position 11' });
    expect(detail).toHaveTextContent('chr1:11 · reference T');
    expect(detail).toHaveTextContent('A−4.63C−4.00G−4.24TReference');
  });

  it('moves the window with the arrow keys and selects a position with Enter', () => {
    render(<Example />);
    const window = screen.getByRole('slider', { name: 'Window along the sequence' });
    fireEvent.keyDown(window, { key: 'ArrowRight' });
    expect(window).toHaveAttribute('aria-valuenow', '11');
    fireEvent.keyDown(window, { key: 'End' });
    expect(window).toHaveAttribute('aria-valuenow', '95');
    const cell = screen.getByRole('gridcell', { name: 'Position 97, T to C: −4.00' });
    fireEvent.keyDown(cell, { key: 'Enter' });
    expect(screen.getByRole('region', { name: 'Position 97' })).toBeInTheDocument();
  });
});
