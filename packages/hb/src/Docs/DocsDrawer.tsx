import { Alert, DocsReader, DocsViewerProvider, Drawer, Icon, useLinkHref, type DrawerProps } from '@humanbase/ui';
import { useState, type ReactNode } from 'react';
import { docsLibrary } from '../content/docs/DocsLibrary';

type DocsDrawerContent = Pick<DrawerProps, 'title' | 'subtitle' | 'footer' | 'children'>;

/** What a drawer shows for a docs address: the page's title, the page opened at its section, and a way to the full page. */
export function useDocsDrawer(href: string | undefined, onOpenDocs: (href: string) => void): DocsDrawerContent | undefined {
  const linkHref = useLinkHref();
  if (!href) return undefined;
  const found = docsLibrary.resolve(href);
  const footer = (
    <a className="button button-secondary button-small" href={linkHref(href)} target="_blank" rel="noreferrer">
      Open in a new tab
      <Icon name="external-link" size={16} />
    </a>
  );
  if (!found) return { title: 'Documentation', footer, children: <Alert tone="error" title="This documentation page wasn’t found">Open it in a new tab to see the full docs.</Alert> };
  return {
    title: found.page.title,
    subtitle: 'Documentation',
    footer,
    children: <DocsReader markdown={found.page.markdown} images={found.page.images} section={found.section} onOpenDocs={onOpenDocs} />,
  };
}

export interface DocsDrawerProviderProps {
  /** Closes the drawer when it changes, such as the page's path. */
  closeOn?: string;
  children: ReactNode;
}

/** Documentation links inside open their docs in a large drawer over the page, so people keep their place. */
export function DocsDrawerProvider({ closeOn, children }: DocsDrawerProviderProps) {
  // Remembers where the drawer was opened, so it is closed on any other page.
  const [opened, setOpened] = useState<{ href: string; on: string | undefined }>();
  const openDocs = (href: string) => setOpened({ href, on: closeOn });
  const content = useDocsDrawer(opened?.on === closeOn ? opened?.href : undefined, openDocs);
  return (
    <DocsViewerProvider value={openDocs}>
      {children}
      {content && <Drawer open size="large" className="docs-drawer" onClose={() => setOpened(undefined)} {...content} />}
    </DocsViewerProvider>
  );
}
