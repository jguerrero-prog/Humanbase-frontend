import type { ReactNode } from 'react';
import { docsAddress, isPlainClick, useDocsViewer } from '../Docs/DocsViewer';
import { useLinkHref } from '../hooks/useLinkHref';
import { Icon, type IconName } from '../Icon/Icon';

export interface DocsLinkProps {
  href: string;
  children: ReactNode;
  icon?: IconName;
}

/** The documentation link: Button / Small, ghost, with a book icon. Humanbase docs open in a drawer where one is provided; another site opens in a new tab. */
export function DocsLink({ href, children, icon = 'book-open' }: DocsLinkProps) {
  const linkHref = useLinkHref();
  const openDocs = useDocsViewer();
  const external = /^https?:/.test(href);
  const inDrawer = openDocs && !external && href.startsWith('/docs/');
  return (
    <a
      className="button button-ghost button-small"
      href={linkHref(href)}
      {...(external && { target: '_blank', rel: 'noreferrer' })}
      {...(inDrawer && { 'aria-haspopup': 'dialog' as const })}
      onClick={(event) => {
        if (!inDrawer || !isPlainClick(event)) return;
        const address = docsAddress(new URL(event.currentTarget.href));
        if (!address) return;
        event.preventDefault();
        openDocs(address);
      }}
    >
      <Icon name={icon} size={16} />
      {children}
      {external && <Icon name="external-link" size={16} label="opens in a new tab" />}
    </a>
  );
}
