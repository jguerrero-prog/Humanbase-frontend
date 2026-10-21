import { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type MouseEvent, type PointerEvent } from 'react';
import { Icon } from '../Icon/Icon';
import { useDismiss } from '../List/useDismiss';
import { BreakableText } from '../Text/BreakableText';
import { DataTooltip } from '../Tooltip/DataTooltip';
import { placeNearPoint } from '../Tooltip/placement';
import { HeatmapCell } from './HeatmapCell';
import { LegendStepped } from './LegendStepped';
import { ScoreScale, type ScaleSpec } from './ScoreScale';

export interface HeatmapColumn {
  label: string;
  /** A genome position, drawn on the ruler instead of a rotated label. */
  position?: number;
  /** This column's place in a genome browser; the pinned tooltip and the table link to it. */
  href?: string;
  /** The column in words where the label is only a position, such as the variant chr1:2,232,996 C>T; the tooltip, table and screen readers use it. */
  name?: string;
}

/** What a cell's tooltip lists instead of its single value, such as every allele at a position. */
export interface HeatmapCellDetail {
  rows: readonly (readonly [label: string, value: string, note?: string])[];
  hint?: string;
}

export interface HeatmapRow {
  label: string;
  values: readonly (number | null)[];
  details?: readonly (HeatmapCellDetail | undefined)[];
}

export interface HeatmapAxis {
  title: string;
  /** The shared prefix, such as 150,226,000; ticks are offsets from it. */
  offset: number;
  ticks: readonly number[];
}

export interface HeatmapProps {
  title: string;
  summary: string;
  scale: ScaleSpec;
  columns: readonly HeatmapColumn[];
  rows: readonly HeatmapRow[];
  rowHeader: string;
  columnHeader: string;
  axis?: HeatmapAxis | undefined;
  decimals?: number | undefined;
  /** A cell to show as hovered at first, for documentation. */
  initialActive?: readonly [row: number, column: number] | undefined;
  /** Compact rows are 8px tall with labels hidden; the tooltip still works on every cell. */
  density?: 'full' | 'compact' | undefined;
  /** What the tooltip calls a cell's value; the legend title by default. */
  valueLabel?: string | undefined;
  /** Prints the value beside each cell, for a heatmap with a single column. */
  showValues?: boolean | undefined;
  /** Narrow cells are 8px wide, labelling every 20th position; auto narrows them when the columns wouldn't fit at full width. */
  columnWidth?: 'full' | 'auto' | 'narrow' | undefined;
  /** The center variant's column, outlined in ink, with a darker line to its position. */
  selectedColumn?: number | undefined;
  /** Makes each column's line to the ruler a button, such as one that centers the genome browser on that variant. */
  onColumnSelect?: ((column: number) => void) | undefined;
  /** Dragging across the cells reports each move's horizontal change in pixels; a drag never pins a tooltip. */
  onDrag?: ((dx: number) => void) | undefined;
}

type Cell = readonly [number, number];

const counts = new Intl.NumberFormat('en-US');
const cellWidth = 34;
const narrowWidth = 8;
const labelEvery = 20;
const hoverGrace = 300;
const dragStart = 4;
const switchDelay = 150;
const labelWidths = { min: 160, max: 360, share: 0.4 };

/** The row label column fits the longest label, within limits; longer labels wrap. */
function labelColumn(box: HTMLElement, labels: readonly string[]) {
  const sample = box.querySelector('.heatmap-row-label');
  const context = document.createElement('canvas').getContext('2d');
  if (!sample || !context) return labelWidths.min;
  const style = getComputedStyle(sample);
  context.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
  const widest = Math.ceil(Math.max(0, ...labels.map((label) => context.measureText(label).width)) + (Number.parseFloat(style.paddingInlineEnd) || 0));
  return Math.max(labelWidths.min, Math.min(widest, labelWidths.max, Math.floor(box.clientWidth * labelWidths.share)));
}

export function Heatmap({ title, summary, scale: spec, columns, rows, rowHeader, columnHeader, axis, decimals = 2, initialActive, density = 'full', valueLabel, showValues = false, columnWidth = 'full', selectedColumn, onColumnSelect, onDrag }: HeatmapProps) {
  const dragging = useRef<{ x: number; moved: boolean }>(undefined);
  const id = useId();
  const scale = useMemo(() => new ScoreScale(spec), [spec]);
  const plot = useRef<HTMLDivElement>(null);
  const figure = useRef<HTMLElement>(null);
  const [active, setActive] = useState<Cell | null>(initialActive ?? null);
  const [focus, setFocus] = useState<Cell>(initialActive ?? [0, 0]);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [pinned, setPinned] = useState(false);
  const tip = useRef<HTMLDivElement>(null);
  const hiding = useRef<ReturnType<typeof setTimeout>>(undefined);
  // A short grace lets the pointer cross from a cell onto its tooltip, as WCAG 1.4.13 asks.
  const hideSoon = () => {
    clearTimeout(hiding.current);
    hiding.current = setTimeout(() => setActive(null), hoverGrace);
  };
  // While a tooltip shows, switching to another cell waits briefly, so crossing cells on the way to the tooltip keeps it.
  const show = (cell: Cell) => {
    clearTimeout(hiding.current);
    if (!active) return setActive(cell);
    hiding.current = setTimeout(() => setActive(cell), switchDelay);
  };
  useEffect(() => () => clearTimeout(hiding.current), []);
  const unpin = useCallback(() => {
    setPinned(false);
    setActive(null);
  }, []);
  useDismiss(tip, pinned, unpin);
  useEffect(() => {
    if (!pinned) return;
    const closeOnEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      unpin();
      plot.current?.querySelector<HTMLElement>(`[data-cell="${focus[0]}-${focus[1]}"]`)?.focus();
    };
    document.addEventListener('keydown', closeOnEscape);
    return () => document.removeEventListener('keydown', closeOnEscape);
  }, [pinned, unpin, focus]);
  const [place, setPlace] = useState<{ x: number; y: number }>();
  const [fits, setFits] = useState(true);
  const [labelWidth, setLabelWidth] = useState(labelWidths.min);
  const narrow = columnWidth === 'narrow' || (columnWidth === 'auto' && !fits);
  const width = narrow ? narrowWidth : cellWidth;
  const format = (value: number) => ScoreScale.number(Number(value.toFixed(decimals)));
  const columnLabel = (column: HeatmapColumn) => (column.position === undefined ? column.label : counts.format(column.position));
  const columnName = (column: HeatmapColumn) => column.name ?? columnLabel(column);
  const labels = rows.map((row) => row.label).join('\n');
  const valueAt = ([row, column]: Cell) => rows[row]?.values[column] ?? null;

  useLayoutEffect(() => {
    const box = plot.current;
    if (!box) return;
    const fit = () => {
      const label = labelColumn(box, labels.split('\n'));
      const room = box.clientWidth - label;
      setLabelWidth(label);
      if (columnWidth === 'auto') setFits(room <= 0 || columns.length * (cellWidth + 1) <= room);
    };
    fit();
    void document.fonts?.ready.then(fit);
    if (typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(fit);
    observer.observe(box);
    return () => observer.disconnect();
  }, [columnWidth, columns.length, labels]);

  useLayoutEffect(() => {
    const box = figure.current;
    const cell = active && box?.querySelector<HTMLElement>(`[data-cell="${active[0]}-${active[1]}"]`);
    if (!box || !cell) return setPlace(undefined);
    const frame = box.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    const point = { x: rect.right - frame.left, y: rect.bottom - frame.top };
    const detail = active ? rows[active[0]]?.details?.[active[1]] : undefined;
    const size = { width: detail ? 320 : 240, height: 100 + (detail?.rows.length ?? 1) * 24 };
    setPlace(placeNearPoint(point, size, { width: box.clientWidth, height: Math.max(box.clientHeight, point.y + size.height + 8) }, 4));
  }, [active, rows]);

  const move = (event: KeyboardEvent<HTMLSpanElement>) => {
    const [row, column] = focus;
    const next: Record<string, Cell> = {
      ArrowUp: [Math.max(0, row - 1), column],
      ArrowDown: [Math.min(rows.length - 1, row + 1), column],
      ArrowLeft: [row, Math.max(0, column - 1)],
      ArrowRight: [row, Math.min(columns.length - 1, column + 1)],
      Home: [row, 0],
      End: [row, columns.length - 1],
    };
    if (event.key === 'Escape') return unpin();
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setActive(focus);
      return setPinned(true);
    }
    const target = next[event.key];
    if (!target) return;
    event.preventDefault();
    setPinned(false);
    setActive(target);
    setFocus(target);
    plot.current?.querySelector<HTMLElement>(`[data-cell="${target[0]}-${target[1]}"]`)?.focus();
  };

  const activeColumn = active?.[1];
  const activeValue = active ? valueAt(active) : null;
  const activeRow = active ? rows[active[0]] : undefined;
  const activeHeader = activeColumn === undefined ? undefined : columns[activeColumn];
  const activeDetail = activeColumn === undefined ? undefined : activeRow?.details?.[activeColumn];

  return (
    <figure ref={figure} className={['heatmap', density === 'compact' && 'heatmap-compact', narrow && 'heatmap-narrow', showValues && 'heatmap-with-values'].filter(Boolean).join(' ')} aria-labelledby={`${id}-title`}>
      <div className="heatmap-head">
        <figcaption>
          <p id={`${id}-title`} className="heatmap-title">
            {title}
          </p>
          <p className="heatmap-summary">{summary}</p>
        </figcaption>
        <LegendStepped spec={spec} highlighted={highlighted ?? (activeValue === null ? null : scale.step(activeValue))} onHighlight={setHighlighted} />
      </div>
      <div className="heatmap-plot" ref={plot} style={{ '--heatmap-columns': columns.length, '--heatmap-cell': `${width}px`, '--heatmap-label': `${labelWidth}px` } as CSSProperties}>
        {narrow && (
          <div className="heatmap-position-labels" aria-hidden="true">
            {columns.map((column, index) => (
              <span key={column.label}>{index % labelEvery === 0 ? columnLabel(column) : ''}</span>
            ))}
          </div>
        )}
        {!axis && !narrow && (
          <div className="heatmap-column-labels" aria-hidden="true">
            {columns.map((column) => (
              <span key={column.label}>{columnLabel(column)}</span>
            ))}
          </div>
        )}
        <div
          role="grid"
          aria-label={title}
          className={onDrag ? 'heatmap-grid heatmap-draggable' : 'heatmap-grid'}
          {...(onDrag && {
            onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
              if (event.button === 0) dragging.current = { x: event.clientX, moved: false };
            },
            onPointerMove: (event: PointerEvent<HTMLDivElement>) => {
              const drag = dragging.current;
              if (!drag) return;
              if (!(event.buttons & 1)) {
                dragging.current = undefined;
                return;
              }
              const dx = event.clientX - drag.x;
              if (!drag.moved && Math.abs(dx) < dragStart) return;
              if (!drag.moved) event.currentTarget.setPointerCapture?.(event.pointerId);
              drag.moved = true;
              drag.x = event.clientX;
              onDrag(dx);
            },
            onPointerUp: () => {
              if (!dragging.current?.moved) dragging.current = undefined;
            },
            // A drag ends in a click on the cell under the pointer; it shouldn't pin that cell's tooltip.
            onClickCapture: (event: MouseEvent<HTMLDivElement>) => {
              if (dragging.current?.moved) event.stopPropagation();
              dragging.current = undefined;
            },
          })}
        >
          {selectedColumn !== undefined && selectedColumn >= 0 && <span className="heatmap-selected-column" aria-hidden="true" style={{ '--heatmap-at': selectedColumn } as CSSProperties} />}
          {rows.map((row, r) => (
            <div role="row" key={row.label} className="heatmap-row">
              <span role="rowheader" className="heatmap-row-label">
                <BreakableText>{row.label}</BreakableText>
              </span>
              {row.values.map((value, c) => {
                const column = columns[c];
                const step = scale.step(value);
                const isActive = active?.[0] === r && active[1] === c;
                return (
                  <HeatmapCell
                    key={column?.label ?? c}
                    role="gridcell"
                    tabIndex={focus[0] === r && focus[1] === c ? 0 : -1}
                    data-cell={`${r}-${c}`}
                    data-state={isActive ? 'hover' : undefined}
                    color={step === null ? null : scale.color(step)}
                    outlined={highlighted !== null && step === highlighted}
                    aria-label={`${row.label}, ${column ? columnName(column) : ''}: ${scale.describe(value, format)}`}
                    onPointerEnter={() => !pinned && show([r, c])}
                    onPointerLeave={() => !pinned && hideSoon()}
                    onFocus={() => {
                      setFocus([r, c]);
                      if (!pinned) setActive([r, c]);
                    }}
                    onBlur={() => !pinned && setActive(null)}
                    onClick={() => {
                      setActive([r, c]);
                      setPinned(true);
                    }}
                    onKeyDown={move}
                  />
                );
              })}
              {showValues && (
                <span className="heatmap-value" aria-hidden="true">
                  {row.values[0] === null || row.values[0] === undefined ? '' : format(row.values[0])}
                </span>
              )}
            </div>
          ))}
        </div>
        {axis && !narrow && <PositionAxis axis={axis} columns={columns} active={activeColumn} selected={selectedColumn} onSelect={onColumnSelect} columnName={columnName} />}
      </div>
      {active && activeRow && place && (
        <DataTooltip
          ref={tip}
          pinned={pinned}
          onPointerEnter={() => clearTimeout(hiding.current)}
          onPointerLeave={() => !pinned && hideSoon()}
          {...(activeHeader?.href && { link: { label: 'Open in Genome Browser', href: activeHeader.href } })}
          id={`${id}-tip`}
          title={activeRow.label}
          {...(activeHeader && { subtitle: `${columnHeader} ${columnName(activeHeader)}` })}
          rows={activeDetail?.rows ?? [[valueLabel ?? spec.title, scale.describe(activeValue, format)]]}
          {...(activeDetail?.hint && { hint: activeDetail.hint })}
          position={place}
        />
      )}
      <details className="heatmap-table">
        <summary>View as table</summary>
        {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex -- the table scrolls sideways, so it takes focus for arrow-key scrolling */}
        <div className="heatmap-table-scroll" role="region" aria-label={`${title}, as a table`} tabIndex={0}>
          <table>
            <caption>{summary}</caption>
            <thead>
              <tr>
                <th scope="col">{rowHeader}</th>
                {columns.map((column) => (
                  <th scope="col" key={column.label}>
                    {column.href ? (
                      <a href={column.href} target="_blank" rel="noopener noreferrer">
                        {columnName(column)}
                        <Icon name="external-link" size={16} label="opens in a new tab" />
                      </a>
                    ) : (
                      columnName(column)
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.label}>
                  <th scope="row">{row.label}</th>
                  {row.values.map((value, c) => (
                    <td key={columns[c]?.label ?? c}>{scale.describe(value, format)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

interface PositionAxisProps {
  axis: HeatmapAxis;
  columns: readonly HeatmapColumn[];
  active: number | undefined;
  selected: number | undefined;
  onSelect: ((column: number) => void) | undefined;
  columnName: (column: HeatmapColumn) => string;
}

// A ruler of short offsets, with a line from each column to its position; with onSelect, each line is a button.
function PositionAxis({ axis, columns, active: hovered, selected, onSelect, columnName }: PositionAxisProps) {
  const [picking, setPicking] = useState<number>();
  const active = picking ?? hovered;
  const width = columns.length * (cellWidth + 1) - 1;
  const first = axis.ticks[0] ?? 0;
  const last = axis.ticks.at(-1) ?? 1;
  const x = (offset: number) => ((offset - first) / (last - first)) * width;
  const activePosition = active === undefined ? undefined : columns[active]?.position;
  return (
    <div className="heatmap-axis">
      {onSelect && (
        <div className="heatmap-axis-picks">
          {columns.map((column, index) =>
            index === selected ? null : (
              <button
                key={column.label}
                type="button"
                className="heatmap-axis-pick"
                style={{ '--heatmap-at': index } as CSSProperties}
                aria-label={`Center on ${columnName(column)}`}
                onClick={() => onSelect(index)}
                onPointerEnter={() => setPicking(index)}
                onPointerLeave={() => setPicking(undefined)}
                onFocus={() => setPicking(index)}
                onBlur={() => setPicking(undefined)}
              />
            ),
          )}
        </div>
      )}
      <svg width={width} height="64" viewBox={`0 0 ${width} 64`} aria-hidden="true">
        {columns.map((column, index) => {
          const position = column.position === undefined ? first : x(column.position - axis.offset);
          return <line key={column.label} className={index === active || index === selected ? 'connector connector-active' : 'connector'} x1={index * (cellWidth + 1) + cellWidth / 2} y1="0" x2={position} y2="28" />;
        })}
        <line className="ruler" x1="0" y1="34" x2={width} y2="34" />
        {columns.map((column) => column.position !== undefined && <line key={`v-${column.label}`} className="variant-tick" x1={x(column.position - axis.offset)} y1="28" x2={x(column.position - axis.offset)} y2="34" />)}
        {axis.ticks.map((tick) => (
          <g key={tick}>
            <line className="ruler" x1={x(tick)} y1="34" x2={x(tick)} y2="38" />
            <text x={x(tick)} y="52">
              {tick}
            </text>
          </g>
        ))}
      </svg>
      {activePosition !== undefined && (
        <span className="heatmap-axis-pill" aria-hidden="true" style={{ insetInlineStart: `${x(activePosition - axis.offset)}px` } as CSSProperties}>
          {counts.format(activePosition)}
        </span>
      )}
      <p className="heatmap-axis-title" aria-hidden="true">
        {axis.title}: {counts.format(axis.offset)} +
      </p>
    </div>
  );
}
