import { useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type PointerEvent } from 'react';
import { DataTooltip } from '../Tooltip/DataTooltip';
import { HeatmapCell } from './HeatmapCell';
import { LegendStepped } from './LegendStepped';
import { ScoreScale, type ScaleSpec } from './ScoreScale';
import './SubstitutionMap.css';

export interface SubstitutionColumn {
  position: number;
  /** The sequence's own base at this position. */
  reference: string;
  /** Each substituted base's value; the reference has none. */
  values: Readonly<Record<string, number>>;
}

export interface SubstitutionMapProps {
  /** Bases in the whole sequence. */
  length: number;
  /** The first position shown, and the window's size. */
  start: number;
  windowSize: number;
  onStart: (start: number) => void;
  /** The window's positions, in order from start. */
  columns: readonly SubstitutionColumn[];
  /** The strongest absolute change in each run of bases along the whole sequence, for the overview strip. */
  overview: readonly number[];
  selected: number;
  onSelect: (position: number) => void;
  scale: ScaleSpec;
  /** Where position 0 sits on the genome, so the panel can name a coordinate such as chr1:109,817,590. */
  genome?: { chromosome: string; start: number } | undefined;
  /** Under the detail panel's values, such as what the value measures. */
  note: string;
  bases?: readonly string[] | undefined;
}

const number = new Intl.NumberFormat('en-US');
const cellStep = 11;
const labelEvery = 10;

export function SubstitutionMap({ length, start, windowSize, onStart, columns, overview, selected, onSelect, scale: spec, genome, note, bases = ['A', 'C', 'G', 'T'] }: SubstitutionMapProps) {
  const id = useId();
  const scale = useMemo(() => new ScoreScale(spec), [spec]);
  const strip = useRef<HTMLDivElement>(null);
  const grid = useRef<HTMLDivElement>(null);
  const [focus, setFocus] = useState<readonly [number, number]>([0, Math.max(0, selected - start)]);
  const [hover, setHover] = useState<readonly [number, number] | null>(null);
  const body = useRef<HTMLDivElement>(null);
  const [tipAt, setTipAt] = useState<{ x: number; y: number } | null>(null);
  // The tooltip lives outside the scrolling plot, so it is placed from the cell's position on screen.
  const showTip = (cell: HTMLElement, at: readonly [number, number]) => {
    const box = body.current?.getBoundingClientRect();
    const rect = cell.getBoundingClientRect();
    if (box) setTipAt({ x: rect.left - box.left + rect.width / 2, y: rect.bottom - box.top + 4 });
    setHover(at);
  };
  const last = Math.max(0, length - windowSize);
  const end = start + columns.length - 1;
  const strongest = Math.max(...overview, 0) || 1;
  // Two decimals always, as the detail panel lines values up: −4.63, −4.24, −4.00.
  const format = (value: number) => (Math.abs(value) < 0.005 ? '0.00' : `${value < 0 ? '−' : ''}${Math.abs(value).toFixed(2)}`);
  const clampStart = (value: number) => Math.min(last, Math.max(0, Math.round(value)));

  const moveWindow = (event: KeyboardEvent<HTMLDivElement>) => {
    const steps: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, PageUp: -windowSize, PageDown: windowSize };
    if (event.key === 'Home') onStart(0);
    else if (event.key === 'End') onStart(last);
    else if (steps[event.key] !== undefined) onStart(clampStart(start + (steps[event.key] ?? 0)));
    else return;
    event.preventDefault();
  };

  const dragFrom = (event: PointerEvent<HTMLDivElement>) => {
    const box = strip.current?.getBoundingClientRect();
    if (!box) return;
    onStart(clampStart(((event.clientX - box.left) / box.width) * length - windowSize / 2));
  };

  const moveFocus = (event: KeyboardEvent<HTMLElement>, row: number, column: number) => {
    const next: Record<string, readonly [number, number]> = {
      ArrowUp: [Math.max(0, row - 1), column],
      ArrowDown: [Math.min(bases.length - 1, row + 1), column],
      ArrowLeft: [row, Math.max(0, column - 1)],
      ArrowRight: [row, Math.min(columns.length - 1, column + 1)],
    };
    if (event.key === 'Enter' || event.key === ' ') {
      const position = columns[column]?.position;
      if (position !== undefined) onSelect(position);
      event.preventDefault();
      return;
    }
    const target = next[event.key];
    if (!target) return;
    event.preventDefault();
    setFocus(target);
    grid.current?.querySelector<HTMLElement>(`[data-cell="${target[0]}-${target[1]}"]`)?.focus();
  };

  const selectedColumn = columns.find((column) => column.position === selected);
  const selectedIndex = selected - start;
  const panelValues = selectedColumn ? bases.filter((base) => base !== selectedColumn.reference).map((base) => selectedColumn.values[base]) : [];
  const panelMax = Math.max(...panelValues.map((value) => Math.abs(value ?? 0)), 0) || 1;
  const hovered = hover ? columns[hover[1]] : undefined;
  const hoveredBase = hover ? bases[hover[0]] : undefined;
  const hoveredValue = hovered && hoveredBase ? hovered.values[hoveredBase] : undefined;

  return (
    <figure className="substitution-map" aria-labelledby={`${id}-title`}>
      <div className="substitution-map-head">
        <figcaption id={`${id}-title`} className="substitution-map-title">
          Positions {number.format(start)} to {number.format(end)} of {number.format(length)} bp
        </figcaption>
        <LegendStepped spec={spec} />
      </div>
      {/* The window is the strip's slider; pointer drags move it too. */}
      <div
        ref={strip}
        className="substitution-overview"
        aria-hidden="true"
        onPointerDown={(event) => {
          event.currentTarget.setPointerCapture(event.pointerId);
          dragFrom(event);
        }}
        onPointerMove={(event) => event.currentTarget.hasPointerCapture(event.pointerId) && dragFrom(event)}
      >
        {overview.map((value, index) => (
          <span key={index} className="substitution-overview-bar" style={{ blockSize: `${Math.max(8, Math.sqrt(value / strongest) * 100)}%` }} />
        ))}
      </div>
      <div
        className="substitution-window"
        role="slider"
        tabIndex={0}
        aria-label="Window along the sequence"
        aria-valuemin={0}
        aria-valuemax={last}
        aria-valuenow={start}
        aria-valuetext={`Positions ${number.format(start)} to ${number.format(end)}`}
        onKeyDown={moveWindow}
        style={{ insetInlineStart: `${(start / length) * 100}%`, inlineSize: `${(windowSize / length) * 100}%` } as CSSProperties}
      />
      <div ref={body} className="substitution-body">
        <div className="substitution-plot" style={{ '--substitution-columns': columns.length } as CSSProperties}>
          <div className="substitution-ruler" aria-hidden="true">
            {columns.map((column) => (
              <span key={column.position}>{column.position % labelEvery === 0 ? number.format(column.position) : ''}</span>
            ))}
          </div>
          <div className="substitution-reference" aria-hidden="true">
            {columns.map((column) => (
              <span key={column.position}>{column.reference}</span>
            ))}
          </div>
          <div ref={grid} role="grid" aria-label={`Substitutions at positions ${number.format(start)} to ${number.format(end)}`} className="substitution-grid">
            {bases.map((base, row) => (
              <div role="row" key={base} className="substitution-row">
                <span role="rowheader" className="substitution-base">
                  {base}
                </span>
                {columns.map((column, index) => {
                  const value = column.values[base];
                  const isReference = base === column.reference;
                  const step = value === undefined ? null : scale.step(value);
                  return (
                    <HeatmapCell
                      key={column.position}
                      role="gridcell"
                      color={isReference || step === null ? null : scale.color(step)}
                      tabIndex={focus[0] === row && focus[1] === index ? 0 : -1}
                      data-cell={`${row}-${index}`}
                      className={isReference ? 'substitution-cell is-reference' : 'substitution-cell'}
                      aria-label={isReference ? `Position ${number.format(column.position)}, ${base}: the reference base` : `Position ${number.format(column.position)}, ${column.reference} to ${base}: ${value === undefined ? 'not scored' : format(value)}`}
                      aria-selected={column.position === selected}
                      onClick={() => onSelect(column.position)}
                      onKeyDown={(event) => moveFocus(event, row, index)}
                      onPointerEnter={(event) => showTip(event.currentTarget, [row, index])}
                      onPointerLeave={() => setHover(null)}
                      onFocus={(event) => {
                        setFocus([row, index]);
                        showTip(event.currentTarget, [row, index]);
                      }}
                      onBlur={() => setHover(null)}
                    />
                  );
                })}
              </div>
            ))}
            {selectedColumn && <span className="substitution-selected" aria-hidden="true" style={{ insetInlineStart: `calc(var(--substitution-label) + ${1 + selectedIndex * cellStep}px)` } as CSSProperties} />}
          </div>

        </div>
        {hover && tipAt && hovered && hoveredBase && (
          <DataTooltip
            id={`${id}-tip`}
            className="substitution-tip"
            title={`Position ${number.format(hovered.position)}`}
            subtitle={hoveredBase === hovered.reference ? `Reference ${hoveredBase}` : `${hovered.reference} to ${hoveredBase}`}
            rows={[[spec.title, hoveredValue === undefined ? 'Reference' : format(hoveredValue)]]}
            position={tipAt}
          />
        )}
        {selectedColumn && (
          <section className="substitution-detail" aria-labelledby={`${id}-detail`}>
            <h3 id={`${id}-detail`}>Position {number.format(selectedColumn.position)}</h3>
            <p className="substitution-detail-where">
              {genome ? `${genome.chromosome}:${number.format(genome.start + selectedColumn.position)} · ` : ''}reference {selectedColumn.reference}
            </p>
            <dl>
              {bases.map((base) => {
                const value = selectedColumn.values[base];
                return (
                  <div key={base}>
                    <dt>{base}</dt>
                    {base === selectedColumn.reference || value === undefined ? (
                      <dd className="substitution-detail-reference">Reference</dd>
                    ) : (
                      <dd>
                        <span className="substitution-detail-bar" style={{ inlineSize: `${(Math.abs(value) / panelMax) * 100}%`, '--cell-color': `var(${scale.color(scale.step(value) ?? 4)})` } as CSSProperties} />
                        <span className="substitution-detail-value">{format(value)}</span>
                      </dd>
                    )}
                  </div>
                );
              })}
            </dl>
            <p className="substitution-detail-note">{note}</p>
          </section>
        )}
      </div>
    </figure>
  );
}
