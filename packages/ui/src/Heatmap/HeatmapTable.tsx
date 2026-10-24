import { Icon } from '../Icon/Icon';
import { Cell, HeaderCell, Table } from '../Table/Table';
import { ValueFormat } from '../Table/ValueFormat';
import { ViewAsTable } from '../Table/ViewAsTable';
import type { HeatmapColumn, HeatmapRow } from './Heatmap';
import { ScoreScale } from './ScoreScale';
import './HeatmapTable.css';

const values = new ValueFormat();

export interface HeatmapTableProps {
  summary: string;
  scale: ScoreScale;
  columns: readonly HeatmapColumn[];
  rows: readonly HeatmapRow[];
  rowHeader: string;
  decimals: number;
  columnName: (column: HeatmapColumn) => string;
}

/** The heatmap's values behind View as table: every cell with its row and column, the first column and header row pinned, each value to the same decimals. */
export function HeatmapTable({ summary, scale, columns, rows, rowHeader, decimals, columnName }: HeatmapTableProps) {
  const format = (value: number) => values.decimal(value, decimals);
  const pastEnd = rows.some((row) => row.values.some((value) => value !== null && scale.pastEnd(value) !== undefined));
  return (
    <ViewAsTable className="heatmap-table">
      <Table caption={summary} density="compact" pinFirstColumn>
        <thead>
          <tr>
            <HeaderCell>{rowHeader}</HeaderCell>
            {columns.map((column) => (
              <HeaderCell key={column.label} align="end">
                {column.href ? (
                  <a className="heatmap-table-link" href={column.href} target="_blank" rel="noopener noreferrer">
                    {columnName(column)}
                    <Icon name="external-link" size={16} label="opens in a new tab" />
                  </a>
                ) : (
                  columnName(column)
                )}
              </HeaderCell>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id ?? row.label}>
              <Cell rowHeader title={row.label}>
                <span className="heatmap-table-label">{row.label}</span>
              </Cell>
              {row.values.map((value, c) => (
                <Cell key={columns[c]?.label ?? c} type="number">
                  <HeatmapValue value={value} scale={scale} format={format} />
                </Cell>
              ))}
            </tr>
          ))}
        </tbody>
      </Table>
      {pastEnd && <p className="heatmap-table-note">* Past the end of the legend, so the heatmap draws it in the end color.</p>}
    </ViewAsTable>
  );
}

// A value past the legend keeps one line: a visible asterisk, with the legend end in words for screen readers.
function HeatmapValue({ value, scale, format }: { value: number | null; scale: ScoreScale; format: (value: number) => string }) {
  const end = value === null ? undefined : scale.pastEnd(value);
  if (value === null || end === undefined) return scale.describe(value, format);
  return (
    <>
      {format(value)}
      <span aria-hidden="true">*</span>
      <span className="visually-hidden">, past the end of the legend ({ScoreScale.number(end)})</span>
    </>
  );
}
