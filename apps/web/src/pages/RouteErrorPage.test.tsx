import { render, screen } from '@testing-library/react';
import { createMemoryRouter, Outlet, RouterProvider } from 'react-router';
import { RouteErrorPage } from './RouteErrorPage';

function Broken(): never {
  throw new Error('The network response had no nodes.');
}

const layout = { element: <><p>Top bar</p><Outlet /></> };

function renderAt(child: Parameters<typeof createMemoryRouter>[0][number]) {
  const router = createMemoryRouter([{ ...layout, children: [{ errorElement: <RouteErrorPage />, children: [child] }] }], { initialEntries: ['/page'] });
  return render(<RouterProvider router={router} />);
}

describe('RouteErrorPage', () => {
  beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => undefined));
  afterEach(() => vi.restoreAllMocks());

  it('keeps the layout and offers a way back when a page throws', async () => {
    renderAt({ path: 'page', element: <Broken /> });
    expect(await screen.findByRole('alert')).toHaveTextContent('Something went wrong on this page');
    expect(screen.getByText('Top bar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Go to the homepage' })).toHaveAttribute('href', '/');
  });

  it('asks for a reload when the page code can no longer be fetched', async () => {
    renderAt({ path: 'page', lazy: () => Promise.reject(new TypeError('Failed to fetch dynamically imported module: /assets/NetworksPage-x.js')) });
    expect(await screen.findByRole('alert')).toHaveTextContent('This page needs a refresh');
    expect(screen.getByRole('button', { name: 'Reload the page' })).toBeInTheDocument();
  });
});
