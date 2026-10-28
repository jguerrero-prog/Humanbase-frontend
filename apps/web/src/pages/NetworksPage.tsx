import { ExtendedUniverse, NetworkQuery, NetworkView } from '@humanbase/data';
import { HomeSearch, NetworkExplorer } from '@humanbase/hb';
import { useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router';
import { useReadableSearchParams } from '../useReadableSearchParams';
import './NetworksPage.css';

export interface NetworksLocationState {
  fromSearch?: boolean;
  extendedUniverseIgnored?: boolean;
}

export function NetworksPage() {
  const [search, setSearch] = useReadableSearchParams();
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
    setSearch(
      (current) => {
        current.delete(ExtendedUniverse.param);
        return current;
      },
      { replace: true, state: { ...state, extendedUniverseIgnored: true } satisfies NetworksLocationState },
    );
  }, [ignoresFlag, state, setSearch]);

  return (
    <section className="page-section">
      <title>{query.isEmpty ? 'Networks · Humanbase' : `Networks · ${query.entrez.length} ${query.entrez.length === 1 ? 'gene' : 'genes'} · Humanbase`}</title>
      {query.isEmpty ? (
        <div className="networks-empty">
          <h1>Networks</h1>
          <p className="networks-empty-lead">Search a gene, or paste a list, then choose Show network to see how they work together in a tissue.</p>
          <HomeSearch surface="light" onShowNetwork={(next) => void navigate(next.href, { state: { fromSearch: true } satisfies NetworksLocationState })} />
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
            setSearch(next.compare ? compareView.with({ selection: undefined }).applyTo(kept, 'compare') : kept);
          }}
          onViewChange={(next, pane) => setSearch(next.applyTo(search, pane), { replace: true })}
        />
      )}
    </section>
  );
}
