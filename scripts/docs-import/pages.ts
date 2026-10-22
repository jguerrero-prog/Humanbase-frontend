export const liveBase = 'https://humanbase.readthedocs.io/en/latest/';

export type DocsGroup = 'get-started' | 'network-analysis' | 'sequence-analysis' | 'use-cases';

export interface PageConfig {
  /** The page's path on readthedocs, such as sei.html or use-cases/sei-use-case.html. */
  source: string;
  /** Our route under /docs/: empty for the home page. */
  slug: string;
  group: DocsGroup;
  /** The sidebar label, when the page appears in the sidebar. */
  label?: string;
}

/** Every page the live sidebar and its pages link to, in sidebar order. A page missing here stops the import. */
export const pages: readonly PageConfig[] = [
  { source: 'usage.html', slug: '', group: 'get-started', label: 'Humanbase user guide' },
  { source: 'use-cases.html', slug: 'use-cases', group: 'get-started', label: 'Use cases' },
  { source: 'citations.html', slug: 'citations', group: 'get-started', label: 'Citations' },
  { source: 'reproducibility.html', slug: 'reproducibility', group: 'get-started', label: 'Reproducing legacy results' },
  { source: 'functional-networks.html', slug: 'functional-networks', group: 'network-analysis', label: 'Tissue-specific networks' },
  { source: 'modules.html', slug: 'modules', group: 'network-analysis', label: 'Functional module detection' },
  { source: 'netwas.html', slug: 'netwas', group: 'network-analysis', label: 'NetWAS: network-wide association study' },
  { source: 'deepsea.html', slug: 'deepsea', group: 'sequence-analysis', label: 'DeepSEA analysis' },
  { source: 'sei.html', slug: 'sei', group: 'sequence-analysis', label: 'Sei' },
  { source: 'beluga.html', slug: 'beluga', group: 'sequence-analysis', label: 'Beluga (DeepSEA)' },
  { source: 'seqweaver.html', slug: 'seqweaver', group: 'sequence-analysis', label: 'Seqweaver' },
  { source: 'expecto.html', slug: 'expecto', group: 'sequence-analysis', label: 'ExPecto' },
  { source: 'expectosc.html', slug: 'expectosc', group: 'sequence-analysis', label: 'ExPectoSC' },
  { source: 'in-silico-mutagenesis.html', slug: 'in-silico-mutagenesis', group: 'sequence-analysis', label: 'In silico mutagenesis' },
  { source: 'asdbrowser.html', slug: 'asdbrowser', group: 'sequence-analysis', label: 'ASD Browser' },
  ...[
    'ctcf-disruption',
    'expectosc-use-case',
    'expecto-use-case',
    'sei-use-case',
    'beluga-use-case',
    'seqweaver-use-case',
    'asd-genome-browser',
    'in-silico-mutagenesis-use-case',
    'functional-enrichments',
    'comparing-networks',
    'edge-contributions',
    'functional-module-clustering',
    'networks-use-case',
    'netwas-use-case',
    'extracting-fasta',
  ].map((name): PageConfig => ({ source: `use-cases/${name}.html`, slug: `use-cases/${name}`, group: 'use-cases' })),
];

/** Live pages that show the same content as another page, so links to them go to that page's route. */
export const aliases: Readonly<Record<string, string>> = { 'index.html': '' };
