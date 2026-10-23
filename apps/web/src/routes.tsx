import type { ComponentType } from 'react';
import { asdBrowserRetired } from '@humanbase/hb';
import { createBrowserRouter, type RouteObject } from 'react-router';
import { AppLayout } from './layout/AppLayout';
import { HomePage } from './pages/HomePage';
import { NotFoundPage } from './pages/NotFoundPage';
import { RouteErrorPage } from './pages/RouteErrorPage';

/** Where the app is served from without the trailing slash: empty locally, /Humanbase-frontend/app on GitHub Pages. */
export const appBase = import.meta.env.BASE_URL.replace(/\/$/, '');

/** A route whose page loads only when someone opens it, so the homepage carries no tool code. */
function page(path: string, load: () => Promise<ComponentType>): RouteObject {
  return { path, lazy: async () => ({ Component: await load() }) };
}

const deepsea = (model: 'sei' | 'beluga' | 'seqweaver' | 'insilico') => async () => {
  const { DeepseaPage } = await import('./pages/deepsea/DeepseaPage');
  return () => <DeepseaPage model={model} />;
};

const expectoMoved = (model: 'expecto' | 'expecto-sc', tab?: 'rsid' | 'submit-variants') => async () => {
  const { ExpectoRedirect } = await import('./pages/expecto/ExpectoRedirect');
  return () => <ExpectoRedirect model={model} tab={tab} />;
};

export const routes: RouteObject[] = [
  {
    element: <AppLayout />,
    // A crash in the layout itself has nothing around it to keep, so the error page stands alone.
    errorElement: <RouteErrorPage />,
    children: [
      {
        // A failing page keeps the top bar and footer.
        errorElement: <RouteErrorPage />,
        children: [
          { index: true, element: <HomePage /> },
          page('networks', async () => (await import('./pages/NetworksPage')).NetworksPage),
          page('modules', async () => (await import('./pages/ModulesPage')).ModulesPage),
          page('netwas', async () => (await import('./pages/netwas/NetwasPage')).NetwasPage),
          page('netwas/:id', async () => (await import('./pages/netwas/NetwasJobPage')).NetwasJobPage),
          page('sei', deepsea('sei')),
          page('beluga', deepsea('beluga')),
          page('seqweaver', deepsea('seqweaver')),
          page('ism', deepsea('insilico')),
          page('asd', async () => (asdBrowserRetired ? (await import('./pages/asd/AsdRetiredPage')).AsdRetiredPage : (await import('./pages/asd/AsdPage')).AsdPage)),
          page('deepsea/jobs/:id', async () => (await import('./pages/deepsea/DeepseaJobPage')).DeepseaJobPage),
          page('expression-effects', async () => (await import('./pages/expecto/ExpressionEffectsPage')).ExpressionEffectsPage),
          page('expression-effects/genes/:entrez', async () => (await import('./pages/expecto/GeneExpressionPage')).GeneExpressionPage),
          page('expecto', expectoMoved('expecto')),
          page('expecto/snps', expectoMoved('expecto', 'rsid')),
          page('expecto/variants', expectoMoved('expecto', 'submit-variants')),
          page('expecto/genes/:entrez', expectoMoved('expecto')),
          page('expecto-sc', expectoMoved('expecto-sc')),
          page('expecto-sc/genes/:entrez', expectoMoved('expecto-sc')),
          page('data-sources', async () => (await import('./pages/DataSourcesPage')).DataSourcesPage),
          page('about', async () => (await import('./pages/AboutPage')).AboutPage),
          page('cite', async () => (await import('./pages/CitePage')).CitePage),
          page('docs/*', async () => (await import('./pages/DocsPage')).DocsPage),
          page('jobs',async () => (await import('./pages/JobsPage')).JobsPage),
          { path: '*', element: <NotFoundPage /> },
        ],
      },
    ],
  },
];

export const router = createBrowserRouter(routes, { basename: appBase || '/' });
