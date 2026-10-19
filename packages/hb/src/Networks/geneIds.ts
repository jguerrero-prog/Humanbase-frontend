import type { NetworkGene } from '@humanbase/data';
import type { GeneIdLink } from '@humanbase/ui';

const order = ['MIM', 'Ensembl', 'HGNC', 'Entrez'];
const sites: Record<string, string> = { MIM: 'OMIM', Ensembl: 'Ensembl', HGNC: 'HGNC', Entrez: 'NCBI Gene' };

/** A gene's cross-references as links, in the order the design shows them. */
export function geneIdLinks(gene: NetworkGene): GeneIdLink[] {
  return gene.xrefs
    .filter((xref) => order.includes(xref.crossrefdb.name))
    .sort((a, b) => order.indexOf(a.crossrefdb.name) - order.indexOf(b.crossrefdb.name))
    .map((xref) => ({
      source: xref.crossrefdb.name,
      id: xref.xrid.replace(/^HGNC:/, ''),
      href: xref.crossrefdb.url.replace('_REPL_', encodeURIComponent(xref.xrid)).replace(/^http:/, 'https:'),
      site: sites[xref.crossrefdb.name] ?? xref.crossrefdb.name,
    }));
}
