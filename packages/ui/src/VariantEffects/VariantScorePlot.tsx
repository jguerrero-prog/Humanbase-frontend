import { brushX, type BrushBehavior, type D3BrushEvent } from 'd3-brush';
import { scaleLinear, type ScaleLinear } from 'd3-scale';
import { select } from 'd3-selection';
import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type RefObject } from 'react';
import { genomeCommand } from '../GenomeBrowser/genomeBrowserKeys';
import { useLatest } from '../hooks/useLatest';
import { useWidth } from '../hooks/useWidth';
import { DataTooltip } from '../Tooltip/DataTooltip';
import { placeNearPoint } from '../Tooltip/placement';
import { clampWindow, windowShowing, zoomStep, zoomWindow } from './plotWindow';
import { bandColor, pointColor, rankBandColor, type PlotColorBy } from './plotColors';
import { ScorePlotLayout, type Domain, type PlotBy, type PlotPoint } from './ScorePlotLayout';
import { variantLabel, variantName, variantScore, type Variant, type VariantScore } from './Variant';
import './VariantEffects.css';

export interface VariantScorePlotProps {
  variants: readonly Variant[];
  score: VariantScore;
  /** Genome lays variants out along the chromosomes; Rank sorts them by score. */
  by?: PlotBy;
  selected?: string | undefined;
  onSelect?: ((id: string) => void) | undefined;
  /** Points take their chromosome's color, or on Sei, their sequence class group's. */
  colorBy?: PlotColorBy;
  summary: string;
}

// humanbase.io's geometry: a 250px plot, points between 18 and 232, and a 34px overview under the axis title.
const fallbackWidth = 670;
const left = 48;
const right = 1;
const plotHeight = 250;
const scoreRange = [232, 18];
const overviewTop = 276;
const overviewHeight = 34;
const height = overviewTop + overviewHeight;
const pointRadius = 6;
const tooltipSize = { width: 240, height: 120 };

const colorStyle = (token: string) => ({ '--point-color': `var(${token})` }) as CSSProperties;

interface Scales {
  x: ScaleLinear<number, number>;
  y: ScaleLinear<number, number>;
}

/** humanbase.io's variant score plot: each variant by genome position or score rank, an overview strip with a brush to zoom, and the page's selected variant ringed. */
export function VariantScorePlot({ variants, score, by = 'genome', selected, onSelect, colorBy = 'chromosome', summary }: VariantScorePlotProps) {
  const id = useId().replace(/[^\w-]/g, '');
  const [box, measured] = useWidth();
  const width = measured || fallbackWidth;
  const plotWidth = Math.max(width - left - right, 1);
  const layout = useMemo(() => ScorePlotLayout.of(variants, score.key, by), [variants, score.key, by]);
  const full = layout.domain(plotWidth);
  const view = `${by} ${score.key}`;
  const [zoom, setZoom] = useState<{ view: string; window: Domain }>();
  const visible = zoom?.view === view ? clampWindow(zoom.window, full, plotWidth) : full;
  const setWindow = (next: Domain) => setZoom({ view, window: clampWindow(next, full, plotWidth) });
  const scales: Scales = {
    x: scaleLinear().domain(visible).range([0, plotWidth]),
    y: scaleLinear().domain(layout.scoreDomain()).range(scoreRange),
  };

  const points = layout.points;
  const chosen = points.findIndex((point) => point.variant.id === selected);
  const [focused, setFocused] = useState<number>();
  const [hovered, setHovered] = useState<number>();
  const [focusVisible, setFocusVisible] = useState(false);
  const current = focused !== undefined && focused < points.length ? focused : Math.max(chosen, 0);
  const shown = hovered ?? (focusVisible ? current : undefined);
  const tip = shown === undefined ? undefined : points[shown];

  const svg = useRef<SVGSVGElement>(null);
  useWheelZoom(svg, (fraction, zoomIn) => setWindow(zoomWindow(visible, full, visible[0] + fraction * (visible[1] - visible[0]), zoomIn ? zoomStep : 1 / zoomStep, plotWidth)));

  const focusPoint = (index: number) => {
    const point = points[index];
    if (!point) return;
    setFocused(index);
    setWindow(windowShowing(visible, full, point.x, plotWidth));
    svg.current?.querySelector<SVGCircleElement>(`[data-point="${index}"]`)?.focus();
  };
  const onKeyDown = (event: KeyboardEvent<SVGCircleElement>, index: number) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      const variant = points[index]?.variant;
      if (variant) onSelect?.(variant.id);
      return;
    }
    if (event.key === 'Escape') return setFocusVisible(false);
    const moves: Record<string, number> = { Home: 0, End: points.length - 1 };
    const command = genomeCommand(event);
    if (command === 'moveLeft' || command === 'previousVariant') moves[event.key] = Math.max(0, index - 1);
    if (command === 'moveRight' || command === 'nextVariant') moves[event.key] = Math.min(points.length - 1, index + 1);
    const next = moves[event.key];
    if (next !== undefined) {
      event.preventDefault();
      focusPoint(next);
      return setFocusVisible(true);
    }
    if (command === 'zoomIn' || command === 'zoomOut') {
      event.preventDefault();
      setWindow(zoomWindow(visible, full, points[index]?.x ?? 0, command === 'zoomIn' ? zoomStep : 1 / zoomStep, plotWidth));
    }
  };

  const tipPlace = tip && placeNearPoint({ x: left + scales.x(tip.x), y: scales.y(tip.y) }, tooltipSize, { width, height });
  const viewBox = `0 0 ${width} ${height}`;

  return (
    <figure className="variant-plot" aria-labelledby={`${id}-summary`}>
      <div ref={box} className="variant-plot-body">
        <svg ref={svg} viewBox={viewBox} {...(measured && { width, height })} focusable="false">
          <PlotAxes layout={layout} scales={scales} visible={visible} plotWidth={plotWidth} by={by} scoreLabel={score.label} />
          <defs>
            <clipPath id={`${id}-clip`}>
              <rect width={plotWidth} height={plotHeight} />
            </clipPath>
          </defs>
          <g transform={`translate(${left} 0)`}>
            <g clipPath={`url(#${id}-clip)`} role="group" aria-label={`${score.label} of each variant`} aria-describedby={`${id}-keys`}>
              {points.map((point, index) => (
                <circle
                  key={point.variant.id}
                  data-point={index}
                  className="variant-plot-point"
                  style={colorStyle(pointColor(point.variant, colorBy))}
                  cx={scales.x(point.x)}
                  cy={scales.y(point.y)}
                  r={pointRadius}
                  role="button"
                  tabIndex={index === current ? 0 : -1}
                  aria-label={`${variantLabel(point.variant)}, ${variantName(point.variant)}, ${score.label} ${variantScore(point.variant, score.key)}`}
                  aria-pressed={index === chosen}
                  aria-describedby={shown === index ? `${id}-tip` : undefined}
                  onPointerEnter={() => setHovered(index)}
                  onPointerLeave={() => setHovered(undefined)}
                  onClick={() => onSelect?.(point.variant.id)}
                  onKeyDown={(event) => onKeyDown(event, index)}
                  onFocus={() => setFocused(index)}
                  onKeyUp={(event) => event.key === 'Tab' && setFocusVisible(true)}
                  onBlur={() => setFocusVisible(false)}
                />
              ))}
              {points[chosen] && <circle className="variant-plot-selected" cx={scales.x(points[chosen].x)} cy={scales.y(points[chosen].y)} r="10" aria-hidden="true" />}
            </g>
            {tip && <HoverMark x={scales.x(tip.x)} y={scales.y(tip.y)} />}
          </g>
          <Overview layout={layout} full={full} visible={visible} plotWidth={plotWidth} colorBy={colorBy} selected={points[chosen]} onWindow={setWindow} />
        </svg>
        {tip && tipPlace && (
          <DataTooltip id={`${id}-tip`} title={variantLabel(tip.variant)} subtitle={variantName(tip.variant)} rows={[[score.label, variantScore(tip.variant, score.key)]]} hint={tip.variant.id === selected ? 'Selected' : 'Click to select'} position={tipPlace} />
        )}
      </div>
      <p id={`${id}-keys`} className="visually-hidden">
        Arrow keys move between variants, Enter selects, plus and minus zoom.
      </p>
      <figcaption id={`${id}-summary`} className="variant-plot-summary">
        {summary}
      </figcaption>
    </figure>
  );
}

interface PlotAxesProps {
  layout: ScorePlotLayout;
  scales: Scales;
  visible: Domain;
  plotWidth: number;
  by: PlotBy;
  scoreLabel: string;
}

function PlotAxes({ layout, scales, visible, plotWidth, by, scoreLabel }: PlotAxesProps) {
  const xTicks = ScorePlotLayout.ticks(visible);
  const yTicks = scales.y.ticks(5);
  const format = scales.y.tickFormat(5);
  return (
    <g aria-hidden="true">
      <g transform={`translate(${left} 0)`}>
        {yTicks.map((tick) => (
          <g key={`y${tick}`}>
            <line className="variant-plot-grid" x1="0" x2={plotWidth} y1={scales.y(tick)} y2={scales.y(tick)} />
            <text className="variant-plot-tick" x="-6" y={scales.y(tick) + 4} textAnchor="end">
              {format(tick)}
            </text>
          </g>
        ))}
        {xTicks.map((tick, index) => (
          <text key={`x${index}`} className="variant-plot-tick" x={scales.x(tick)} y={plotHeight} textAnchor="middle">
            {layout.tickLabel(tick, index)}
          </text>
        ))}
        <text className="variant-plot-title" x={plotWidth / 2} y={overviewTop - 8} textAnchor="middle">
          {by === 'genome' ? 'Genome' : 'Rank'}
        </text>
      </g>
      <text className="variant-plot-title" transform={`translate(14 ${plotHeight / 2}) rotate(-90)`} textAnchor="middle">
        {scoreLabel}
      </text>
    </g>
  );
}

function HoverMark({ x, y }: { x: number; y: number }) {
  return (
    <g className="variant-plot-hover" aria-hidden="true">
      <path d={`M${x},0V${Math.max(y - 12, 0)}M${x},${plotHeight}V${Math.min(y + 12, plotHeight)}`} />
      <circle cx={x} cy={y} r="7" />
    </g>
  );
}

interface OverviewProps {
  layout: ScorePlotLayout;
  full: Domain;
  visible: Domain;
  plotWidth: number;
  colorBy: PlotColorBy;
  selected: PlotPoint | undefined;
  onWindow: (window: Domain) => void;
}

/** Every variant in small, over chromosome bands at half strength, with the brush that sets the plot's window. */
function Overview({ layout, full, visible, plotWidth, colorBy, selected, onWindow }: OverviewProps) {
  const x = scaleLinear().domain(full).range([0, plotWidth]);
  const y = scaleLinear().domain(layout.scoreDomain()).range([overviewHeight - 4, 4]);
  const bands = layout.by === 'genome' ? layout.bands(full).map((band) => ({ key: band.region.chromosome, from: band.from, to: band.to, color: bandColor(band.region.chromosome, band.index, colorBy) })) : [{ key: 'rank', from: full[0], to: full[1], color: rankBandColor }];
  const [start, end] = [x(visible[0]), x(visible[1])];
  const brushArea = useBrush(plotWidth, [start, end], (pixels) => onWindow([x.invert(pixels[0]), x.invert(pixels[1])]));
  return (
    <g transform={`translate(${left} ${overviewTop})`}>
      <g aria-hidden="true">
        {bands.map((band) => (
          <rect key={band.key} className="variant-plot-band" style={colorStyle(band.color)} x={x(band.from)} width={Math.max(x(band.to) - x(band.from), 0)} height={overviewHeight} />
        ))}
        {layout.points.map((point) => (
          <circle key={point.variant.id} className="variant-plot-overview-point" style={colorStyle(pointColor(point.variant, colorBy))} cx={x(point.x)} cy={y(point.y)} r="2" />
        ))}
        {selected && <circle className="variant-plot-overview-selected" cx={x(selected.x)} cy={y(selected.y)} r="4" />}
        <rect className="variant-plot-window" x={start} width={Math.max(end - start, 0)} height={overviewHeight} />
        <rect className="variant-plot-handle" x={start} width="3" height={overviewHeight} />
        <rect className="variant-plot-handle" x={end - 3} width="3" height={overviewHeight} />
      </g>
      <g ref={brushArea} className="variant-plot-brush" aria-hidden="true" />
    </g>
  );
}

/** d3's brush takes the pointer; the window it sets is drawn by the overview. */
function useBrush(width: number, selection: Domain, onBrush: (pixels: Domain) => void) {
  const area = useRef<SVGGElement>(null);
  const brush = useRef<BrushBehavior<unknown>>(null);
  const latest = useLatest({ selection, onBrush });
  useEffect(() => {
    const node = area.current;
    if (!node) return;
    const behavior = brushX()
      .extent([
        [0, 0],
        [width, overviewHeight],
      ])
      .handleSize(3)
      .on('brush end', (event: D3BrushEvent<unknown>) => {
        if (!event.sourceEvent) return;
        const pixels = event.selection as [number, number] | null;
        if (pixels && pixels[1] - pixels[0] > 0) return latest.current.onBrush(pixels);
        if (event.type === 'end') select(node).call(behavior.move, [...latest.current.selection]);
      });
    brush.current = behavior;
    select(node).call(behavior);
    return () => {
      select(node).on('.brush', null).selectAll('*').remove();
    };
  }, [width, latest]);
  const [start, end] = selection;
  useEffect(() => {
    const node = area.current;
    if (node && brush.current) select(node).call(brush.current.move, [start, end]);
  }, [start, end, width]);
  return area;
}

/** Wheel zoom around the pointer, as a fraction across the plot; its own listener, since React's wheel events can't keep the page from scrolling. */
function useWheelZoom(target: RefObject<SVGSVGElement | null>, onZoom: (fraction: number, zoomIn: boolean) => void) {
  const latest = useLatest(onZoom);
  useEffect(() => {
    const element = target.current;
    if (!element) return;
    const wheel = (event: WheelEvent) => {
      const frame = element.getBoundingClientRect();
      const scale = frame.width ? element.viewBox.baseVal.width / frame.width : 1;
      const fraction = ((event.clientX - frame.left) * scale - left) / (element.viewBox.baseVal.width - left - right);
      event.preventDefault();
      latest.current(Math.min(Math.max(fraction, 0), 1), event.deltaY < 0);
    };
    element.addEventListener('wheel', wheel, { passive: false });
    return () => element.removeEventListener('wheel', wheel);
  }, [target, latest]);
}
