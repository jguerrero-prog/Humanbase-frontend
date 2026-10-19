import { NetworkQuery, NetworkView } from '@humanbase/data';
import { EmptyNetworkQuery, NetworkExplorer } from '@humanbase/hb';
import { useLocation, useNavigate, useSearchParams } from 'react-router';

export interface NetworksLocationState {
  fromSearch?: boolean;
}

export function NetworksPage() {
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const query = NetworkQuery.fromSearch(search);
  const view = NetworkView.fromSearch(search);
  const compareView = NetworkView.fromSearch(search, 'compare');
  const fromSearch = (location.state as NetworksLocationState | null)?.fromSearch ?? false;

  return (
    <section className="page-section">
      <title>{query.isEmpty ? 'Networks · Humanbase' : `Networks · ${query.entrez.length} ${query.entrez.length === 1 ? 'gene' : 'genes'} · Humanbase`}</title>
      {query.isEmpty ? (
        <>
          <h1>Networks</h1>
          <EmptyNetworkQuery />
        </>
      ) : (
        <NetworkExplorer
          query={query}
          view={view}
          compareView={compareView}
          fromSearch={fromSearch}
          onQueryChange={(next) => {
            const kept = view.with({ selection: undefined, ...(next.compare ? {} : { focus: 'main' as const }) }).applyTo(next.toSearch());
            void navigate(`/networks/?${next.compare ? compareView.with({ selection: undefined }).applyTo(kept, 'compare') : kept}`);
          }}
          onViewChange={(next, pane) => setSearch(next.applyTo(search, pane), { replace: true })}
        />
      )}
    </section>
  );
}
