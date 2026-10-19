import {
  ApiError,
  Network,
  useDataTypes,
  useGenes,
  useGenesFunctions,
  useIntegrations,
  useNetwork,
  type DataVersion,
  type NetworkGene,
  type NetworkQuery,
  type NetworkSelection,
  type NetworkTab,
  type NetworkView,
} from '@humanbase/data';
import type { GraphRendererFactory, GraphSelection } from '@humanbase/graph';
import { Alert, Button, EmptyState, ResultHeader, ResultLayout, saveFile } from '@humanbase/ui';
import { useMemo, useState, type ReactNode } from 'react';
import { DataTypesFilter } from './DataTypesFilter';
import { EditGenesDialog } from './EditGenesDialog';
import { GraphLoading, GraphPanel } from './GraphPanel';
import { NetworkCompanion } from './NetworkCompanion';
import { NetworkDetail } from './NetworkDetail';
import { ProcessSelect } from './ProcessSelect';
import { TissueSelect } from './TissueSelect';
import { GeneAssociations } from './tabs/GeneAssociations';
import { expressionRows, expressionTsv } from './tabs/expressionRows';
import { TissueExpression } from './tabs/TissueExpression';
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
  /** A new request: other genes, tissue, process, version or data types. */
  onQueryChange: (query: NetworkQuery) => void;
  /** Tab, filters and selection, which never need a new request. */
  onViewChange: (view: NetworkView) => void;
  /** True when the page was opened from a search, which shows the fuller "Retrieving the network" state. */
  fromSearch?: boolean;
  /** Draws the gene or connection detail for the current selection; defaults to the gene and connection drawers. */
  detail?: (context: NetworkDetailContext) => ReactNode;
  renderer?: GraphRendererFactory | undefined;
}

const listJoin = (items: readonly string[]) => (items.length < 2 ? (items[0] ?? '') : `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`);

const tabs: { value: NetworkTab; label: string }[] = [
  { value: 'network', label: 'Tissue network' },
  { value: 'expression', label: 'Tissue expression' },
  { value: 'process', label: 'Process network' },
  { value: 'processes', label: 'Biological processes' },
  { value: 'diseases', label: 'Diseases' },
];

export function NetworkExplorer({ query, view, onQueryChange, onViewChange, fromSearch = false, detail = (context) => <NetworkDetail {...context} />, renderer }: NetworkExplorerProps) {
  // The tissue network names the genes and finds those in no network; the process tab draws its own network.
  const base = useNetwork(query);
  const onProcessTab = view.tab === 'process';
  const processQuery = query.processNetwork;
  const activeQuery = onProcessTab && processQuery ? processQuery : query;
  const active = useNetwork(activeQuery);
  const network = active.data;
  const { data: integrations = [] } = useIntegrations();
  const { data: dataTypes = [] } = useDataTypes(activeQuery.version);
  const names = useGenes(query.entrez);
  const [missingDismissed, setMissingDismissed] = useState(false);
  const [processMenuOpen, setProcessMenuOpen] = useState(false);
  const [editingGenes, setEditingGenes] = useState(false);

  const symbolOf = (id: number) => names.get(id)?.symbol ?? base.data?.queryGenes.find((gene) => gene.entrez === id)?.symbol ?? String(id);
  const symbols = query.entrez.map(symbolOf);
  const titleOf = (slug: string | undefined) => (slug ? (integrations.find((n) => n.slug === slug)?.title ?? slug) : 'global');
  const networkTitle = onProcessTab && processQuery ? titleOf(query.process) : titleOf(query.tissue);
  const networkName = `${listJoin(symbols)} in the ${networkTitle} network, ${activeQuery.versionName} data`;
  const fileName = `${symbols.join('-')}_${activeQuery.slug}_${activeQuery.version}`;

  const minConfidence = view.minConfidence ?? network?.suggestedConfidence ?? Network.fallbackConfidence;
  const subset = useMemo(() => network?.subset(view.options(network.suggestedConfidence)), [network, view]);
  const related = useMemo(() => subset?.genes.filter((gene) => !gene.isQuery), [subset]);
  const missingIds = base.data ? base.data.missing(query.entrez) : [];
  const missing = missingIds.map(symbolOf);
  // Once the network answers, the title names only the genes it uses.
  const shownIds = query.entrez.filter((id) => !missingIds.includes(id));
  const found = shownIds.map(symbolOf);
  const queryGenes = shownIds.map((entrez) => ({ entrez, symbol: symbolOf(entrez) }));

  // Each query gene's annotations load with the page, as on the live site, so switching tabs makes no new request.
  const functionIds = base.data ? shownIds : [];
  const expression = useGenesFunctions(functionIds, 'brenda-ontology');
  const processes = useGenesFunctions(functionIds, 'gene-ontology-bp');
  const diseases = useGenesFunctions(functionIds, 'disease-ontology');
  const tissues = useMemo(() => (expression.data ? expressionRows(expression.data) : undefined), [expression.data]);

  const select = (selection: NetworkSelection | undefined) => onViewChange(view.with({ selection }));
  const graphSelection: GraphSelection =
    view.selection?.kind === 'gene' ? { kind: 'node', id: String(view.selection.entrez) } : view.selection ? { kind: 'link', source: String(view.selection.source), target: String(view.selection.target) } : null;
  const addGene = (gene: NetworkGene) => onQueryChange(query.with({ entrez: [...query.entrez, gene.entrez] }));
  const showsNetwork = view.tab === 'network' || (onProcessTab && processQuery !== undefined);

  const dataTypesFilter = dataTypes.length > 0 && <DataTypesFilter types={dataTypes} value={query.dataTypes} onChange={(slugs) => onQueryChange(query.with({ dataTypes: slugs }))} />;
  const settings: Partial<Record<NetworkTab, ReactNode>> = {
    network: (
      <>
        <TissueSelect networks={integrations} version={query.version} value={query.tissue} onChange={(tissue) => onQueryChange(query.with({ tissue }))} />
        {dataTypesFilter}
      </>
    ),
    process: (
      <>
        <ProcessSelect networks={integrations} value={query.process} onChange={(process) => onQueryChange(query.with({ process }))} open={processMenuOpen} onOpenChange={setProcessMenuOpen} />
        {dataTypesFilter}
      </>
    ),
  };
  const downloadPredictions = (
    <Button variant="secondary" size="small" icon="download" disabled={!tissues} onClick={() => tissues && saveFile(expressionTsv(queryGenes, tissues), `${symbols.join('-')}_tissue_expression.tsv`, 'text/tab-separated-values')}>
      Download predictions
    </Button>
  );

  const editGenes = (
    <Button variant="ghost" size="small" icon="plus" onClick={() => setEditingGenes(true)}>
      Edit genes
    </Button>
  );
  const editGenesDialog = (
    <EditGenesDialog
      open={editingGenes}
      symbols={symbols}
      onClose={() => setEditingGenes(false)}
      onApply={(entrez) => {
        setEditingGenes(false);
        onQueryChange(query.with({ entrez }));
      }}
    />
  );

  const single = shownIds.length === 1 ? names.get(shownIds[0] as number) : undefined;
  const header = (
    <>
      <ResultHeader
        crumbs={[{ label: 'Networks', href: '/' }, { label: found.join(', ') }]}
        title={single ? single.symbol : found.join(', ')}
        {...(single ? { subtitle: single.name } : {})}
        context={
          showsNetwork || onProcessTab
            ? [
                { name: 'Data version', value: activeQuery.versionName },
                ...(showsNetwork && related && network ? [{ name: 'Genes shown', value: `${related.length} of ${network.related().length}` }] : []),
              ]
            : []
        }
        settings={settings[view.tab]}
        actions={
          <>
            {editGenes}
            {view.tab === 'expression' && downloadPredictions}
          </>
        }
        tabs={tabs}
        tabsLabel={`Views of ${listJoin(found)}`}
        tab={view.tab}
        onTabChange={(tab) => onViewChange(view.with({ tab: tab as NetworkTab, selection: undefined }))}
      />
      {missing.length > 0 && !missingDismissed && (
        <Alert tone="info" dismissible onDismiss={() => setMissingDismissed(true)}>
          {`${listJoin(missing)} ${missing.length === 1 ? 'was' : 'were'} left out because ${missing.length === 1 ? 'it isn’t' : 'they aren’t'} in any Humanbase network. This network uses ${listJoin(found)}.`}
        </Alert>
      )}
      {editGenesDialog}
      {onProcessTab && query.version === 'v3' && (
        <Alert tone="info">Process networks are built from GIANT data, so this tab uses GIANT even though the page is set to MAGE.</Alert>
      )}
    </>
  );

  if (view.tab === 'expression') {
    return (
      <ResultLayout
        header={header}
        mainLabel="Tissue expression"
        main={<TissueExpression genes={queryGenes} rows={tissues} failed={expression.isError} onRetry={expression.retry} queryNames={listJoin(found)} />}
      />
    );
  }

  if (view.tab === 'processes' || view.tab === 'diseases') {
    const results = view.tab === 'processes' ? processes : diseases;
    return (
      <ResultLayout
        header={header}
        mainLabel={view.tab === 'processes' ? 'Biological processes' : 'Diseases'}
        main={
          <GeneAssociations
            key={view.tab}
            kind={view.tab}
            genes={queryGenes}
            perGene={results.data}
            failed={results.isError}
            onRetry={results.retry}
            queryNames={listJoin(found)}
            fileName={symbols.join('-')}
          />
        }
      />
    );
  }

  if (onProcessTab && !processQuery) {
    return (
      <ResultLayout
        header={header}
        mainLabel="Process network"
        main={
          <EmptyState
            title="Choose a biological process to see its network"
            text={`A process network shows how ${listJoin(found)} connect to other genes within one biological process. Choose a process above to build it.`}
            actions={
              <Button variant="ghost" onClick={() => setProcessMenuOpen(true)}>
                Choose a process
              </Button>
            }
          />
        }
      />
    );
  }

  if (active.error && !network) {
    const notFound = active.error instanceof ApiError && active.error.isNotFound;
    return (
      <ResultLayout
        header={header}
        mainLabel="Network"
        main={
          <Alert
            tone="error"
            title={notFound ? `${listJoin(symbols)} ${symbols.length === 1 ? 'is' : 'are'} not in this network` : 'The network couldn’t load'}
            {...(notFound ? {} : { action: { label: 'Try again', onSelect: () => void active.refetch() } })}
          >
            {notFound ? `Try the global network or the other data version, or search for different genes.` : 'Check your connection, then try again. Your genes and settings are kept in the address.'}
          </Alert>
        }
      />
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
        header={header}
        mainLabel={`${listJoin(symbols)} network`}
        expanded={view.expanded}
        main={
          <GraphPanel
            subset={subset}
            relatedTotal={network?.related().length ?? 0}
            view={view}
            minConfidence={minConfidence}
            label={`Network of ${listJoin(symbols)} and ${related?.length ?? 0} related genes. The genes table lists the same genes.`}
            tableCaption={`Connections between the genes in the ${networkTitle} network graph, strongest first`}
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
            shown={active.isFetching && !network ? undefined : subset?.genes}
            queryNames={listJoin(symbols)}
            networkTitle={networkTitle}
            fileName={fileName}
            selected={view.selection?.kind === 'gene' ? view.selection.entrez : undefined}
            onSelectGene={(entrez) => select({ kind: 'gene', entrez })}
            onAddGene={addGene}
          />
        }
      />
      {network &&
        view.selection &&
        detail({ network, selection: view.selection, slug: activeQuery.slug, version: activeQuery.version, networkTitle, queryNames: listJoin(found), addGene, close: () => select(undefined) })}
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
