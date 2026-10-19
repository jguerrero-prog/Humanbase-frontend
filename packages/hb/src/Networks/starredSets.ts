import { useAnnotatedTerms, type Network, type NetworkGene } from '@humanbase/data';
import type { GraphHighlight } from '@humanbase/graph';
import { useMemo } from 'react';

const categoricalColors = 6;

/** Starred sets take the categorical data colors in the order they were starred. */
export const starColor = (index: number) => `--viz-cat-${(index % categoricalColors) + 1}`;

/** Each starred process or tissue as a graph highlight holding the shown genes annotated to it. */
export function useStarredHighlights(network: Network | undefined, shown: readonly NetworkGene[] | undefined, starred: readonly string[]): GraphHighlight[] {
  // The same gene list as the Process and Tissue panels, so the terms load once.
  const genes = useMemo(() => (starred.length ? network?.genes.map((gene) => gene.entrez) : undefined), [network, starred.length]);
  const processes = useAnnotatedTerms(genes, 'gene-ontology-bp');
  const tissues = useAnnotatedTerms(genes, 'brenda-ontology');
  return useMemo(() => {
    const shownIds = new Set(shown?.map((gene) => gene.entrez));
    const hits = new Map([...(processes.data?.byGeneCount(shownIds) ?? []), ...(tissues.data?.byGeneCount(shownIds) ?? [])].map((hit) => [hit.identifier, hit]));
    return starred.map((id, index) => {
      const hit = hits.get(id);
      return { id, label: hit?.title ?? id, color: starColor(index), nodes: hit?.genes.map(String) ?? [] };
    });
  }, [processes.data, tissues.data, shown, starred]);
}
