import { NetworkQuery, type GeneHit } from '@humanbase/data';
import type { SearchDestination } from '@humanbase/ui';
import { genomeBrowserLink } from '../content/genomeBrowser';
import { productTools } from '../content/product';
import { expressionGeneLink } from '../Expecto/geneExpressionTools';

/** Where a gene from search can open: Networks only when a network version has it, the genome browser only while its preview is on. */
export function geneDestinations(gene: GeneHit): SearchDestination[] {
  const version = gene.isInVersion(NetworkQuery.defaultVersion) ? NetworkQuery.defaultVersion : 'v1';
  const genome = genomeBrowserLink.gene(gene.symbol);
  return [
    ...(gene.isInAnyNetwork ? [{ label: productTools.networks.label, href: new NetworkQuery([gene.entrez], undefined, version).href }] : []),
    { label: productTools.expressionEffects.label, href: expressionGeneLink(gene.entrez) },
    ...(genome ? [{ label: 'Genome browser', href: genome }] : []),
  ];
}
