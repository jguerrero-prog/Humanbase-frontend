import { createBrowserRouter } from 'react-router';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { ModulesPage } from './pages/ModulesPage';
import { NetworksPage } from './pages/NetworksPage';
import { NetwasJobPage } from './pages/netwas/NetwasJobPage';
import { NetwasPage } from './pages/netwas/NetwasPage';
import { DeepseaPage } from './pages/deepsea/DeepseaPage';
import { DeepseaJobPage } from './pages/deepsea/DeepseaJobPage';
import { ExpectoPage } from './pages/expecto/ExpectoPage';
import { ExpectoScPage } from './pages/expecto/ExpectoScPage';
import { GeneExpressionPage } from './pages/expecto/GeneExpressionPage';
import { NotFoundPage } from './pages/NotFoundPage';

/** Where the app is served from without the trailing slash: empty locally, /Humanbase-frontend/app on GitHub Pages. */
export const appBase = import.meta.env.BASE_URL.replace(/\/$/, '');

export const router = createBrowserRouter([
  {
    element: <AppLayout />,
    children: [
      { index: true, element: <HomePage /> },
      { path: 'networks', element: <NetworksPage /> },
      { path: 'modules', element: <ModulesPage /> },
      { path: 'netwas', element: <NetwasPage /> },
      { path: 'netwas/:id', element: <NetwasJobPage /> },
      { path: 'sei', element: <DeepseaPage model="sei" /> },
      { path: 'beluga', element: <DeepseaPage model="beluga" /> },
      { path: 'seqweaver', element: <DeepseaPage model="seqweaver" /> },
      { path: 'deepsea/jobs/:id', element: <DeepseaJobPage /> },
      { path: 'expecto', element: <ExpectoPage tab="gene" /> },
      { path: 'expecto/variants', element: <ExpectoPage tab="variants" /> },
      { path: 'expecto/snps', element: <ExpectoPage tab="snps" /> },
      { path: 'expecto/genes/:entrez', element: <GeneExpressionPage tool="expecto" /> },
      { path: 'expecto-sc', element: <ExpectoScPage /> },
      { path: 'expecto-sc/genes/:entrez', element: <GeneExpressionPage tool="expecto-sc" /> },
      { path: '*', element: <NotFoundPage /> },
    ],
  },
], { basename: appBase || '/' });
