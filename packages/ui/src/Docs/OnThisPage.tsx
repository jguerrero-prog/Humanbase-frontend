import type { DocsSection } from './markdownSections';
import { useCurrentSection } from './useCurrentSection';
import './Docs.css';

export interface OnThisPageProps {
  sections: readonly DocsSection[];
  /** The section to mark as current; left out, the list follows the reader's scrolling. */
  current?: string;
}

/** Links to the page's h2 and h3 sections, marking the one being read. Hidden when there are fewer than two. */
export function OnThisPage({ sections, current }: OnThisPageProps) {
  const listed = sections.filter((section) => section.level === 2 || section.level === 3);
  const tracked = useCurrentSection(current === undefined ? listed.map((section) => section.id) : []);
  if (listed.length < 2) return null;
  const active = current ?? tracked;
  return (
    <nav className="on-this-page" aria-label="On this page">
      <p className="on-this-page-title" aria-hidden="true">
        On this page
      </p>
      <ul>
        {listed.map((section) => (
          <li key={section.id} className={`on-this-page-level-${section.level}`}>
            <a href={`#${section.id}`} aria-current={section.id === active ? 'location' : undefined}>
              {section.title}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
