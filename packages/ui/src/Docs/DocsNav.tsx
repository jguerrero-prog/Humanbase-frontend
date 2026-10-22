import { useId, useState, type ReactNode } from 'react';
import { useLinkHref } from '../hooks/useLinkHref';
import { Icon } from '../Icon/Icon';
import { useCurrentSection } from './useCurrentSection';
import './Docs.css';

export interface DocsNavSubItem {
  label: string;
  href: string;
  /** The heading's id, when the section is on the open page, so the one being read is marked. */
  id?: string;
  /** 2 for a page listed under a section, such as the open use case under Use cases. */
  level?: 1 | 2;
  /** The open page, when it is listed as a sub item. */
  current?: boolean;
}

export interface DocsNavItem {
  label: string;
  href: string;
  /** "page" for the open page; "true" for the page it sits under, such as Use cases for one use case. */
  current?: 'page' | 'true';
  /** The page's sections, shown under it when it is expanded. */
  sections?: readonly DocsNavSubItem[];
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

type Toggles = ReadonlyMap<string, boolean>;

const noToggles: Toggles = new Map();

function SubItems({ id, item, hidden, reading }: { id: string; item: DocsNavItem; hidden: boolean; reading: string | undefined }) {
  const linkHref = useLinkHref();
  return (
    <ul id={id} className="docs-nav-sub" hidden={hidden}>
      {item.sections?.map((section) => {
        const current = section.current ? 'page' : section.id !== undefined && section.id === reading ? 'location' : undefined;
        return (
          <li key={section.href} className={`docs-nav-sub-level-${section.level ?? 1}`}>
            <a className="docs-nav-sub-item" href={linkHref(section.href)} aria-current={current}>
              {section.label}
            </a>
          </li>
        );
      })}
    </ul>
  );
}

function Item({ item, expanded, onToggle, reading }: { item: DocsNavItem; expanded: boolean; onToggle: () => void; reading: string | undefined }) {
  const linkHref = useLinkHref();
  const subId = useId();
  const toggles = Boolean(item.sections?.length);
  return (
    <li>
      <div className="docs-nav-row" data-current={item.current} data-state={item['data-state']}>
        <a className="docs-nav-item" href={linkHref(item.href)} aria-current={item.current}>
          {item.label}
        </a>
        {toggles && (
          <button type="button" className="docs-nav-toggle" aria-expanded={expanded} aria-controls={subId} onClick={onToggle}>
            <Icon name={expanded ? 'chevron-down' : 'chevron-right'} size={16} />
            <span className="visually-hidden">Show sections of {item.label}</span>
          </button>
        )}
      </div>
      {toggles && <SubItems id={subId} item={item} hidden={!expanded} reading={reading} />}
    </li>
  );
}

function Group({ group, isExpanded, onToggle, reading }: { group: DocsNavGroup; isExpanded: (item: DocsNavItem) => boolean; onToggle: (item: DocsNavItem) => void; reading: string | undefined }) {
  const headingId = useId();
  return (
    <div className="docs-nav-group">
      <h2 id={headingId} className="docs-nav-heading">
        {group.label}
      </h2>
      <ul aria-labelledby={headingId}>
        {group.items.map((item) => (
          <Item key={item.href} item={item} expanded={isExpanded(item)} onToggle={() => onToggle(item)} reading={reading} />
        ))}
      </ul>
    </div>
  );
}

/** The docs sidebar: a search field, then the pages in groups. The open page lists its sections; any page's chevron shows them. */
export function DocsNav({ groups, search }: DocsNavProps) {
  const items = groups.flatMap((group) => group.items);
  const open = items.find((item) => item.current === 'page');
  const reading = useCurrentSection(open?.sections?.flatMap((section) => (section.id ? [section.id] : [])) ?? []);
  // Toggles belong to the open page: opening another page starts again with only that one expanded.
  const openKey = items.find((item) => item.current)?.href ?? '';
  const [toggled, setToggled] = useState<{ key: string; toggles: Toggles }>({ key: openKey, toggles: noToggles });
  const toggles = toggled.key === openKey ? toggled.toggles : noToggles;
  const isExpanded = (item: DocsNavItem) => toggles.get(item.href) ?? item.current !== undefined;
  const toggle = (item: DocsNavItem) => setToggled({ key: openKey, toggles: new Map(toggles).set(item.href, !isExpanded(item)) });
  return (
    <nav className="docs-nav" aria-label="Docs">
      {search && <div className="docs-nav-search">{search}</div>}
      {groups.map((group) => (
        <Group key={group.label} group={group} isExpanded={isExpanded} onToggle={toggle} reading={reading} />
      ))}
    </nav>
  );
}
