export interface NavItem {
  label: string;
  href?: string;
}

export interface NavSection {
  heading: string;
  isTitle?: boolean;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  {
    heading: 'Get Started',
    isTitle: true,
    items: [
      { label: 'Overview', href: '/' },
      { label: 'About HumanBase' },
      { label: 'Vision and principles' },
      { label: 'How to use the system' },
    ],
  },
  {
    heading: 'Foundations',
    items: [
      { label: 'Typography', href: '/foundations/typography/' },
      { label: 'Color palette', href: '/foundations/color-palette/' },
      { label: 'Iconography', href: '/foundations/iconography/' },
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
      { label: 'Loading and job status' },
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
    ],
  },
  {
    heading: 'UI library',
    items: [
      { label: 'What exists today', href: '/ui-library/what-exists-today/' },
      { label: 'Results layout' },
      { label: 'Gene search and matching' },
      { label: 'Job submission' },
      { label: 'Job status and queue' },
      { label: 'Network graph' },
      { label: 'Variant effect results' },
      { label: 'Genome browser' },
      { label: 'Heatmaps and score legends' },
      { label: 'ASD Browser' },
      { label: 'NetWAS results' },
    ],
  },
  {
    heading: 'Resources',
    items: [{ label: 'Figma library' }, { label: 'Changelog' }, { label: 'Contribution guide' }, { label: 'Contact the team' }],
  },
];

export function hrefFor(label: string): string | undefined {
  return navigation.flatMap((section) => section.items).find((item) => item.label === label)?.href;
}
