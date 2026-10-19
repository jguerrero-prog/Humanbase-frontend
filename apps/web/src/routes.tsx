import { createBrowserRouter } from 'react-router';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { NetworksPage } from './pages/NetworksPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'networks', element: <NetworksPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
