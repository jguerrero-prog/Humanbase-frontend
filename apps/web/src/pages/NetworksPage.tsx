import { ExtendedUniverse, NetworkQuery, NetworkView } from '@humanbase/data';
import { EmptyNetworkQuery, NetworkExplorer } from '@humanbase/hb';
import { useEffect } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router';
import './NetworksPage.css';

export interface NetworksLocationState {
  fromSearch?: boolean;
  extendedUniverseIgnored?: boolean;
}

export function NetworksPage() {
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();
  const query = NetworkQuery.fromSearch(search);
  const view = NetworkView.fromSearch(search);
  const compareView = NetworkView.fromSearch(search, 'compare');
  const state = location.state as NetworksLocationState | null;
  // As on humanbase.io, a MAGE page drops extended_universe from its URL and says why until the next request.
  const ignoresFlag = query.extendedUniverseStatus === 'ignored';
  useEffect(() => {
    if (!ignoresFlag) return;
    const next = new URLSearchParams(search);
    next.delete(ExtendedUniverse.param);
    void navigate(`?${next}`, { replace: true, state: { ...state, extendedUniverseIgnored: true } satisfies NetworksLocationState });
  }, [ignoresFlag, search, state, navigate]);

  return (
    <section className="page-section">
      <title>{query.isEmpty ? 'Networks · Humanbase' : `Networks · ${query.entrez.length} ${query.entrez.length === 1 ? 'gene' : 'genes'} · Humanbase`}</title>
      {query.isEmpty ? (
        <div className="networks-empty">
          <h1>Networks</h1>
          <EmptyNetworkQuery />
        </div>
      ) : (
        <NetworkExplorer
          query={query}
          view={view}
          compareView={compareView}
          fromSearch={state?.fromSearch ?? false}
          extendedUniverseIgnored={state?.extendedUniverseIgnored ?? false}
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
