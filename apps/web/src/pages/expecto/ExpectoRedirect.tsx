import { expressionEffectsLink, expressionGeneLink, type ExpressionTab, type GeneExpressionTool } from '@humanbase/hb';
import { Navigate, useParams, useSearchParams } from 'react-router';

/** The old ExPecto and ExPecto SC pages, sent to the same tab, model and gene on Expression effects. */
export function ExpectoRedirect({ tab, model }: { tab?: ExpressionTab | undefined; model: GeneExpressionTool }) {
  const { entrez } = useParams();
  const [search] = useSearchParams();
  const target = new URL(entrez ? expressionGeneLink(entrez, model) : expressionEffectsLink({ tab, model }), 'https://humanbase.invalid');
  for (const [key, value] of search) target.searchParams.set(key, value);
  return <Navigate replace to={`${target.pathname}${target.search}`} />;
}
