import { categoryCrumbs, ExpressionEffects, expressionEffectsLink, expressionTabs, geneExpressionTools, type ExpressionTab, type GeneExpressionTool } from '@humanbase/hb';
import { Breadcrumbs, Tabs } from '@humanbase/ui';
import { useNavigate, useSearchParams } from 'react-router';
import '../ToolPage.css';

/** The ?model= value, ExPecto when missing or unknown. */
export function expressionModelOf(search: URLSearchParams): GeneExpressionTool {
  const model = search.get('model');
  return model && model in geneExpressionTools ? (model as GeneExpressionTool) : 'expecto';
}

/** Expression effects: ExPecto or ExPecto SC, by gene, by rsID or for submitted variants. */
export function ExpressionEffectsPage() {
  const navigate = useNavigate();
  const [search, setSearch] = useSearchParams();
  const model = expressionModelOf(search);
  const tab = expressionTabs.find((item) => item.value === search.get('tab')) ?? expressionTabs[0];
  const open = (next: { tab?: ExpressionTab; model?: GeneExpressionTool }) => void navigate(expressionEffectsLink({ tab: tab.value, model, ...next }));
  const query = search.get('q') ?? '';

  return (
    <section className="page-section tool-page">
      <title>{`${tab.value === 'gene' ? '' : `${tab.label} · `}Expression effects · Humanbase`}</title>
      <Breadcrumbs items={[categoryCrumbs.variants, { label: 'Expression effects' }]} />
      <header className="tool-page-title">
        <h1>Expression effects</h1>
        <p>Predict how variants change gene expression, across tissues with ExPecto or primary cell types with ExPecto SC.</p>
      </header>
      <Tabs label="Expression effects" tabs={expressionTabs} value={tab.value} onChange={(next) => open({ tab: next as ExpressionTab })}>
        <ExpressionEffects
          tab={tab.value}
          model={model}
          onModelChange={(next) => open({ model: next })}
          query={query}
          onQueryChange={(q) => {
            const params = new URLSearchParams(search);
            if (q) params.set('q', q);
            else params.delete('q');
            setSearch(params, { replace: true });
          }}
          onOpen={(link) => void navigate(link)}
        />
      </Tabs>
    </section>
  );
}
