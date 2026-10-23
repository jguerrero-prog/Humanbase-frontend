import type { BulkArchive, NetworkScript, TissueNetworks } from '@humanbase/hb';
import { Alert, Cell, CodeBlock, Disclosure, HeaderCell, Icon, InlineCode, Pagination, rowsPerPage, SearchField, Table, TableMessage } from '@humanbase/ui';
import { useId, useState } from 'react';

function FileFormats({ networks }: { networks: TissueNetworks }) {
  return (
    <dl className="downloads-formats">
      {networks.formats.map(({ name, description, columns }) => (
        <div key={name}>
          <dt>{name}</dt>
          <dd>
            <p>{description}</p>
            {columns && <InlineCode>{columns}</InlineCode>}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function BulkDownloads({ archives }: { archives: readonly BulkArchive[] }) {
  const headingId = useId();
  return (
    <section className="downloads-section" aria-labelledby={headingId}>
      <h3 id={headingId}>Bulk downloads</h3>
      <p>Download gzip archives of all networks and standards. These are very large files. Consider using the Python script below to download individual networks in smaller increments if your connection is unstable.</p>
      <Table caption="Bulk downloads" columnWidths={['50%', '20%', '30%']} minWidth="480px">
        <thead>
          <tr>
            <HeaderCell>Archive</HeaderCell>
            <HeaderCell align="end">Size</HeaderCell>
            <HeaderCell>Download</HeaderCell>
          </tr>
        </thead>
        <tbody>
          {archives.map(({ name, size, href }) => (
            <tr key={name}>
              <Cell rowHeader>{name}</Cell>
              <Cell type="number">{size}</Cell>
              <Cell>
                <a href={href}>{href.split('/').pop()}</a>
              </Cell>
            </tr>
          ))}
        </tbody>
      </Table>
    </section>
  );
}

function ScriptSection({ script }: { script: NetworkScript }) {
  const headingId = useId();
  const scriptId = useId();
  const [open, setOpen] = useState(false);
  const lineCount = script.text.trimEnd().split('\n').length;
  return (
    <section className="downloads-section" aria-labelledby={headingId}>
      <h3 id={headingId}>Bulk download script</h3>
      <p>{script.description}</p>
      <div className="downloads-actions">
        <a className="button button-secondary button-small" href={script.href} download={script.name}>
          <Icon name="download" size={16} />
          Download script
        </a>
        <Disclosure label="Show script" expandedLabel="Hide script" controls={scriptId} open={open} onOpenChange={setOpen} />
      </div>
      <div id={scriptId} hidden={!open}>
        {open && <CodeBlock label={`${script.name} · Python, ${lineCount} lines`} code={script.text} collapseAfter={Infinity} />}
      </div>
    </section>
  );
}

function TissueTable({ networks }: { networks: TissueNetworks }) {
  const headingId = useId();
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<number>(rowsPerPage[0]);
  const query = filter.trim().toLowerCase();
  const matches = networks.tissues.filter((tissue) => tissue.toLowerCase().includes(query));
  const shown = matches.slice((page - 1) * pageSize, page * pageSize);
  const columnCount = networks.columns.length + 1;

  const changeFilter = (text: string) => {
    setFilter(text);
    setPage(1);
  };

  return (
    <section className="downloads-section" aria-labelledby={headingId}>
      <h3 id={headingId}>Tissue networks</h3>
      <search className="downloads-filter">
        <SearchField
          label={`Filter ${networks.noun}`}
          placeholder={networks.filterPlaceholder}
          size="medium"
          value={filter}
          onChange={(event) => changeFilter(event.target.value)}
          onClear={() => changeFilter('')}
        />
      </search>
      <Table caption={networks.title} minWidth={columnCount > 2 ? '720px' : '480px'}>
        <thead>
          <tr>
            <HeaderCell>{networks.tissueLabel}</HeaderCell>
            {networks.columns.map((column) => (
              <HeaderCell key={column.label}>{column.label}</HeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {shown.map((tissue) => (
            <tr key={tissue}>
              <Cell rowHeader>{tissue}</Cell>
              {networks.columns.map((column) => {
                const file = column.file(tissue);
                return <Cell key={column.label}>{!column.missing?.includes(tissue) && <a href={`${column.folder}/${file}`}>{file}</a>}</Cell>;
              })}
            </tr>
          ))}
          {matches.length === 0 && <TableMessage columns={columnCount} title={`No ${networks.noun} match “${filter.trim()}”`} text="Check the spelling, or clear the filter to see them all." icon="search" />}
        </tbody>
      </Table>
      {matches.length > 0 && <Pagination total={matches.length} noun={networks.noun} page={page} onPageChange={setPage} pageSize={pageSize} onPageSizeChange={setPageSize} label={`${networks.title} pages`} />}
    </section>
  );
}

/** One data version's tissue networks: what the files hold, any bulk archives and script, then every tissue's files. */
export function TissueNetworkFiles({ networks }: { networks: TissueNetworks }) {
  const headingId = useId();
  return (
    <section className="downloads-group" aria-labelledby={headingId}>
      <div className="downloads-section">
        <h2 id={headingId}>{networks.title}</h2>
        <FileFormats networks={networks} />
        {networks.note && <Alert>{networks.note}</Alert>}
      </div>
      {networks.bulkArchives && <BulkDownloads archives={networks.bulkArchives} />}
      {networks.script && <ScriptSection script={networks.script} />}
      <TissueTable key={networks.title} networks={networks} />
    </section>
  );
}
