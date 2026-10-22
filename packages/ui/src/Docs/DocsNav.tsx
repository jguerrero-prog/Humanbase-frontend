import { useId, type ReactNode } from 'react';
import { useLinkHref } from '../hooks/useLinkHref';
import './Docs.css';

export interface DocsNavItem {
  label: string;
  href: string;
  /** "page" for the open page; "true" for the page it sits under, such as Use cases for one use case. */
  current?: 'page' | 'true';
  /** Shows a hover or focus state, for the design system's state examples. */
  'data-state'?: 'hover' | 'focus';
}

export interface DocsNavGroup {
  label: string;
  items: readonly DocsNavItem[];
}

export interface DocsNavProps {
  groups: readonly DocsNavGroup[];
  /** The "Search the docs" field, above the groups. */
  search?: ReactNode;
}

function Group({ group }: { group: DocsNavGroup }) {
  const headingId = useId();
  const linkHref = useLinkHref();
  return (
    <div className="docs-nav-group">
      <h2 id={headingId} className="docs-nav-heading">
        {group.label}
      </h2>
      <ul aria-labelledby={headingId}>
        {group.items.map((item) => (
          <li key={item.href}>
            <a className="docs-nav-item" href={linkHref(item.href)} aria-current={item.current} data-state={item['data-state']}>
              {item.label}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** The docs sidebar: a search field, then the pages in groups. */
export function DocsNav({ groups, search }: DocsNavProps) {
  return (
    <nav className="docs-nav" aria-label="Docs">
      {search && <div className="docs-nav-search">{search}</div>}
      {groups.map((group) => (
        <Group key={group.label} group={group} />
      ))}
    </nav>
  );
}
