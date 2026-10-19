// Static homepage copy, kept apart from the page so it can be edited or translated in one place.
export interface Feature {
  title: string;
  text: string;
  link: { label: string; href: string };
  illustration: 'heatmap' | 'network' | 'gwas';
}

const links = {
  data: { label: 'Genomics data compendium', href: '/data-sources/' },
  tissue: { label: 'IL1B in mononuclear phagocyte', href: '/networks/?entrez=3553&tissue=mononuclear-phagocyte&version=v1' },
  netwas: { label: 'NetWAS analysis', href: '/netwas/' },
};

export const features: readonly Feature[] = [
  {
    title: 'Data-driven',
    text: 'Humanbase applies machine learning to learn biological associations from massive genomic data collections. These integrative analyses reach beyond existing biological knowledge in the literature to find new, data-driven associations.',
    link: links.data,
    illustration: 'heatmap',
  },
  {
    title: 'Tissue-specific',
    text: 'Humanbase models tissue-specific gene interactions using experimentally verified tissue expression and gene function, learning from a compendium of diverse tissues and cell types. The resulting networks capture tissue-specific gene function.',
    link: links.tissue,
    illustration: 'network',
  },
  {
    title: 'Network-guided',
    text: 'Tissue-specific networks can guide genome-wide association (GWAS) analysis by reprioritizing the associations from a GWAS study. With NetWAS, network-guided GWAS analysis, researchers can find additional disease-associated genes.',
    link: links.netwas,
    illustration: 'gwas',
  },
];

// The same section when Modules is the chosen analysis.
export const moduleFeatures: readonly Feature[] = [
  {
    title: 'Functional modules',
    text: 'Humanbase applies community detection to find cohesive gene clusters from a provided gene list and a selected relevant tissue. Genes within a cluster share local network neighborhoods and together form a cohesive, specific functional module.',
    link: links.data,
    illustration: 'network',
  },
  {
    title: 'Gene function prediction',
    text: 'Module detection enables systematic association of genes, even functionally uncharacterized genes, to specific processes and phenotypes represented in the detected modules.',
    link: links.tissue,
    illustration: 'heatmap',
  },
  {
    title: 'Tissue-specific',
    text: 'Functional modules are identified with tissue-specific networks, which predict gene interactions from massive data collections. Thus the discovered modules potentially capture higher-order tissue-specific function.',
    link: links.netwas,
    illustration: 'gwas',
  },
];

export interface Update {
  date: string;
  title: string;
  text: string;
}

export const updates: readonly Update[] = [
  {
    date: 'June 2026',
    title: 'New example gene sets for functional module detection',
    text: 'Two pre-loaded examples, a renal disease panel (kidney) and a synapse gene set (brain), each with its tissue chosen, so you can submit and inspect a result in one click.',
  },
  {
    date: 'June 2026',
    title: 'Updated Data sources page',
    text: 'Data sources are now organized by era, with a tab for each window of Humanbase results and the source versions behind it.',
  },
];
