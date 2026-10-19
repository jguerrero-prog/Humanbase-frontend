import { ConnectionDrawer } from './ConnectionDrawer';
import { GeneDrawer } from './GeneDrawer';
import type { NetworkDetailContext } from './NetworkExplorer';

/** The gene or connection drawer for whatever is selected in the graph or tables. */
export function NetworkDetail({ network, selection, slug, version, networkTitle, queryNames, addGene, close }: NetworkDetailContext) {
  const byId = (entrez: number) => network.genes.find((gene) => gene.entrez === entrez);

  if (selection.kind === 'gene') {
    const gene = byId(selection.entrez);
    if (!gene) return null;
    return <GeneDrawer key={gene.entrez} gene={gene} queryNames={queryNames} networkTitle={networkTitle} onAdd={gene.isQuery ? undefined : () => addGene(gene)} onClose={close} />;
  }

  const source = byId(selection.source);
  const target = byId(selection.target);
  const edge = network.edgeBetween(selection.source, selection.target);
  if (!source || !target || !edge) return null;
  return <ConnectionDrawer key={`${source.entrez}-${target.entrez}`} source={source} target={target} weight={edge.weight} slug={slug} version={version} networkTitle={networkTitle} onClose={close} />;
}
