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
      { label: 'Typography' },
      { label: 'Color palette' },
      { label: 'Iconography', href: '/foundations/iconography/' },
      { label: 'Spacing and layout grid' },
      { label: 'Corner radius' },
      { label: 'Elevation and borders' },
      { label: 'Motion' },
      { label: 'Accessibility' },
    ],
  },
  {
    heading: 'Tokens',
    items: [
      { label: 'Color', href: '/tokens/color/' },
      { label: 'Typography', href: '/tokens/typography/' },
      { label: 'Spacing' },
      { label: 'Radius and elevation' },
      { label: 'States: hover, focus, disabled, error' },
    ],
  },
  {
    heading: 'Usage guidelines',
    items: [
      { label: 'Voice and content' },
      { label: 'Scientific notation and units' },
      { label: 'Data visualization' },
      { label: 'Errors and validation' },
      { label: 'Empty states' },
      { label: 'Loading and job status' },
    ],
  },
  {
    heading: 'Components',
    items: [
      { label: 'Buttons', href: '/components/buttons/' },
      { label: 'Text inputs and search', href: '/components/text-inputs-and-search/' },
      { label: 'Dropdowns and selects' },
      { label: 'Sliders' },
      { label: 'Tabs and segmented controls' },
      { label: 'Accordions' },
      { label: 'Tables' },
      { label: 'Alerts and toasts' },
      { label: 'Modals and drawers' },
      { label: 'Tooltips' },
      { label: 'Navigation and breadcrumbs' },
      { label: 'Pagination' },
      { label: 'Badges and tags' },
      { label: 'Code block' },
    ],
  },
  {
    heading: 'UI library',
    items: [
      { label: 'What exists today' },
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
