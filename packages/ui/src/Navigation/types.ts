export interface NavLink {
  label: string;
  href: string;
  description?: string;
  /** A tool's icon, shown before its label in menus. */
  image?: string;
}

export interface NavGroup {
  label?: string;
  links: readonly NavLink[];
}

export interface NavSection {
  label: string;
  href?: string;
  columns?: readonly (readonly NavGroup[])[];
  footer?: { lead: string; link: NavLink };
}

export type NavItemState = 'hover' | 'open' | 'focus';
