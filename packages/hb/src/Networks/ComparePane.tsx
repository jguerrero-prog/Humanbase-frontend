import { ApiError, Network, useDataTypes, useNetwork, type Integration, type NetworkQuery, type NetworkSelection, type NetworkView } from '@humanbase/data';
import type { GraphRendererFactory, GraphSelection } from '@humanbase/graph';
import { Alert, Button } from '@humanbase/ui';
import { useMemo } from 'react';
import { DataTypesFilter } from './DataTypesFilter';
import { GraphLoading, GraphPanel } from './GraphPanel';
import { TissueSelect } from './TissueSelect';

export interface ComparePaneProps {
  query: NetworkQuery;
  view: NetworkView;
  /** The network's name, such as "Global" or "Mononuclear phagocyte". */
  title: string;
  integrations: readonly Integration[];
  queryNames: string;
  fileName: string;
  selection: GraphSelection;
  onQueryChange: (query: NetworkQuery) => void;
  onViewChange: (view: NetworkView) => void;
  onSelect: (selection: NetworkSelection) => void;
  onRemove: () => void;
  renderer?: GraphRendererFactory | undefined;
}

export function ComparePane({ query, view, title, integrations, queryNames, fileName, selection, onQueryChange, onViewChange, onSelect, onRemove, renderer }: ComparePaneProps) {
  const result = useNetwork(query);
  const network = result.data;
  const { data: dataTypes = [] } = useDataTypes(query.version);
  const minConfidence = view.minConfidence ?? network?.suggestedConfidence ?? Network.fallbackConfidence;
  const subset = useMemo(() => network?.subset(view.options(network.suggestedConfidence)), [network, view]);
  const notFound = result.error instanceof ApiError && result.error.isNotFound;

  return (
    <section className="compare-pane" aria-label={`${title} network`}>
      <div className="compare-pane-head">
        <TissueSelect networks={integrations} version={query.version} value={query.tissue} onChange={(tissue) => onQueryChange(query.with({ tissue }))} />
        {dataTypes.length > 0 && <DataTypesFilter types={dataTypes} value={query.dataTypes} onChange={(slugs) => onQueryChange(query.with({ dataTypes: slugs }))} />}
        <Button variant="ghost" size="small" icon="x" aria-label={`Remove the ${title} network`} onClick={onRemove}>
          Remove
        </Button>
      </div>
      {result.error && !network ? (
        <Alert
          tone="error"
          title={notFound ? `${queryNames} ${query.entrez.length > 1 ? 'are' : 'is'} not in the ${title} network` : `The ${title} network couldn’t load`}
          {...(notFound ? {} : { action: { label: 'Try again', onSelect: () => void result.refetch() } })}
        >
          {notFound ? 'Choose another tissue, or remove this network.' : 'Check your connection, then try again. Your genes and settings are kept in the address.'}
        </Alert>
      ) : (
        <GraphPanel
          network={network}
          subset={subset}
          view={view}
          minConfidence={minConfidence}
          label={`Network of ${queryNames} and ${subset ? subset.genes.filter((gene) => !gene.isQuery).length : 0} related genes in the ${title} network. The genes table lists the same genes.`}
          tableCaption={`Connections between the genes in the ${title} network graph, strongest first`}
          fileName={fileName}
          selection={selection}
          loading={<GraphLoading />}
          canExpand={false}
          onViewChange={onViewChange}
          onSelectGene={(entrez) => onSelect({ kind: 'gene', entrez })}
          onSelectConnection={(source, target) => onSelect({ kind: 'connection', source, target })}
          renderer={renderer}
        />
      )}
    </section>
  );
}
