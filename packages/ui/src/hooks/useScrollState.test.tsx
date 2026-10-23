import { fireEvent, render, screen } from '@testing-library/react';
import { useRef } from 'react';
import { useMoreToScroll } from './useScrollState';

function setBox(element: HTMLElement, box: { scrollLeft?: number; clientWidth: number; scrollWidth: number }) {
  for (const [key, value] of Object.entries(box)) Object.defineProperty(element, key, { configurable: true, value });
}

function Scroller() {
  const ref = useRef<HTMLDivElement>(null);
  const more = useMoreToScroll(ref);
  return (
    <div ref={ref} data-testid="scroller" data-more={more || undefined}>
      <span>content</span>
    </div>
  );
}

describe('useMoreToScroll', () => {
  it('is true while content lies past the right edge, and false once scrolled to the end', () => {
    render(<Scroller />);
    const scroller = screen.getByTestId('scroller');
    expect(scroller).not.toHaveAttribute('data-more');
    setBox(scroller, { scrollLeft: 0, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(scroller);
    expect(scroller).toHaveAttribute('data-more');
    setBox(scroller, { scrollLeft: 600, clientWidth: 300, scrollWidth: 900 });
    fireEvent.scroll(scroller);
    expect(scroller).not.toHaveAttribute('data-more');
  });
});
