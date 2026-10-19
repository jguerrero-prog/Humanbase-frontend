import { createBrowserRouter } from 'react-router';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ModulesPage } from './pages/ModulesPage';
import { NetworksPage } from './pages/NetworksPage';
import { NetwasJobPage } from './pages/netwas/NetwasJobPage';
import { NetwasPage } from './pages/netwas/NetwasPage';
import { NotFoundPage } from './pages/NotFoundPage';

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'networks', element: <NetworksPage /> },
      { path: 'modules', element: <ModulesPage /> },
      { path: 'netwas', element: <NetwasPage /> },
      { path: 'netwas/:id', element: <NetwasJobPage /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
