import { render, screen } from '@testing-library/react';
import { createMemoryRouter, RouterProvider } from 'react-router';

describe('DocsPage under a base path', () => {
  beforeEach(() => {
    vi.stubEnv('BASE_URL', '/Humanbase-frontend/app/');
    vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    vi.resetModules();
  });
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.restoreAllMocks();
  });

  it('serves docs images from the app’s base, as on GitHub Pages', async () => {
    const [{ appBase }, { DocsPage }, { LinkBaseProvider }] = await Promise.all([import('../routes'), import('./DocsPage'), import('@humanbase/ui')]);
    const router = createMemoryRouter([{ path: 'docs/*', element: <DocsPage /> }], { initialEntries: ['/docs/expectosc/'] });
    render(
      <LinkBaseProvider value={appBase}>
        <RouterProvider router={router} />
      </LinkBaseProvider>,
    );
    const images = await screen.findAllByRole('img');
    const sources = images.map((image) => image.getAttribute('src')).filter((src) => src?.includes('/docs/img/'));
    expect(sources.length).toBeGreaterThan(0);
    expect(sources.every((src) => src?.startsWith('/Humanbase-frontend/app/docs/img/'))).toBe(true);
  }, 20_000);
});
