import { render } from '@testing-library/react';
import { Illustration } from './Illustration';
import { illustrationNames } from './illustrations';

describe('Illustration', () => {
  it('is decorative and keeps its artboard size', () => {
    const { container } = render(<Illustration name="neuron" />);
    const image = container.querySelector('img');
    expect(image).toHaveAttribute('alt', '');
    expect(image).toHaveAttribute('width', '240');
    expect(image).toHaveAttribute('height', '1200');
    expect(image).toHaveAttribute('loading', 'lazy');
  });

  it('has a file for each of the 42 Figma illustrations', () => {
    const { container } = render(illustrationNames.map((name) => <Illustration key={name} name={name} />));
    const sources = [...container.querySelectorAll('img')].map((image) => image.getAttribute('src'));
    expect(sources).toHaveLength(42);
    expect(sources.every((src) => src?.includes('svg'))).toBe(true);
  });
});
