import type { FooterProps, NavSection, SelectOption } from '@humanbase/ui';
import expecto from './analysis-icons/expecto_fa-magic.svg?url';
import expectoSc from './analysis-icons/expecto-sc_dendritic_cell.png?url';
import netwas from './analysis-icons/gwas-netwas_fa-list-ol.svg?url';
import ism from './analysis-icons/in-silico-mutagenesis_fa-th.svg?url';
import modules from './analysis-icons/modules_fa-certificate.svg?url';
import networks from './analysis-icons/networks_fa-connectdevelop.svg?url';
import deepsea from './analysis-icons/sei-and-beluga_deepsea_logo.svg?url';
import seqweaver from './analysis-icons/seqweaver_seqweaver-icon.svg?url';
import { asdBrowserRetired } from './asdBrowser';

// Product content shared by the app and the design system site, so both show the same menus.
export const analysisIcons = { networks, modules, netwas, deepsea, seqweaver, ism, expecto, expectoSc } as const;

const asdBrowser = { label: 'ASD Browser', href: '/asd/', description: 'Predicted effects of ASD proband mutations' };

export const productSections: NavSection[] = [
  {
    label: 'Network analysis',
    columns: [
      [
        {
          links: [
            { label: 'Networks', href: '/networks/', description: 'Tissue-specific gene networks, MAGE and GIANT', image: networks },
            { label: 'Modules', href: '/modules/', description: 'Functional modules in large gene lists', image: modules },
            { label: 'NetWAS', href: '/netwas/', description: 'Reprioritize GWAS results with networks', image: netwas },
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
            { label: 'Sei', href: '/sei/', description: 'Regulatory and chromatin effects', image: deepsea },
            { label: 'Beluga', href: '/beluga/', description: 'Chromatin effects (2019 model)', image: deepsea },
            { label: 'Seqweaver', href: '/seqweaver/', description: 'Post-transcriptional effects', image: seqweaver },
            { label: 'ExPecto', href: '/expecto/', description: 'Tissue-specific expression effects', image: expecto },
            { label: 'ExPecto SC', href: '/expecto-sc/', description: 'Cell-type-specific expression effects', image: expectoSc },
          ],
        },
      ],
      [
        { label: 'Sequences', links: [{ label: 'In silico mutagenesis', href: '/ism/', description: 'Regulatory features of a sequence', image: ism }] },
        ...(asdBrowserRetired ? [] : [{ label: 'Browsers', links: [asdBrowser] }]),
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
            { label: 'Humanbase API', href: '/api/docs/', description: 'Query Humanbase from code' },
          ],
        },
      ],
    ],
  },
  { label: 'Docs', href: '/docs/' },
  { label: 'About', href: '/about/' },
];

export const productFooter: Omit<FooterProps, 'onDisplaySettings'> = {
  description: 'Humanbase is developed at the Flatiron Institute’s Center for Computational Biology to study gene function, regulation and disease.',
  groups: [
    { heading: 'Network analysis', links: [{ label: 'Networks', href: '/networks/' }, { label: 'Modules', href: '/modules/' }, { label: 'NetWAS', href: '/netwas/' }] },
    { heading: 'Sequence analysis', links: [{ label: 'Sei', href: '/sei/' }, { label: 'ExPecto', href: '/expecto/' }, { label: 'All sequence tools', href: '/sequence-tools/' }] },
    { heading: 'Data', links: [{ label: 'Data sources', href: '/data-sources/' }, { label: 'Downloads', href: '/downloads/' }, { label: 'Humanbase API', href: '/api/docs/' }] },
    { heading: 'About', links: [{ label: 'About Humanbase', href: '/about/' }, { label: 'Docs', href: '/docs/' }, { label: 'Contact us', href: '/contact/' }, { label: 'How to cite', href: '/cite/' }] },
  ],
  legal: '© 2026 Simons Foundation. Flatiron Institute.',
  dataVersion: 'Data: MAGE, June 2026',
};

export const analysisOptions: SelectOption[] = [
  { value: 'networks', label: 'Networks', description: 'Tissue-specific gene networks, MAGE and GIANT', image: networks, group: 'Network analysis' },
  { value: 'modules', label: 'Modules', description: 'Functional modules in large gene lists', image: modules, group: 'Network analysis' },
  { value: 'netwas', label: 'NetWAS', description: 'Reprioritize GWAS results with networks', image: netwas, group: 'Network analysis' },
  { value: 'sei', label: 'Sei', description: 'Regulatory and chromatin effects', image: deepsea, group: 'Variant effects' },
  { value: 'beluga', label: 'Beluga', description: 'Chromatin effects (2019 model)', image: deepsea, group: 'Variant effects' },
  { value: 'seqweaver', label: 'Seqweaver', description: 'Post-transcriptional effects', image: seqweaver, group: 'Variant effects' },
  { value: 'expecto', label: 'ExPecto', description: 'Tissue-specific expression effects', image: expecto, group: 'Variant effects' },
  { value: 'expecto-sc', label: 'ExPecto SC', description: 'Cell-type-specific expression effects', image: expectoSc, group: 'Variant effects' },
  { value: 'ism', label: 'In silico mutagenesis', description: 'Regulatory features of a sequence', image: ism, group: 'Sequences' },
  ...(asdBrowserRetired ? [] : [{ value: 'asd', label: asdBrowser.label, description: asdBrowser.description, group: 'Browsers' }]),
];

export const analysisColumns = [['Network analysis'], ['Variant effects'], asdBrowserRetired ? ['Sequences'] : ['Sequences', 'Browsers']] as const;
