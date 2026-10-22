import { Fragment, useId, useState } from 'react';
import { Badge } from '../Badge/Badge';
import { Icon } from '../Icon/Icon';
import { Skeleton } from '../Skeleton/Skeleton';
import { Cell, HeaderCell, ScoreCell, Table } from '../Table/Table';
import './Results.css';

export interface Publication {
  title: string;
  authors: string;
  journal: string;
  href?: string;
}

export interface AnnotationEvidence {
  source: string;
  code: string;
  meaning: string;
  /** Missing for sources without a paper, such as electronic annotations (IEA). */
  publication?: Publication;
}

export interface RankedAnnotation {
  name: string;
  identifier: string;
  confidence: number;
  /** One confidence per gene when the table has a column per gene; null where a gene has none. */
  confidences?: readonly (number | null)[];
  sources?: number;
  /** Undefined while the evidence loads. */
  evidence?: readonly AnnotationEvidence[];
}

export interface RankedAnnotationTableProps {
  caption: string;
  termLabel: string;
  scoreLabel: string;
  /** Column headers for several genes, such as "IL1B confidence"; they replace the single score column. */
  scoreLabels?: readonly string[];
  rows: readonly RankedAnnotation[];
  defaultExpanded?: readonly string[];
  /** For drawers: the identifier sits under the term instead of in its own column. */
  narrow?: boolean;
}

const sourceCount = (count: number) => `${count} ${count === 1 ? 'source' : 'sources'}`;

export function RankedAnnotationTable({ caption, termLabel, scoreLabel, scoreLabels = [scoreLabel], rows, defaultExpanded = [], narrow = false }: RankedAnnotationTableProps) {
  const columns = scoreLabels.length + (narrow ? 2 : 3);
  const id = useId();
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const toggle = (name: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  return (
    <Table caption={caption} density="compact" {...(narrow && { className: 'annotation-table-narrow' })} columnWidths={narrow ? ['auto', ...scoreLabels.map(() => '128px'), '120px'] : ['auto', '180px', ...scoreLabels.map(() => '200px'), '200px']}>
      <thead>
        <tr>
          <HeaderCell>{termLabel}</HeaderCell>
          {!narrow && <HeaderCell>Identifier</HeaderCell>}
          {scoreLabels.map((label) => (
            <HeaderCell key={label} align="end">
              {label}
            </HeaderCell>
          ))}
          <HeaderCell>Evidence</HeaderCell>
        </tr>
      </thead>
      <tbody>
        {rows.map((row, index) => {
          const open = expanded.has(row.name);
          const panelId = `${id}-${index}`;
          const evidence = row.evidence ?? [];
          const sources = row.sources ?? evidence.length;
          return (
            <Fragment key={row.identifier}>
              <tr>
                <Cell rowHeader wrap={narrow}>
                  {sources > 0 ? (
                    <button type="button" className="annotation-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => toggle(row.name)}>
                      <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} />
                      {row.name}
                    </button>
                  ) : (
                    <span className="annotation-name">{row.name}</span>
                  )}
                  {narrow && <span className="annotation-identifier">{row.identifier}</span>}
                </Cell>
                {!narrow && <Cell type="id">{row.identifier}</Cell>}
                {(row.confidences ?? [row.confidence]).map((value, column) => (
                  <ScoreCell key={column} value={value} />
                ))}
                <Cell wrap={narrow}>
                  {sources > 0 ? (
                    <span className="annotation-evidence">
                      <Badge size="small">Experimental</Badge>
                      {sourceCount(sources)}
                    </span>
                  ) : (
                    'Predicted'
                  )}
                </Cell>
              </tr>
              {sources > 0 && (
                <tr id={panelId} className="annotation-panel" hidden={!open}>
                  <td colSpan={columns} aria-busy={row.evidence === undefined || undefined}>
                    {row.evidence === undefined ? (
                      <span className="annotation-loading">
                        Loading evidence
                        <Skeleton width="60%" />
                      </span>
                    ) : evidence.length === 0 ? (
                      <span className="annotation-loading">No evidence is listed for this annotation.</span>
                    ) : (
                    <ul className="annotation-publications" aria-label={`Evidence for ${row.name}`}>
                      {evidence.map((item, index) => (
                        <li key={`${index}-${item.source}-${item.code}`}>
                          <span>{item.source}</span>
                          {item.code && (
                            <span className="annotation-code">
                              <Badge size="small">{item.code}</Badge>
                              {item.meaning}
                            </span>
                          )}
                          {item.publication ? (
                            <span className="annotation-citation">
                              {item.publication.href ? <a href={item.publication.href}>{item.publication.title}</a> : <strong>{item.publication.title}</strong>}
                              <span>{item.publication.authors}</span>
                              <span>{item.publication.journal}</span>
                            </span>
                          ) : (
                            <span className="annotation-citation">No publication listed</span>
                          )}
                        </li>
                      ))}
                    </ul>
                    )}
                  </td>
                </tr>
              )}
            </Fragment>
          );
        })}
      </tbody>
    </Table>
  );
}
