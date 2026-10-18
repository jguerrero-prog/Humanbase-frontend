import { render, screen } from '@testing-library/react';
import { KeyLegend, ScaleLegend } from './Legend';

describe('Legend', () => {
  it('names a scale legend by its title and prints its end and middle values', () => {
    render(<ScaleLegend title="Score with IL1B" scale="sequential" ticks={['0', '0.5', '1']} />);
    const legend = screen.getByRole('group', { name: 'Score with IL1B' });
    expect(legend).toHaveTextContent('00.51');
  });

  it('lists each group with its color, hiding the swatch from screen readers', () => {
    render(
      <KeyLegend
        title="Module"
        items={[
          { label: 'Inflammation', color: '--viz-cat-1' },
          { label: 'Other', color: '--viz-cat-other' },
        ]}
      />,
    );
    const items = screen.getAllByRole('listitem');
    expect(items.map((item) => item.textContent)).toEqual(['Inflammation', 'Other']);
    expect(items[0]).toHaveStyle({ '--legend-color': 'var(--viz-cat-1)' });
    expect(items[0]?.querySelector('.legend-swatch')).toHaveAttribute('aria-hidden', 'true');
  });

  it('draws line marks at the given width for edge strength', () => {
    render(<KeyLegend title="Connection" mark="line" items={[{ label: '0.9 and up', color: '--viz-seq-7', width: '--viz-edge-strong' }]} />);
    expect(screen.getByRole('listitem')).toHaveStyle({ '--legend-width': 'var(--viz-edge-strong)' });
  });
});
