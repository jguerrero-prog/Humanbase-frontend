import { Button, Icon, useLinkHref } from '@humanbase/ui';
import { useId, type ReactNode } from 'react';
import './JobForm.css';

export interface JobExample {
  name: string;
  detail: string;
  onDownload: () => void;
}

export interface JobAboutProps {
  tool: string;
  children: ReactNode;
  docsHref: string;
  /** Extra links under the documentation link. */
  links?: ReactNode;
  examplesTitle?: string;
  examples: readonly JobExample[];
}

/** The About panel beside a job form: what the tool does, its documentation and its example files. */
export function JobAbout({ tool, children, docsHref, links, examplesTitle = 'Example files', examples }: JobAboutProps) {
  const linkHref = useLinkHref();
  const id = useId();
  const external = /^https?:/.test(docsHref);
  return (
    <aside className="job-about" aria-labelledby={id}>
      <h2 id={id}>About {tool}</h2>
      <p>{children}</p>
      <a className="button button-ghost button-small" href={linkHref(docsHref)} {...(external && { target: '_blank', rel: 'noreferrer' })}>
        <Icon name="book-open" size={16} />
        Read the {tool} documentation
        {external && <Icon name="external-link" size={16} label="opens Read the Docs in a new tab" />}
      </a>
      {links}
      {examples.length > 0 && (
        <>
          <h3>{examplesTitle}</h3>
          <ul className="job-examples">
            {examples.map((example) => (
              <li key={example.name}>
                <span>
                  <strong>{example.name}</strong>
                  {example.detail}
                </span>
                <Button variant="ghost" size="small" icon="download" onClick={example.onDownload}>
                  Download <span className="visually-hidden">{example.name}</span>
                </Button>
              </li>
            ))}
          </ul>
        </>
      )}
    </aside>
  );
}
