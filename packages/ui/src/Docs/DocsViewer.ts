import { createContext, useContext } from 'react';

type OpenDocs = (href: string) => void;

const DocsViewer = createContext<OpenDocs | undefined>(undefined);

/** Opens an in-app docs address, such as /docs/sei/#output, in a drawer; without one, documentation links go to the page. */
export const DocsViewerProvider = DocsViewer.Provider;

export const useDocsViewer = (): OpenDocs | undefined => useContext(DocsViewer);

/** The docs address in a link, such as /docs/sei/#output, whatever path the app is served under; undefined for anything else. */
export function docsAddress(url: URL): string | undefined {
  const start = url.pathname.indexOf('/docs/');
  return url.origin === window.location.origin && start >= 0 ? url.pathname.slice(start) + url.hash : undefined;
}

/** A plain left click, which the page may handle itself; other clicks open new tabs or windows as usual. */
export const isPlainClick = (event: { button: number; metaKey: boolean; ctrlKey: boolean; shiftKey: boolean; altKey: boolean }) =>
  event.button === 0 && !event.metaKey && !event.ctrlKey && !event.shiftKey && !event.altKey;
