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
  publication: Publication;
}

export interface RankedAnnotation {
  name: string;
  identifier: string;
  confidence: number;
  /** One confidence per gene when the table has a column per gene; null where a gene has none. */
  confidences?: readonly (number | null)[];
  sources?: number;
  /** Undefined while the evidence loads; empty when the sources list no publication. */
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
}

const sourceCount = (count: number) => `${count} ${count === 1 ? 'source' : 'sources'}`;

export function RankedAnnotationTable({ caption, termLabel, scoreLabel, scoreLabels = [scoreLabel], rows, defaultExpanded = [] }: RankedAnnotationTableProps) {
  const columns = scoreLabels.length + 3;
  const id = useId();
  const [expanded, setExpanded] = useState(() => new Set(defaultExpanded));
  const toggle = (name: string) =>
    setExpanded((current) => {
      const next = new Set(current);
      if (!next.delete(name)) next.add(name);
      return next;
    });

  return (
    <Table caption={caption} density="compact" columnWidths={['auto', '180px', ...scoreLabels.map(() => '200px'), '200px']}>
      <thead>
        <tr>
          <HeaderCell>{termLabel}</HeaderCell>
          <HeaderCell>Identifier</HeaderCell>
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
                <Cell rowHeader>
                  {sources > 0 ? (
                    <button type="button" className="annotation-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => toggle(row.name)}>
                      <Icon name={open ? 'chevron-down' : 'chevron-right'} size={16} />
                      {row.name}
                    </button>
                  ) : (
                    <span className="annotation-name">{row.name}</span>
                  )}
                </Cell>
                <Cell type="id">{row.identifier}</Cell>
                {(row.confidences ?? [row.confidence]).map((value, column) => (
                  <ScoreCell key={column} value={value} />
                ))}
                <Cell>
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
                      <span className="annotation-loading">The sources list no publication for this annotation.</span>
                    ) : (
                    <ul className="annotation-publications" aria-label={`Evidence for ${row.name}`}>
                      {evidence.map((item, index) => (
                        <li key={`${index}-${item.publication.title}`}>
                          <span>{item.source}</span>
                          <span className="annotation-code">
                            <Badge size="small">{item.code}</Badge>
                            {item.meaning}
                          </span>
                          <span className="annotation-citation">
                            {item.publication.href ? <a href={item.publication.href}>{item.publication.title}</a> : <strong>{item.publication.title}</strong>}
                            <span>{item.publication.authors}</span>
                            <span>{item.publication.journal}</span>
                          </span>
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
