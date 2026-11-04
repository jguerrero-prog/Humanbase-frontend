import { render } from '@testing-library/react';
import { ThemedArt } from './ThemedArt';

describe('ThemedArt', () => {
  it('draws each path with its paint classes, hidden from assistive technology', () => {
    const { container } = render(<ThemedArt className="example-art" width={100} height={50} paths={[['f100-0 s400-2', 'M0 0L10 10Z', 1], ['s300-3', 'M0 5L20 5']]} />);
    const svg = container.querySelector('svg');
    expect(svg).toHaveClass('themed-art', 'example-art');
    expect(svg).toHaveAttribute('aria-hidden', 'true');
    expect(svg).toHaveAttribute('viewBox', '0 0 100 50');
    const paths = container.querySelectorAll('path');
    expect(paths[0]).toHaveClass('f100-0', 's400-2');
    expect(paths[0]).toHaveAttribute('stroke-width', '1');
    expect(paths[1]).toHaveClass('s300-3');
  });

  it('draws an outlined stroke as a wider stroke with the inner stroke on top', () => {
    const { container } = render(<ThemedArt width={100} height={50} outline={2} paths={[['s400-0', 'M0 0L50 50', 5.6, 's100-0']]} />);
    const [outer, inner] = container.querySelectorAll('path');
    expect(outer).toHaveClass('s400-0');
    expect(outer).toHaveAttribute('stroke-width', '7.6');
    expect(inner).toHaveClass('s100-0');
    expect(inner).toHaveAttribute('stroke-width', '5.6');
  });
});
