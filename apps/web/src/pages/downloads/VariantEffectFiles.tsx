import { docsPage } from '@humanbase/data';
import { downloadCitations, variantEffectDownloads, variantEffectsIntro, type ResourceGroup } from '@humanbase/hb';
import { Cell, DocsLink, HeaderCell, Table } from '@humanbase/ui';
import { useId } from 'react';

function ResourceSection({ title, description, docs, files }: ResourceGroup) {
  const headingId = useId();
  return (
    <section className="downloads-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      <p>{description}</p>
      {docs && (
        <p className="downloads-docs">
          <DocsLink href={docsPage(docs)}>Read the {title} documentation</DocsLink>
        </p>
      )}
      <Table caption={`${title} files`} columnWidths={['24%', '38%', '16%', '10%', '12%']} minWidth="800px">
        <thead>
          <tr>
            <HeaderCell>File</HeaderCell>
            <HeaderCell>Description</HeaderCell>
            <HeaderCell>Format</HeaderCell>
            <HeaderCell align="end">Size</HeaderCell>
            <HeaderCell>Download</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {files.map(({ name, file, description: about, format, size, href }) => (
            <tr key={file}>
              <Cell rowHeader wrap>
                <span className="downloads-file-name">{name}</span>
                <span className="downloads-file">{file}</span>
              </Cell>
              <Cell wrap>{about}</Cell>
              <Cell wrap>{format}</Cell>
              <Cell type="number">{size}</Cell>
              <Cell>
                <a href={href}>
                  Download<span className="visually-hidden"> {file}</span>
                </a>
              </Cell>
            </tr>
          ))}
        </tbody>
      </Table>
    </section>
  );
}

function Citations() {
  const headingId = useId();
  return (
    <section className="downloads-section" aria-labelledby={headingId}>
      <h2 id={headingId}>Citation</h2>
      <p>When using these resources, please cite the relevant publications:</p>
      <dl className="downloads-citations">
        {downloadCitations.map(({ method, authors, title, journal, href }) => (
          <div key={method}>
            <dt>{method}</dt>
            <dd>
              {authors} <a href={href}>{title}</a> <i>{journal}</i>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

/** The model and resource archives behind Humanbase's variant effect tools, then the papers to cite. */
export function VariantEffectFiles() {
  return (
    <div className="downloads-group">
      <p className="downloads-intro">{variantEffectsIntro}</p>
      {variantEffectDownloads.map((group) => (
        <ResourceSection key={group.title} {...group} />
      ))}
      <Citations />
    </div>
  );
}
