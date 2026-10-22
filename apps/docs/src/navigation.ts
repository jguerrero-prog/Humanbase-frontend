import { withBase } from './withBase';

export interface NavItem {
  label: string;
  href?: string;
}

export interface NavSection {
  heading: string;
  isTitle?: boolean;
  items: NavItem[];
}

const sections: NavSection[] = [
  {
    heading: 'Get Started',
    isTitle: true,
    items: [
      { label: 'Overview', href: '/' },
      { label: 'About Humanbase', href: '/#about' },
      { label: 'Vision and principles', href: '/#vision' },
      { label: 'How to use the system', href: '/#how-to-use' },
    ],
  },
  {
    heading: 'Foundations',
    items: [
      { label: 'Typography', href: '/foundations/typography/' },
      { label: 'Color palette', href: '/foundations/color-palette/' },
      { label: 'Iconography', href: '/foundations/iconography/' },
      { label: 'Illustration', href: '/foundations/illustration/' },
      { label: 'Spacing and layout grid', href: '/foundations/spacing-and-layout-grid/' },
      { label: 'Corner radius', href: '/foundations/corner-radius/' },
      { label: 'Elevation and borders', href: '/foundations/elevation-and-borders/' },
      { label: 'Motion', href: '/foundations/motion/' },
      { label: 'Accessibility', href: '/foundations/accessibility/' },
    ],
  },
  {
    heading: 'Tokens',
    items: [
      { label: 'Color', href: '/tokens/color/' },
      { label: 'Typography', href: '/tokens/typography/' },
      { label: 'Spacing', href: '/tokens/spacing/' },
      { label: 'Radius and elevation', href: '/tokens/radius-and-elevation/' },
      { label: 'States: hover, focus, disabled, error', href: '/tokens/states/' },
    ],
  },
  {
    heading: 'Usage guidelines',
    items: [
      { label: 'Voice and content', href: '/guidelines/voice-and-content/' },
      { label: 'Scientific notation and units', href: '/guidelines/scientific-notation-and-units/' },
      { label: 'Data visualization', href: '/guidelines/data-visualization/' },
      { label: 'Errors and validation', href: '/guidelines/errors-and-validation/' },
      { label: 'Empty states', href: '/guidelines/empty-states/' },
      { label: 'Loading and job status', href: '/guidelines/loading-and-job-status/' },
    ],
  },
  {
    heading: 'Components',
    items: [
      { label: 'Buttons', href: '/components/buttons/' },
      { label: 'Text inputs and search', href: '/components/text-inputs-and-search/' },
      { label: 'Dropdowns and selects', href: '/components/dropdowns-and-selects/' },
      { label: 'Sliders', href: '/components/sliders/' },
      { label: 'Tabs and segmented controls', href: '/components/tabs-and-segmented-controls/' },
      { label: 'Accordions', href: '/components/accordions/' },
      { label: 'Tables', href: '/components/tables/' },
      { label: 'Alerts and toasts', href: '/components/alerts-and-toasts/' },
      { label: 'Modals and drawers', href: '/components/modals-and-drawers/' },
      { label: 'Tooltips', href: '/components/tooltips/' },
      { label: 'Navigation and breadcrumbs', href: '/components/navigation-and-breadcrumbs/' },
      { label: 'Pagination', href: '/components/pagination/' },
      { label: 'Badges and tags', href: '/components/badges-and-tags/' },
      { label: 'Code block', href: '/components/code-block/' },
      { label: 'Audio player', href: '/components/audio-player/' },
    ],
  },
  {
    heading: 'UI library',
    items: [
      { label: 'What exists today', href: '/ui-library/what-exists-today/' },
      { label: 'Results layout', href: '/ui-library/results-layout/' },
      { label: 'Gene search and matching', href: '/ui-library/gene-search-and-matching/' },
      { label: 'Job submission', href: '/ui-library/job-submission/' },
      { label: 'Job status and queue', href: '/ui-library/job-status-and-queue/' },
      { label: 'Network graph' },
      { label: 'Variant effect results', href: '/ui-library/variant-effect-results/' },
      { label: 'Genome browser', href: '/ui-library/genome-browser/' },
      { label: 'Heatmaps and score legends', href: '/ui-library/heatmaps-and-score-legends/' },
      { label: 'ASD Browser', href: '/ui-library/asd-browser/' },
      { label: 'NetWAS results', href: '/ui-library/netwas-results/' },
      { label: 'Article template', href: '/ui-library/article-template/' },
    ],
  },
  {
    heading: 'Existing and proposed',
    items: [
      { label: 'Overview', href: '/existing-and-proposed/' },
      { label: 'Homepage', href: '/existing-and-proposed/homepage/' },
      { label: 'Networks', href: '/existing-and-proposed/networks/' },
      { label: 'Networks: other views', href: '/existing-and-proposed/networks-views/' },
      { label: 'Modules', href: '/existing-and-proposed/modules/' },
      { label: 'NetWAS', href: '/existing-and-proposed/netwas/' },
      { label: 'Sei, Beluga and Seqweaver', href: '/existing-and-proposed/sei-beluga-seqweaver/' },
      { label: 'ExPecto', href: '/existing-and-proposed/expecto/' },
      { label: 'ExPecto SC', href: '/existing-and-proposed/expecto-sc/' },
      { label: 'In silico mutagenesis', href: '/existing-and-proposed/in-silico-mutagenesis/' },
      { label: 'ASD Browser', href: '/existing-and-proposed/asd-browser/' },
    ],
  },
  {
    heading: 'Resources',
    items: [{ label: 'Figma library', href: '/resources/figma-library/' }, { label: 'Changelog', href: '/resources/changelog/' }, { label: 'Contribution guide', href: '/resources/contribution-guide/' }, { label: 'Deploying', href: '/resources/deploying/' }, { label: 'Contact the team', href: '/resources/contact-the-team/' }],
  },
];

export const navigation: NavSection[] = sections.map((section) => ({
  ...section,
  items: section.items.map((item) => (item.href ? { ...item, href: withBase(item.href) } : item)),
}));

export function hrefFor(label: string): string | undefined {
  return navigation.flatMap((section) => section.items).find((item) => item.label === label)?.href;
}
