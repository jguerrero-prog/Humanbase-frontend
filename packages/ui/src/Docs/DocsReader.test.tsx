import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { DocsReader } from './DocsReader';

const markdown = '## Input {#input}\n\nSee [the output](#output) or [Beluga](/docs/beluga/#input).\n\n## Output {#output}\n\nScores.';

describe('DocsReader', () => {
  const scrolled: Element[] = [];
  beforeEach(() => {
    scrolled.length = 0;
    Element.prototype.scrollIntoView = function (this: Element) {
      scrolled.push(this);
    };
  });

  it('opens at the section asked for', async () => {
    render(<DocsReader markdown={markdown} section="output" onOpenDocs={() => {}} />);
    await waitFor(() => expect(scrolled.at(-1)).toBe(screen.getByRole('heading', { name: 'Output' })));
  });

  it('scrolls within the page for its own sections and hands other docs pages back', () => {
    const onOpenDocs = vi.fn();
    render(<DocsReader markdown={markdown} onOpenDocs={onOpenDocs} />);
    expect(fireEvent.click(screen.getByRole('link', { name: 'the output' }))).toBe(false);
    expect(scrolled.at(-1)).toBe(screen.getByRole('heading', { name: 'Output' }));
    expect(fireEvent.click(screen.getByRole('link', { name: 'Beluga' }))).toBe(false);
    expect(onOpenDocs).toHaveBeenCalledWith('/docs/beluga/#input');
  });
});
