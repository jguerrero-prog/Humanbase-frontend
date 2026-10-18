import type { NavSection } from '@humanbase/ui';

// The proposed HumanBase top bar, shared by every page that draws a product screen.
export const productSections: NavSection[] = [
  {
    label: 'Network analysis',
    columns: [
      [
        {
          links: [
            { label: 'Networks', href: '/networks/', description: 'Tissue-specific gene networks, MAGE and GIANT' },
            { label: 'Modules', href: '/modules/', description: 'Functional modules in large gene lists' },
            { label: 'NetWAS', href: '/netwas/', description: 'Reprioritize GWAS results with networks' },
          ],
        },
      ],
    ],
  },
  {
    label: 'Sequence analysis',
    columns: [
      [
        {
          label: 'Variant effects',
          links: [
            { label: 'Sei', href: '/sei/', description: 'Regulatory and chromatin effects' },
            { label: 'Beluga', href: '/beluga/', description: 'Chromatin effects (2019 model)' },
            { label: 'Seqweaver', href: '/seqweaver/', description: 'Post-transcriptional effects' },
            { label: 'ExPecto', href: '/expecto/', description: 'Tissue-specific expression effects' },
            { label: 'ExPecto SC', href: '/expecto-sc/', description: 'Cell-type-specific expression effects' },
          ],
        },
      ],
      [
        { label: 'Sequences', links: [{ label: 'In silico mutagenesis', href: '/ism/', description: 'Regulatory features of a sequence' }] },
        { label: 'Browsers', links: [{ label: 'ASD Browser', href: '/asd/', description: 'Predicted effects of ASD proband mutations' }] },
      ],
    ],
    footer: { lead: 'Not sure which tool?', link: { label: 'Compare them', href: '/sequence-tools/' } },
  },
  {
    label: 'Data',
    columns: [
      [
        {
          links: [
            { label: 'Data sources', href: '/data-sources/', description: 'Datasets behind each network' },
            { label: 'Downloads', href: '/downloads/', description: 'Networks and models to download' },
            { label: 'HumanBase API', href: '/api/docs/', description: 'Query HumanBase from code' },
          ],
        },
      ],
    ],
  },
  { label: 'Docs', href: '/docs/' },
  { label: 'About', href: '/about/' },
];

export const productJobs = { href: '/jobs/', running: 1 };
