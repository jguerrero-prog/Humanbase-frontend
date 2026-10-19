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
          fromSearch={fromSearch}
          onQueryChange={(next) => void navigate(`/networks/?${view.with({ selection: undefined }).applyTo(next.toSearch())}`)}
          onViewChange={(next) => setSearch(next.applyTo(search), { replace: true })}
        />
      )}
    </section>
  );
}
