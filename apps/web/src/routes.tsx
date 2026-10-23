import type { ComponentType } from 'react';
import { asdBrowserRetired } from '@humanbase/hb';
import { createBrowserRouter, Navigate, useSearchParams, type RouteObject } from 'react-router';
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

/** Keeps an old link working: opens the new page with its meaning, plus any query the link carried. */
function Moved({ to, with: kept }: { to: string; with: Record<string, string> }) {
  const [search] = useSearchParams();
  const query = new URLSearchParams({ ...Object.fromEntries(search), ...kept });
  return <Navigate replace to={`${to}?${query.toString()}`} />;
}

const moved = (path: string, to: string, kept: Record<string, string>): RouteObject => ({ path, element: <Moved to={to} with={kept} /> });

const seqweaver = async () => {
  const { DeepseaPage } = await import('./pages/deepsea/DeepseaPage');
  return () => <DeepseaPage model="seqweaver" />;
};

const expecto = (tab: 'gene' | 'variants' | 'snps') => async () => {
  const { ExpectoPage } = await import('./pages/expecto/ExpectoPage');
  return () => <ExpectoPage tab={tab} />;
};

const geneExpression = (tool: 'expecto' | 'expecto-sc') => async () => {
  const { GeneExpressionPage } = await import('./pages/expecto/GeneExpressionPage');
  return () => <GeneExpressionPage tool={tool} />;
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
          page('variant-effects', async () => (await import('./pages/deepsea/VariantEffectsPage')).VariantEffectsPage),
          moved('sei', '/variant-effects/', { model: 'sei' }),
          moved('beluga', '/variant-effects/', { model: 'beluga' }),
          moved('ism', '/variant-effects/', { tab: 'region-scan' }),
          page('seqweaver', seqweaver),
          page('asd', async () => (asdBrowserRetired ? (await import('./pages/asd/AsdRetiredPage')).AsdRetiredPage : (await import('./pages/asd/AsdPage')).AsdPage)),
          page('deepsea/jobs/:id', async () => (await import('./pages/deepsea/DeepseaJobPage')).DeepseaJobPage),
          page('expecto', expecto('gene')),
          page('expecto/variants', expecto('variants')),
          page('expecto/snps', expecto('snps')),
          page('expecto/genes/:entrez', geneExpression('expecto')),
          page('expecto-sc', async () => (await import('./pages/expecto/ExpectoScPage')).ExpectoScPage),
          page('expecto-sc/genes/:entrez', geneExpression('expecto-sc')),
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
