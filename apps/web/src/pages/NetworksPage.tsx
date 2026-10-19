import { NetworkQuery } from '@humanbase/data';
import { EmptyState } from '@humanbase/ui';
import { useSearchParams } from 'react-router';

// Placeholder until the Networks screens are built; it already reads its request from the URL.
export function NetworksPage() {
  const [search] = useSearchParams();
  const query = NetworkQuery.fromSearch(search);
  return (
    <section className="page-section">
      <title>Networks · Humanbase</title>
      <h1>Networks</h1>
      <EmptyState
        icon="gene-network"
        title={query.isEmpty ? 'No genes chosen yet' : `${query.entrez.length === 1 ? '1 gene' : `${query.entrez.length} genes`} in the ${query.tissue ?? 'global'} network, ${query.versionName}`}
        text="The network view is being built. Search a gene on the homepage to choose genes."
      />
    </section>
  );
}
