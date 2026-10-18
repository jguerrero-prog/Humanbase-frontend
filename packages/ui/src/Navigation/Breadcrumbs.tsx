import { Icon } from '../Icon/Icon';
import './Navigation.css';

export interface Crumb {
  label: string;
  href?: string;
}

export interface BreadcrumbsProps {
  items: readonly Crumb[];
  compact?: boolean;
}

export function Breadcrumbs({ items, compact = false }: BreadcrumbsProps) {
  const parent = items.at(-2);
  if (compact && parent) {
    return (
      <nav className="breadcrumbs" aria-label="Breadcrumb">
        <a className="breadcrumbs-back" href={parent.href}>
          <Icon name="chevron-left" size={16} />
          Back to {parent.label}
        </a>
      </nav>
    );
  }
  return (
    <nav className="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={item.label}>
              {index > 0 && <Icon name="chevron-right" size={16} />}
              {last ? <span aria-current="page">{item.label}</span> : <a href={item.href}>{item.label}</a>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function SkipLink({ target = '#main', 'data-state': dataState }: { target?: string; 'data-state'?: 'focus' }) {
  return (
    <a className="skip-link" href={target} data-state={dataState}>
      Skip to main content
    </a>
  );
}
