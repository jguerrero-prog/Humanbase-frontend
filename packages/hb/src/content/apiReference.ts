/** The API reference page, which reads the API's own schema (#573). Its path can't start with /api, which proxies send to the API. */
export const apiReferenceHref = '/humanbase-api/';

/** Each group of endpoints, as the schema tags them, with what it covers, written from its endpoints. */
export const apiGroups: Readonly<Record<string, { label: string; text: string }>> = {
  compendiums: { label: 'Compendiums', text: 'Data compendia, their datasets and terms, and the data for a gene pair.' },
  databases: { label: 'Databases', text: 'The databases that terms come from.' },
  datasets: { label: 'Datasets', text: 'One dataset, by its slug.' },
  datatypes: { label: 'Data types', text: 'The data types in each GIANT or MAGE version.' },
  deepsea: { label: 'DeepSEA', text: 'The Sei, Beluga, ExPecto and Seqweaver models, and the jobs that score variants and sequences with them.' },
  genes: { label: 'Genes', text: 'A gene by its Entrez ID, the terms it is annotated to or predicted for, and its variants’ predicted tissue effects.' },
  integrations: { label: 'Integrations', text: 'The tissue and cell-type networks: a network’s genes, evidence and edges, connectivity, and modules in a gene set.' },
  netwas: { label: 'NetWAS', text: 'NetWAS and MAGE-WAS jobs.' },
  seek: { label: 'SEEK', text: 'SEEK searches, and their enrichment and expression.' },
  terms: { label: 'Terms', text: 'A term, the genes annotated to it or predicted for it, and the terms a set of genes is annotated to.' },
};

export const apiGroupLabel = (tag: string) => apiGroups[tag]?.label ?? tag;
