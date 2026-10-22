import { useId, useState, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { Drawer } from '../Drawer/Drawer';
import { useMediaQuery } from '../Layer/useMediaQuery';
import type { DocsSection } from './markdownSections';
import { OnThisPage } from './OnThisPage';
import './Docs.css';

export const DOCS_NARROW_QUERY = '(width < 75rem)';

export interface DocsLayoutProps {
  /** The DocsNav: a sidebar from 1200px wide, a menu below that. */
  nav: ReactNode;
  breadcrumbs?: ReactNode;
  title: string;
  /** The live page's id for the title, so links to it keep working. */
  titleId?: string;
  sections: readonly DocsSection[];
  /** Changes whenever the reader moves to another page or section, which closes the menu. */
  location?: string;
  /** Shows the narrow layout at any width, for examples. */
  narrow?: boolean;
  /** 2 when the layout is shown inside another page, such as a design system example. */
  titleLevel?: 1 | 2;
  children: ReactNode;
}

/** A docs page: sidebar, the 748px reading column and On this page, which move into a menu and under the title below 1200px. */
export function DocsLayout({ nav, breadcrumbs, title, titleId, sections, location = title, narrow: forceNarrow = false, titleLevel = 1, children }: DocsLayoutProps) {
  const narrowScreen = useMediaQuery(DOCS_NARROW_QUERY);
  const narrow = forceNarrow || narrowScreen;
  const [menuOpenAt, setMenuOpenAt] = useState<string | null>(null);
  const fallbackId = useId();
  const headingId = titleId ?? fallbackId;
  const Title = titleLevel === 1 ? 'h1' : 'h2';
  return (
    <div className={['docs-layout', narrow && 'docs-layout-narrow'].filter(Boolean).join(' ')}>
      {narrow ? (
        <Drawer title="Docs" open={menuOpenAt === location} onClose={() => setMenuOpenAt(null)} className="docs-layout-menu">
          {nav}
        </Drawer>
      ) : (
        <div className="docs-layout-sidebar">{nav}</div>
      )}
      <article className="docs-layout-main" aria-labelledby={headingId}>
        {narrow && (
          <Button variant="secondary" size="small" icon="menu" className="docs-layout-menu-button" aria-haspopup="dialog" aria-expanded={menuOpenAt === location} onClick={() => setMenuOpenAt(location)}>
            Docs menu
          </Button>
        )}
        <header className="docs-layout-header">
          {breadcrumbs}
          <Title id={headingId} className="docs-layout-title">
            {title}
          </Title>
          {narrow && <OnThisPage sections={sections} />}
        </header>
        {children}
      </article>
      {!narrow && (
        <div className="docs-layout-toc">
          <OnThisPage sections={sections} />
        </div>
      )}
    </div>
  );
}
