import { ModuleExplorer } from '@humanbase/hb';
import { Navigate, useSearchParams } from 'react-router';

export function ModulesPage() {
  const [search] = useSearchParams();
  const bodyTag = search.get('body_tag');
  const example = search.get('example');
  if (!bodyTag) return <Navigate replace to={`/?analysis=modules${example ? `&example=${encodeURIComponent(example)}` : ''}`} />;
  return (
    <section className="page-section">
      <title>Modules · Humanbase</title>
      <ModuleExplorer bodyTag={bodyTag} />
    </section>
  );
}
