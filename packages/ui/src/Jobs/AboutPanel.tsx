import { createElement, useId, type ReactNode } from 'react';
import { Button } from '../Button/Button';
import { DocsLink } from './DocsLink';
import './AboutPanel.css';

export interface ExampleFile {
  name: string;
  /** What the file is, such as "VEGAS format". */
  detail: string;
  /** Loads the file into the form. */
  onUse?: () => void;
  /** Saves the file. */
  onDownload?: () => void;
}

export interface AboutPanelProps {
  /** The tool's name, as in "About NetWAS". */
  tool: string;
  children: ReactNode;
  /** Left out when the tool has no documentation page yet. */
  docsHref?: string | undefined;
  /** Extra links under the documentation link. */
  links?: ReactNode;
  /** Names the files' source, such as "Example files: the same BMI GWAS (Randall 2013)". */
  examplesTitle?: string;
  examples?: readonly ExampleFile[];
  /** The title's level; the examples heading is one below. */
  headingLevel?: 2 | 3 | 4;
}

/** The panel beside every tool form: what the tool does, its documentation and its example files. */
export function AboutPanel({ tool, children, docsHref, links, examplesTitle = 'Example files', examples = [], headingLevel = 2 }: AboutPanelProps) {
  const id = useId();
  return (
    <aside className="about-panel" aria-labelledby={id}>
      {createElement(`h${headingLevel}`, { id, className: 'about-panel-title' }, `About ${tool}`)}
      <p>{children}</p>
      {docsHref && <DocsLink href={docsHref}>Read the {tool} documentation</DocsLink>}
      {links}
      {examples.length > 0 && (
        <>
          {createElement(`h${headingLevel + 1}`, { className: 'about-panel-examples-title' }, examplesTitle)}
          <ul className="about-panel-examples">
            {examples.map((example) => (
              <li key={example.name}>
                <span>
                  <strong>{example.name}</strong>
                  {example.detail}
                </span>
                {example.onUse && (
                  <Button variant="ghost" size="small" onClick={example.onUse}>
                    Use the example <span className="visually-hidden">{example.name}</span>
                  </Button>
                )}
                {example.onDownload && (
                  <Button variant="ghost" size="small" icon="download" onClick={example.onDownload}>
                    Download <span className="visually-hidden">{example.name}</span>
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
