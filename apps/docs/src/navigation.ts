export interface NavItem {
  label: string;
  href: string;
}

export interface NavSection {
  title: string;
  items: NavItem[];
}

export const navigation: NavSection[] = [
  { title: 'Start here', items: [{ label: 'Overview', href: '/' }] },
  {
    title: 'Foundations',
    items: [
      { label: 'Color', href: '/foundations/color/' },
      { label: 'Typography', href: '/foundations/typography/' },
    ],
  },
];
