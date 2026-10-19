import { ApiError, Network, useDataTypes, useGenes, useIntegrations, useNetwork, type DataVersion, type NetworkGene, type NetworkQuery, type NetworkSelection, type NetworkView } from '@humanbase/data';
import type { GraphRendererFactory, GraphSelection } from '@humanbase/graph';
import { Alert, ResultHeader, ResultLayout } from '@humanbase/ui';
import { useMemo, useState, type ReactNode } from 'react';
import { DataTypesFilter } from './DataTypesFilter';
import { GraphLoading, GraphPanel } from './GraphPanel';
import { NetworkCompanion } from './NetworkCompanion';
import { NetworkDetail } from './NetworkDetail';
import { TissueSelect } from './TissueSelect';
import './Networks.css';

export interface NetworkDetailContext {
  network: Network;
  selection: NetworkSelection;
  /** The integration on screen, such as global or a tissue. */
  slug: string;
  version: DataVersion;
  networkTitle: string;
  /** Query gene symbols joined for reading, such as "IL1B and TNF". */
  queryNames: string;
  addGene: (gene: NetworkGene) => void;
  close: () => void;
}

export interface NetworkExplorerProps {
  query: NetworkQuery;
  view: NetworkView;
  /** A new request: other genes, tissue, version or data types. */
  onQueryChange: (query: NetworkQuery) => void;
  /** Filters and selection, which never need a new request. */
  onViewChange: (view: NetworkView) => void;
  /** True when the page was opened from a search, which shows the fuller "Retrieving the network" state. */
  fromSearch?: boolean;
  /** Draws the gene or connection detail for the current selection; defaults to the gene and connection drawers. */
  detail?: (context: NetworkDetailContext) => ReactNode;
  renderer?: GraphRendererFactory | undefined;
}

const listJoin = (items: readonly string[]) => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);


export function NetworkExplorer({ query, view, onQueryChange, onViewChange, fromSearch = false, detail = (context) => <NetworkDetail {...context} />, renderer }: NetworkExplorerProps) {
  const { data: network, error, isFetching, refetch } = useNetwork(query);
  const { data: integrations = [] } = useIntegrations();
  const { data: dataTypes = [] } = useDataTypes(query.version);
  const names = useGenes(query.entrez);
  const [missingDismissed, setMissingDismissed] = useState(false);

  const symbolOf = (id: number) => names.get(id)?.symbol ?? network?.queryGenes.find((gene) => gene.entrez === id)?.symbol ?? String(id);
  const symbols = query.entrez.map(symbolOf);
  const tissueTitle = query.tissue ? (integrations.find((n) => n.slug === query.tissue)?.title ?? query.tissue) : 'global';
  const networkName = `${listJoin(symbols)} in the ${tissueTitle} network, ${query.versionName} data`;
  const fileName = `${symbols.join('-')}_${query.slug}_${query.version}`;

  const minConfidence = view.minConfidence ?? network?.suggestedConfidence ?? Network.fallbackConfidence;
  const subset = useMemo(() => network?.subset(view.options(network.suggestedConfidence)), [network, view]);
  const related = useMemo(() => subset?.genes.filter((gene) => !gene.isQuery), [subset]);
  const missingIds = network ? network.missing(query.entrez) : [];
  const missing = missingIds.map(symbolOf);
  // Once the network answers, the title names only the genes it uses.
  const shownIds = query.entrez.filter((id) => !missingIds.includes(id));
  const found = shownIds.map(symbolOf);

  const select = (selection: NetworkSelection | undefined) => onViewChange(view.with({ selection }));
  const graphSelection: GraphSelection =
    view.selection?.kind === 'gene' ? { kind: 'node', id: String(view.selection.entrez) } : view.selection ? { kind: 'link', source: String(view.selection.source), target: String(view.selection.target) } : null;
  const addGene = (gene: NetworkGene) => onQueryChange(query.with({ entrez: [...query.entrez, gene.entrez] }));

  const single = shownIds.length === 1 ? names.get(shownIds[0] as number) : undefined;
  const header = (
    <ResultHeader
      crumbs={[{ label: 'Networks', href: '/' }, { label: found.join(', ') }]}
      title={single ? single.symbol : found.join(', ')}
      {...(single ? { subtitle: single.name } : {})}
      context={[
        { name: 'Data version', value: query.versionName },
        ...(related && network ? [{ name: 'Genes shown', value: `${related.length} of ${network.related().length}` }] : []),
      ]}
      settings={
        <>
          <TissueSelect networks={integrations} version={query.version} value={query.tissue} onChange={(tissue) => onQueryChange(query.with({ tissue }))} />
          {dataTypes.length > 0 && <DataTypesFilter types={dataTypes} value={query.dataTypes} onChange={(slugs) => onQueryChange(query.with({ dataTypes: slugs }))} />}
        </>
      }
    />
  );

  if (error && !network) {
    const notFound = error instanceof ApiError && error.isNotFound;
    return (
      <ResultLayout header={header} mainLabel="Network" main={
        <Alert tone="error" title={notFound ? `${listJoin(symbols)} ${symbols.length === 1 ? 'is' : 'are'} not in this network` : 'The network couldn’t load'} {...(notFound ? {} : { action: { label: 'Try again', onSelect: () => void refetch() } })}>
          {notFound ? `Try the global network or the other data version, or search for different genes.` : 'Check your connection, then try again. Your genes and settings are kept in the address.'}
        </Alert>
      } />
    );
  }

  const loading = fromSearch ? (
    <GraphLoading title="Retrieving the network" text={networkName} note="The gene list appears with the network. You can keep this tab open while it works." />
  ) : (
    <GraphLoading />
  );

  return (
    <>
      <ResultLayout
        header={
          <>
            {header}
            {missing.length > 0 && !missingDismissed && (
              <Alert tone="info" dismissible onDismiss={() => setMissingDismissed(true)}>
                {`${listJoin(missing)} ${missing.length === 1 ? 'was' : 'were'} left out because ${missing.length === 1 ? 'it isn’t' : 'they aren’t'} in any Humanbase network. This network uses ${listJoin(found)}.`}
              </Alert>
            )}
          </>
        }
        mainLabel={`${listJoin(symbols)} network`}
        expanded={view.expanded}
        main={
          <GraphPanel
            subset={subset}
            relatedTotal={network?.related().length ?? 0}
            view={view}
            minConfidence={minConfidence}
            label={`Network of ${listJoin(symbols)} and ${related?.length ?? 0} related genes. The genes table lists the same genes.`}
            tableCaption={`Connections between the genes in the ${tissueTitle} network graph, strongest first`}
            fileName={fileName}
            selection={graphSelection}
            loading={loading}
            onViewChange={onViewChange}
            onSelectGene={(entrez) => select({ kind: 'gene', entrez })}
            onSelectConnection={(source, target) => select({ kind: 'connection', source, target })}
            renderer={renderer}
          />
        }
        companionLabel="Genes, processes and tissues"
        companion={
          <NetworkCompanion
            network={network}
            shown={isFetching && !network ? undefined : subset?.genes}
            queryNames={listJoin(symbols)}
            networkTitle={tissueTitle}
            fileName={fileName}
            selected={view.selection?.kind === 'gene' ? view.selection.entrez : undefined}
            onSelectGene={(entrez) => select({ kind: 'gene', entrez })}
            onAddGene={addGene}
          />
        }
      />
      {network &&
        view.selection &&
        detail({ network, selection: view.selection, slug: query.slug, version: query.version, networkTitle: tissueTitle, queryNames: listJoin(found), addGene, close: () => select(undefined) })}
    </>
  );
}

export function EmptyNetworkQuery() {
  return (
    <Alert tone="info" title="No genes chosen yet" action={{ label: 'Search for genes', href: '/' }}>
      Search a gene or paste a list on the homepage, then choose Show network.
    </Alert>
  );
}
