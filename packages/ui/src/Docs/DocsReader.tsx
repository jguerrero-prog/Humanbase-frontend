import { useEffect, useRef } from 'react';
import { DocsMarkdown, type ImageSizes } from './DocsMarkdown';
import { docsAddress, isPlainClick } from './DocsViewer';

export interface DocsReaderProps {
  markdown: string;
  images?: ImageSizes;
  /** The heading id to open at, such as output; the top of the page without one. */
  section?: string | undefined;
  /** Opens another docs address, such as /docs/beluga/#input, in the same place. */
  onOpenDocs: (href: string) => void;
}

const sectionIn = (root: HTMLElement, id: string) => root.querySelector<HTMLElement>(`#${CSS.escape(id)}`);

/** A docs page read in place, such as in a drawer: it opens at a section, and its docs links stay where it is. */
export function DocsReader({ markdown, images, section, onOpenDocs }: DocsReaderProps) {
  const root = useRef<HTMLDivElement>(null);

  // Waits a frame, so a drawer opening around the reader can lay it out first.
  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      const element = root.current;
      if (!element) return;
      (section && sectionIn(element, section) || element).scrollIntoView({ block: 'start' });
    });
    return () => cancelAnimationFrame(frame);
  }, [markdown, section]);

  return (
    // eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions -- delegates clicks on the links inside, which keep their own keyboard behavior
    <div
      ref={root}
      className="docs-reader"
      onClick={(event) => {
        const link = event.target instanceof Element ? event.target.closest('a') : null;
        if (!link || link.target || !isPlainClick(event) || !root.current) return;
        const raw = link.getAttribute('href') ?? '';
        if (raw.startsWith('#')) {
          event.preventDefault();
          sectionIn(root.current, decodeURIComponent(raw.slice(1)))?.scrollIntoView({ block: 'start' });
          return;
        }
        const address = docsAddress(new URL(link.href));
        if (!address) return;
        event.preventDefault();
        onOpenDocs(address);
      }}
    >
      <DocsMarkdown markdown={markdown} {...(images && { images })} />
    </div>
  );
}
