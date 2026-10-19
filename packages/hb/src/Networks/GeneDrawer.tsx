import { useGeneFunctions, type GeneFunction, type NetworkGene } from '@humanbase/data';
import { Button, Drawer, GeneDetail } from '@humanbase/ui';
import { geneIdLinks } from './geneIds';

export interface GeneDrawerProps {
  gene: NetworkGene;
  /** Query gene symbols, joined for reading, such as "IL1B and TNF". */
  queryNames: string;
  networkTitle: string;
  onAdd?: (() => void) | undefined;
  onClose: () => void;
}

// The drawer lists a gene's strongest terms; the Biological processes and Diseases tabs hold the full tables.
const shownTerms = 12;
const termNames = (functions: readonly GeneFunction[] | undefined) => functions?.slice(0, shownTerms).map((row) => row.name);

export function GeneDrawer({ gene, queryNames, networkTitle, onAdd, onClose }: GeneDrawerProps) {
  const processes = useGeneFunctions(gene.entrez, 'gene-ontology-bp');
  const diseases = useGeneFunctions(gene.entrez, 'disease-ontology');

  return (
    <Drawer
      open
      title={gene.symbol}
      subtitle={gene.name}
      onClose={onClose}
      footer={onAdd && <Button onClick={onAdd}>Add to query</Button>}
    >
      <GeneDetail
        {...(gene.isQuery
          ? {}
          : { score: { label: `Connection to ${queryNames}`, value: gene.score, text: `Average weight of ${gene.symbol}’s connections to ${queryNames} in the ${networkTitle} network.` } })}
        aliases={gene.aliases}
        ids={geneIdLinks(gene)}
        annotations={{
          label: 'Annotations',
          sources: [
            { value: 'gene-ontology-bp', label: 'Gene Ontology (BP)', terms: processes.isError ? [] : termNames(processes.data) },
            { value: 'disease-ontology', label: 'Disease Ontology', terms: diseases.isError ? [] : termNames(diseases.data) },
          ],
        }}
      />
    </Drawer>
  );
}
