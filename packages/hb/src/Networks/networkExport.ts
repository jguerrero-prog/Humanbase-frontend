import type { NetworkEdge } from '@humanbase/data';

/** The live site's network text file: comma-separated gene pairs with their unrounded weights. */
export function networkText(edges: readonly NetworkEdge[]): string {
  return ['GENE1,GENE2,WEIGHT', ...edges.map((edge) => `${edge.source.symbol},${edge.target.symbol},${edge.weight}`), ''].join('\n');
}

/** Network downloads are named after the network, as on the live site: "global", "adipose_tissue". */
export function networkFileName(networkTitle: string): string {
  return networkTitle.replace(/ /g, '_');
}
