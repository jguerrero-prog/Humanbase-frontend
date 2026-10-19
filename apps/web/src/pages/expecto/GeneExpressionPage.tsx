import { GeneExpression, type GeneExpressionState, type GeneExpressionTool } from '@humanbase/hb';
import { useParams, useSearchParams } from 'react-router';
import { NotFoundPage } from '../NotFoundPage';
import '../ToolPage.css';

// The view's name in the URL, such as ?view=tissues.
const memberViews: Record<GeneExpressionTool, string> = { expecto: 'tissues', 'expecto-sc': 'cells' };

export function GeneExpressionPage({ tool }: { tool: GeneExpressionTool }) {
  const { entrez = '' } = useParams();
  const [search, setSearch] = useSearchParams();
  if (!/^\d+$/.test(entrez)) return <NotFoundPage />;
  const state: GeneExpressionState = {
    view: search.get('view') === memberViews[tool] ? 'members' : 'groups',
    group: search.get('group') ?? undefined,
    resource: search.get('resource') ?? undefined,
    find: search.get('find') ?? undefined,
  };
  const save = (next: GeneExpressionState) => {
    const params = new URLSearchParams();
    if (next.view === 'members') params.set('view', memberViews[tool]);
    for (const key of ['group', 'resource', 'find'] as const) if (next[key]) params.set(key, next[key]);
    setSearch(params, { replace: true });
  };
  return (
    <section className="page-section tool-page">
      <GeneExpression key={`${tool}-${entrez}`} tool={tool} entrez={Number(entrez)} state={state} onStateChange={save} />
    </section>
  );
}
