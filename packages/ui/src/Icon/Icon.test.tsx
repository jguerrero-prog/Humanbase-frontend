import { render, screen } from '@testing-library/react';
import { Icon, iconNames } from './Icon';

const strokeOf = (container: HTMLElement) => Number(container.querySelector('svg')?.getAttribute('stroke-width'));

describe('Icon', () => {
  it('is hidden from screen readers unless it has a label', () => {
    const { container } = render(<Icon name="download" />);
    expect(container.querySelector('svg')).toHaveAttribute('aria-hidden', 'true');
    render(<Icon name="alert-circle" label="Error" />);
    expect(screen.getByRole('img', { name: 'Error' })).toBeInTheDocument();
  });

  it('draws interface icons at 1.5, 1.75 and 2px on screen', () => {
    expect(strokeOf(render(<Icon name="download" size={16} />).container) * (16 / 24)).toBeCloseTo(1.5);
    expect(strokeOf(render(<Icon name="download" size={20} />).container) * (20 / 24)).toBeCloseTo(1.75);
    expect(strokeOf(render(<Icon name="download" size={24} />).container)).toBe(2);
  });

  it('draws science icons lighter: 1.25, 1.25 and 1.5px', () => {
    expect(strokeOf(render(<Icon name="dna" size={16} />).container) * (16 / 24)).toBeCloseTo(1.25);
    expect(strokeOf(render(<Icon name="dna" size={20} />).container) * (20 / 24)).toBeCloseTo(1.25);
    expect(strokeOf(render(<Icon name="dna" size={24} />).container)).toBe(1.5);
  });

  // The 50 Figma icons plus star, for starred sets; Figma doesn't draw star yet.
  it('includes every icon from Figma, plus star', () => {
    expect(iconNames).toHaveLength(51);
  });
});
