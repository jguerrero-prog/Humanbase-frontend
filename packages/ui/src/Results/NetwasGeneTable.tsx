import type { CSSProperties } from 'react';
import { Cell, HeaderCell, Table, TableMessage } from '../Table/Table';
import { ValueFormat } from '../Table/ValueFormat';
import './Results.css';
import { useLinkHref } from '../hooks/useLinkHref';

export interface NetwasGeneRow {
  rank: number;
  symbol: string;
  name?: string | undefined;
  label: 1 | -1 | 0;
  gwas: string;
  score: number;
  /** null when the gene isn't in Humanbase, so there is no network to open; undefined while that is still being looked up. */
  href?: string | null | undefined;
  /** The gene in the genome browser, where the page links there. */
  genomeHref?: string | undefined;
}

export interface NetwasGeneTableProps {
  caption: string;
  rows: readonly NetwasGeneRow[];
  empty?: { title: string; text?: string };
}

const format = new ValueFormat();
const scoreText = (score: number) => (score < 0 ? format.signed(score, 3) : score.toFixed(3));
const rawLabel = (label: NetwasGeneRow['label']) => (label < 0 ? '−1' : String(label));

export function NetwasScore({ score }: { score: number }) {
  const extent = { '--extent': `${Math.min(1, Math.abs(score)) * 50}%` } as CSSProperties;
  return (
    <span className="netwas-score">
      <span className="netwas-score-track" aria-hidden="true">
        <span className="netwas-score-bar" data-sign={score < 0 ? 'negative' : 'positive'} style={extent} />
      </span>
      {scoreText(score)}
    </span>
  );
}

export function NetwasGeneTable({ caption, rows, empty = { title: 'No genes to show' } }: NetwasGeneTableProps) {
  const linkHref = useLinkHref();
  const genome = rows.some((row) => row.genomeHref);
  return (
    <Table caption={caption} density="compact" columnWidths={['64px', 'auto', '168px', '216px', genome ? '192px' : '152px']}>
      <thead>
        <tr>
          <HeaderCell align="end">Rank</HeaderCell>
          <HeaderCell>Gene</HeaderCell>
          <HeaderCell>In the GWAS</HeaderCell>
          <HeaderCell sort="descending">NetWAS score</HeaderCell>
          <HeaderCell>
            <span className="visually-hidden">{genome ? 'Links' : 'Open in Networks'}</span>
          </HeaderCell>
        </tr>
      </thead>
      <tbody>
        {rows.length === 0 ? (
          <TableMessage columns={5} {...empty} />
        ) : (
          rows.map((row) => (
            <tr key={row.symbol}>
              <Cell type="number">{row.rank}</Cell>
              <Cell rowHeader type="gene">
                <span className="result-gene">
                  <strong>{row.symbol}</strong>
                  {row.name && <span>{row.name}</span>}
                </span>
              </Cell>
              <Cell>
                {row.gwas} <span className="netwas-label">({rawLabel(row.label)})</span>
              </Cell>
              <Cell>
                <NetwasScore score={row.score} />
              </Cell>
              <Cell>
                <span className="netwas-gene-links">
                  {row.href ? (
                    <a href={linkHref(row.href)}>
                      Open in Networks <span className="visually-hidden">for {row.symbol}</span>
                    </a>
                  ) : (
                    row.href === null && <span className="netwas-no-network">Not in Humanbase</span>
                  )}
                  {row.genomeHref && (
                    <a href={linkHref(row.genomeHref)}>
                      View in genome browser <span className="visually-hidden">for {row.symbol}</span>
                    </a>
                  )}
                </span>
              </Cell>
            </tr>
          ))
        )}
      </tbody>
    </Table>
  );
}
