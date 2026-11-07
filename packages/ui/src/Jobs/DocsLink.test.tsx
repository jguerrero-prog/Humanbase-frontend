import { fireEvent, render, screen } from '@testing-library/react';
import { DocsViewerProvider } from '../Docs/DocsViewer';
import { DocsLink } from './DocsLink';

describe('DocsLink', () => {
  it('opens Humanbase docs in the drawer the page provides, keeping the address for new tabs', () => {
    const openDocs = vi.fn();
    render(
      <DocsViewerProvider value={openDocs}>
        <DocsLink href="/docs/sei/#output">Score documentation</DocsLink>
      </DocsViewerProvider>,
    );
    const link = screen.getByRole('link', { name: 'Score documentation' });
    expect(link).toHaveAttribute('href', '/docs/sei/#output');
    expect(link).toHaveAttribute('aria-haspopup', 'dialog');
    expect(fireEvent.click(link)).toBe(false);
    expect(openDocs).toHaveBeenCalledWith('/docs/sei/#output');
  });

  it('lets a modified click open a new tab as usual', () => {
    const openDocs = vi.fn();
    render(
      <DocsViewerProvider value={openDocs}>
        <DocsLink href="/docs/sei/">Read the Sei documentation</DocsLink>
      </DocsViewerProvider>,
    );
    fireEvent.click(screen.getByRole('link', { name: 'Read the Sei documentation' }), { metaKey: true });
    expect(openDocs).not.toHaveBeenCalled();
  });

  it('goes to the page without a drawer, and sends other sites to a new tab', () => {
    const openDocs = vi.fn();
    render(
      <>
        <DocsLink href="/docs/sei/">Read the Sei documentation</DocsLink>
        <DocsViewerProvider value={openDocs}>
          <DocsLink href="https://humanbase.readthedocs.io/">Read the NetWAS documentation</DocsLink>
        </DocsViewerProvider>
      </>,
    );
    expect(screen.getByRole('link', { name: 'Read the Sei documentation' })).not.toHaveAttribute('aria-haspopup');
    const external = screen.getByRole('link', { name: /Read the NetWAS documentation/ });
    expect(external).toHaveAttribute('target', '_blank');
    fireEvent.click(external);
    expect(openDocs).not.toHaveBeenCalled();
  });
});
