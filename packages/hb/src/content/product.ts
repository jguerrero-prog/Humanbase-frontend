import { mailingListHref, type Crumb, type FooterProps, type NavLink, type NavSection, type SelectOption } from '@humanbase/ui';
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

/** The top bar's sections, named for what people bring: genes, or variants and sequences. */
export const productCategories = {
  genes: 'Genes & gene sets',
  variants: 'Variants & sequences',
  resources: 'Resources',
  about: 'About',
} as const;

/** The first breadcrumb on a tool page, naming the category it sits in. */
export const categoryCrumbs = {
  genes: { label: productCategories.genes, href: '/' },
  variants: { label: productCategories.variants, href: '/sequence-tools/' },
} as const satisfies Record<string, Crumb>;

export const productTools = {
  networks: { label: 'Networks', href: '/networks/', description: 'Tissue-specific gene networks, MAGE and GIANT', image: networks },
  modules: { label: 'Modules', href: '/modules/', description: 'Functional modules in large gene lists', image: modules },
  netwas: { label: 'NetWAS', href: '/netwas/', description: 'Reprioritize GWAS results with networks', image: netwas },
  variantEffects: { label: 'Variant effects', href: '/variant-effects/', description: 'Sei and Beluga: regulatory and chromatin effects', image: deepsea },
  seqweaver: { label: 'Seqweaver', href: '/seqweaver/', description: 'Post-transcriptional effects', image: seqweaver },
  expressionEffects: { label: 'Expression effects', href: '/expression-effects/', description: 'ExPecto and ExPecto SC: tissue and cell-type effects', image: expecto },
} as const satisfies Record<string, NavLink>;

const asdBrowser = { label: 'ASD Browser', href: '/asd/', description: 'Predicted effects of ASD proband mutations' };
const variantTools: NavLink[] = [productTools.variantEffects, productTools.seqweaver, productTools.expressionEffects, ...(asdBrowserRetired ? [] : [asdBrowser])];

const resources: NavLink[] = [
  { label: 'Data sources', href: '/data-sources/', description: 'Datasets behind each network' },
  { label: 'Downloads', href: '/downloads/', description: 'Networks and models to download' },
  { label: 'Humanbase API', href: '/api/docs/', description: 'Query Humanbase from code' },
  { label: 'Docs', href: '/docs/', description: 'How to use each tool' },
];

const about: NavLink[] = [
  { label: 'About Humanbase', href: '/about/', description: 'The platform and the paper' },
  { label: 'How to cite', href: '/cite/', description: 'Papers to cite for Humanbase and each tool' },
  { label: 'What’s new', href: '/whats-new/', description: 'Updates to the tools and data' },
  { label: 'Mailing list', href: mailingListHref, description: 'Release notes by email' },
];

export const productSections: NavSection[] = [
  { label: productCategories.genes, columns: [[{ links: [productTools.networks, productTools.modules, productTools.netwas] }]] },
  {
    label: productCategories.variants,
    columns: [[{ links: variantTools }]],
    footer: { lead: 'Not sure which tool?', link: { label: 'Compare them', href: categoryCrumbs.variants.href } },
  },
  { label: productCategories.resources, columns: [[{ links: resources }]] },
  { label: productCategories.about, columns: [[{ links: about }]] },
];

/** Pages a section holds outside its tools' paths: job results, and the page comparing its tools. */
const sectionPaths: Partial<Record<string, readonly string[]>> = { [productCategories.variants]: ['/deepsea/jobs/', categoryCrumbs.variants.href] };

/** The top bar section holding the page at this path, so the bar can mark it as current. */
export function productSectionFor(pathname: string): string | undefined {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  const holds = (link: NavLink) => link.href.startsWith('/') && path.startsWith(link.href);
  const holdsPath = (section: NavSection) => (sectionPaths[section.label] ?? []).some((prefix) => path.startsWith(prefix));
  return productSections.find((section) => holdsPath(section) || section.columns?.flat().some((group) => group.links.some(holds)))?.label;
}

const footerLinks = (links: readonly NavLink[]) => links.map(({ label, href }) => ({ label, href }));

export const productFooter: Omit<FooterProps, 'onDisplaySettings'> = {
  description: 'Humanbase is developed at the Flatiron Institute’s Center for Computational Biology to study gene function, regulation and disease.',
  groups: productSections.map((section) => ({ heading: section.label, links: footerLinks(section.columns?.flat().flatMap((group) => group.links) ?? []) })),
  legal: '© 2026 Simons Foundation. Flatiron Institute.',
  dataVersion: 'Data: MAGE, June 2026',
};

const optionOf = (link: NavLink, group: string): SelectOption => ({
  value: link.href.replaceAll('/', ''),
  label: link.label,
  ...(link.description && { description: link.description }),
  ...(link.image && { image: link.image }),
  group,
});

export const analysisOptions: SelectOption[] = [
  ...[productTools.networks, productTools.modules, productTools.netwas].map((link) => optionOf(link, productCategories.genes)),
  ...variantTools.map((link) => optionOf(link, productCategories.variants)),
];

export const analysisColumns = [[productCategories.genes], [productCategories.variants]] as const;
