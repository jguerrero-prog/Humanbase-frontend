import { ExtendedUniverse, ModuleView } from '@humanbase/data';
import { ModuleExplorer, type ModuleDraft } from '@humanbase/hb';
import { Navigate, useNavigate, useSearchParams } from 'react-router';

export interface ModulesLocationState {
  draft?: ModuleDraft;
}

export function ModulesPage() {
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const bodyTag = search.get('body_tag');
  const example = search.get('example');
  if (!bodyTag) return <Navigate replace to={`/?analysis=modules${example ? `&example=${encodeURIComponent(example)}` : ''}`} />;
  return (
    <section className="page-section">
      <title>Modules · Humanbase</title>
      <ModuleExplorer
        key={bodyTag}
        bodyTag={bodyTag}
        view={ModuleView.fromSearch(search)}
        onViewChange={(view) => setSearch(view.applyTo(search), { replace: true })}
        onEditGenes={(draft) => void navigate('/?analysis=modules', { state: { draft } satisfies ModulesLocationState })}
        onStarted={(link, replace) => void navigate(link, { replace })}
        extendedUniverse={ExtendedUniverse.requested(search)}
      />
    </section>
  );
}
