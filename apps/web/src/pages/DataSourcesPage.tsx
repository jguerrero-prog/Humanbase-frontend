import { dataEraFrom, dataEras, dataSourcesFor, dataSourcesPage, showIllustrations, type DataSection } from '@humanbase/hb';
import { Alert, ArticleHero, Cell, HeaderCell, Table, Tabs } from '@humanbase/ui';
import { useId } from 'react';
import { useSearchParams } from 'react-router';
import './DataSourcesPage.css';

function SourceSection({ title, description, columns, rows, note }: DataSection) {
  const headingId = useId();
  return (
    <section className="data-sources-section" aria-labelledby={headingId}>
      <div className="data-sources-heading">
        <h2 id={headingId}>{title}</h2>
        <p>{description}</p>
      </div>
      <Table caption={title} columnWidths={columns.map((column) => column.width)} minWidth="640px">
        <thead>
          <tr>
            {columns.map((column) => (
              <HeaderCell key={column.label} align={column.type === 'number' ? 'end' : 'start'}>
                {column.label}
              </HeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((cells) => (
            <tr key={String(cells[0])}>
              {cells.map((cell, index) => {
                const type = columns[index]?.type ?? 'text';
                return (
                  <Cell key={index} rowHeader={index === 0} type={type} wrap={type === 'text'}>
                    {cell}
                  </Cell>
                );
              })}
            </tr>
          ))}
        </tbody>
      </Table>
      {note && <Alert title={note.title}>{note.body}</Alert>}
    </section>
  );
}

/** humanbase.io/data: the external sources behind Humanbase, one tab per era. */
export function DataSourcesPage() {
  const [search, setSearch] = useSearchParams();
  const era = dataEraFrom(search.get('era'));
  const chooseEra = (next: string) => setSearch(dataEraFrom(next) === 'current' ? {} : { era: next }, { replace: true });

  return (
    <>
      <title>Data sources · Humanbase</title>
      <ArticleHero title={dataSourcesPage.title} lead={dataSourcesPage.lead} band={showIllustrations ? 'reads' : null} />
      <div className="data-sources">
        <Tabs label="Data era" tabs={dataEras} value={era} onChange={chooseEra}>
          <div className="data-sources-eras">
            {dataSourcesFor(era).map((section) => (
              <SourceSection key={section.title} {...section} />
            ))}
          </div>
        </Tabs>
      </div>
    </>
  );
}
