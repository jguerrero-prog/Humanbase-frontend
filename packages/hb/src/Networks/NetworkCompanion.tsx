import { useAnnotatedTerms, type Network, type NetworkGene } from '@humanbase/data';
import { Tabs } from '@humanbase/ui';
import { useMemo, useState } from 'react';
import { RelatedGenesPanel } from './RelatedGenesPanel';
import { TermsPanel } from './TermsPanel';

export interface NetworkCompanionProps {
  network: Network | undefined;
  /** The genes in the graph, query genes included; undefined while the network loads. */
  shown: readonly NetworkGene[] | undefined;
  queryNames: string;
  networkTitle: string;
  fileName: string;
  selected: number | undefined;
  onSelectGene: (entrez: number) => void;
  onAddGene: (gene: NetworkGene) => void;
  starred: readonly string[];
  onToggleStar: (identifier: string) => void;
  /** Ranks terms with cross-organism annotation counts, for extended_universe on GIANT. */
  extendedUniverse?: boolean;
  /** The genes follow "Prioritize by uniqueness" instead of their score. */
  rankedByUniqueness?: boolean;
}

type Panel = 'genes' | 'processes' | 'tissues';

export function NetworkCompanion({ network, shown, queryNames, networkTitle, fileName, selected, onSelectGene, onAddGene, starred, onToggleStar, extendedUniverse = false, rankedByUniqueness = false }: NetworkCompanionProps) {
  const [panel, setPanel] = useState<Panel>('genes');
  // Terms load once for every gene in the response, then rank against whichever genes the graph shows.
  const allGenes = useMemo(() => network?.genes.map((gene) => gene.entrez), [network]);
  const processes = useAnnotatedTerms(allGenes, 'gene-ontology-bp', extendedUniverse);
  const tissues = useAnnotatedTerms(allGenes, 'brenda-ontology', extendedUniverse);
  const shownIds = useMemo(() => new Set(shown?.map((gene) => gene.entrez)), [shown]);
  const processHits = useMemo(() => (shown ? processes.data?.enriched(shownIds) : undefined), [processes.data, shown, shownIds]);
  const tissueHits = useMemo(() => (shown ? tissues.data?.byGeneCount(shownIds) : undefined), [tissues.data, shown, shownIds]);
  const related = useMemo(() => shown?.filter((gene) => !gene.isQuery), [shown]);

  return (
    <Tabs
      label="Genes, processes and tissues"
      tabs={[
        { value: 'genes', label: 'Genes', ...(related ? { count: related.length } : {}) },
        { value: 'processes', label: 'Processes', ...(processHits ? { count: processHits.length } : {}) },
        { value: 'tissues', label: 'Tissues', ...(tissueHits ? { count: tissueHits.length } : {}) },
      ]}
      value={panel}
      onChange={(value) => setPanel(value as Panel)}
    >
      {panel === 'genes' ? (
        <RelatedGenesPanel
          genes={related}
          caption={`Genes functionally related to ${queryNames} in the ${networkTitle} network`}
          fileName={`${fileName}_genes`}
          selected={selected}
          onSelectGene={onSelectGene}
          onAddGene={onAddGene}
          rankedByUniqueness={rankedByUniqueness}
        />
      ) : (
        <TermsPanel
          kind={panel}
          hits={panel === 'processes' ? processHits : tissueHits}
          failed={(panel === 'processes' ? processes : tissues).isError}
          onRetry={() => void (panel === 'processes' ? processes : tissues).refetch()}
          caption={panel === 'processes' ? `Biological processes over-represented among the genes in the ${networkTitle} network graph` : `Tissues and cell types of the genes in the ${networkTitle} network graph`}
          fileName={fileName}
          starred={starred}
          onToggleStar={onToggleStar}
        />
      )}
    </Tabs>
  );
}
