import type { ReactNode } from 'react';
import { useLinkHref } from '../hooks/useLinkHref';
import { Icon, type IconName } from '../Icon/Icon';

export interface DocsLinkProps {
  href: string;
  children: ReactNode;
  icon?: IconName;
}

/** The documentation link: Button / Small, ghost, with a book icon; another site opens in a new tab. */
export function DocsLink({ href, children, icon = 'book-open' }: DocsLinkProps) {
  const linkHref = useLinkHref();
  const external = /^https?:/.test(href);
  return (
    <a className="button button-ghost button-small" href={linkHref(href)} {...(external && { target: '_blank', rel: 'noreferrer' })}>
      <Icon name={icon} size={16} />
      {children}
      {external && <Icon name="external-link" size={16} label="opens in a new tab" />}
    </a>
  );
}
