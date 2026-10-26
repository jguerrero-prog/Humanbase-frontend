import { useEffect, useId, useState, type PointerEvent } from 'react';
import { ScoreScale } from '../Heatmap/ScoreScale';
import { ValueFormat } from '../Table/ValueFormat';
import { BreakableText } from '../Text/BreakableText';
import { DataTooltip } from '../Tooltip/DataTooltip';
import { placeNearPoint } from '../Tooltip/placement';
import { zEffects, type EffectScale } from './EffectScale';
import './VariantEffects.css';

export interface FeatureValue {
  /** Names the point in its tooltip, such as Brain / AGO (ago_adult_brain.BA4). */
  label?: string | undefined;
  value: number;
}

export interface AllFeaturesPlotProps {
  /** Every feature's score for the selected variant, in any order. */
  values: readonly FeatureValue[];
  /** The strongest features to name on the plot, with their values. */
  labels?: readonly { label: string; value: number }[] | undefined;
  /** How many of the strongest are drawn as the heatmap's top rows. */
  marked?: number | undefined;
  summary: string;
  scale?: EffectScale | undefined;
}

const width = 970;
const height = 380;
const left = 56;
const bottom = 56;
const top = 16;
const plotWidth = width - left - 16;
const plotHeight = height - top - bottom;
const roundSteps = [1, 2, 2.5, 5, 10];
const valueFormat = new ValueFormat();
const tooltipSize = { width: 240, height: 80 };

/** An axis over the values in about four round steps, for a score without strength bins. */
function fittedAxis(low: number, high: number): { min: number; max: number; ticks: number[] } {
  const raw = (high - low || Math.abs(high) || 1) / 4;
  const power = 10 ** Math.floor(Math.log10(raw));
  const step = (roundSteps.find((size) => size * power >= raw) ?? 10) * power;
  const min = Math.floor(low / step) * step;
  const max = Math.ceil(high / step) * step;
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => Number((min + index * step).toPrecision(6)));
  return { min, max, ticks };
}

/** The z-score style axis: from 0 or the lowest whole value up to a multiple of the strong bin, ticked every 5. */
function binnedAxis(low: number, high: number, strong: number): { min: number; max: number; ticks: number[] } {
  const max = Math.max(strong, Math.ceil(high / strong) * strong);
  const min = Math.min(0, Math.floor(low));
  return { min, max, ticks: Array.from({ length: Math.floor(max / 5) + 1 }, (_, index) => index * 5) };
}

export function AllFeaturesPlot({ values, labels = [], marked = 20, summary, scale: effectScale = zEffects }: AllFeaturesPlotProps) {
  const scale = new ScoreScale(effectScale.legend);
  const id = useId();
  const [hovered, setHovered] = useState<{ index: number; scale: number }>();
  const sorted = [...values].sort((a, b) => a.value - b.value);
  const [low = 0, high = 0] = [sorted[0]?.value, sorted.at(-1)?.value];
  const { min, max, ticks: yTicks } = effectScale.bins ? binnedAxis(low, high, effectScale.bins.strong) : fittedAxis(Math.min(0, low), Math.max(0, high));
  const x = (rank: number) => left + ((rank - 1) / Math.max(sorted.length - 1, 1)) * plotWidth;
  const y = (value: number) => top + plotHeight - ((value - min) / (max - min || 1)) * plotHeight;
  const xTicks = [1, ...[50, 100, 150, 200].filter((tick) => tick < sorted.length), sorted.length];
  const count = Math.min(marked, sorted.length);
  // The heatmap shows the smallest values first for a reversed score, such as e-value.
  const [firstMarked, lastMarked] = effectScale.reversed ? [1, count] : [sorted.length - count + 1, sorted.length];
  const format = (value: number) => (effectScale.reversed ? valueFormat.pValue(value).text : ScoreScale.number(value));
  const point = hovered && sorted[hovered.index];
  const tip = hovered && point?.label ? { label: point.label, value: point.value, index: hovered.index, scale: hovered.scale } : undefined;

  const showing = Boolean(tip);
  useEffect(() => {
    if (!showing) return;
    const hide = (event: KeyboardEvent) => event.key === 'Escape' && setHovered(undefined);
    document.addEventListener('keydown', hide);
    return () => document.removeEventListener('keydown', hide);
  }, [showing]);

  // Each rank has one point, so the pointer's nearest rank picks the point to name.
  const onPointerMove = (event: PointerEvent<SVGSVGElement>) => {
    const box = event.currentTarget.getBoundingClientRect();
    const ratio = box.width / width;
    const rank = Math.round((((event.clientX - box.left) / ratio - left) / plotWidth) * Math.max(sorted.length - 1, 1)) + 1;
    setHovered(rank >= 1 && rank <= sorted.length ? { index: rank - 1, scale: ratio } : undefined);
  };
  const tipPlace = tip && placeNearPoint({ x: x(tip.index + 1) * tip.scale, y: y(tip.value) * tip.scale }, tooltipSize, { width: width * tip.scale, height: height * tip.scale });

  return (
    <figure className="all-features" aria-labelledby={`${id}-summary`}>
      <div className="all-features-body">
        <div className="all-features-plot">
          {/* The heatmap and its table carry every value, so the plot and its hover tooltip stay out of the accessibility tree. */}
          <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false" onPointerMove={onPointerMove} onPointerLeave={() => setHovered(undefined)}>
            {yTicks.map((tick) => (
              <g key={tick}>
                <line className="variant-plot-grid" x1={left} x2={left + plotWidth} y1={y(tick)} y2={y(tick)} />
                <text className="variant-plot-tick" x={left - 8} y={y(tick) + 4} textAnchor="end">
                  {ScoreScale.number(tick)}
                </text>
              </g>
            ))}
            {xTicks.map((tick) => (
              <text key={tick} className="variant-plot-tick" x={x(tick)} y={top + plotHeight + 18} textAnchor="middle">
                {tick}
              </text>
            ))}
            <text className="variant-plot-title" x={left + plotWidth / 2} y={height - 8} textAnchor="middle">
              Rank, lowest to highest
            </text>
            <text className="variant-plot-title" transform={`translate(14 ${top + plotHeight / 2}) rotate(-90)`} textAnchor="middle">
              {effectScale.legend.title}
            </text>
            {count < sorted.length && <rect className="all-features-marked" x={x(firstMarked) - 6} y={top} width={x(lastMarked) - x(firstMarked) + 12} height={plotHeight} />}
            {count >= sorted.length ? null : effectScale.reversed ? (
              <text className="variant-plot-tick" x={x(lastMarked) + 10} y={top + 12} textAnchor="start">
                Smallest {count}, shown in the heatmap
              </text>
            ) : (
              <text className="variant-plot-tick" x={x(firstMarked) - 10} y={top + 12} textAnchor="end">
                Top {count}, shown in the heatmap
              </text>
            )}
            {sorted.map(({ value }, index) => (
              <circle key={index} className="all-features-point" cx={x(index + 1)} cy={y(value)} r="3" style={{ fill: `var(${scale.color(scale.step(value) ?? 4)})` }} />
            ))}
            {tip && <circle className="variant-plot-hover" cx={x(tip.index + 1)} cy={y(tip.value)} r="6" />}
          </svg>
          {tip && tipPlace && <DataTooltip title={tip.label} rows={[[effectScale.legend.title, format(tip.value)]]} position={tipPlace} />}
        </div>
        {labels.length > 0 && (
          <ol className="all-features-labels" aria-label="Strongest">
            {labels.map(({ label, value }) => (
              <li key={label}>
                <BreakableText>{label}</BreakableText>, {format(value)}
              </li>
            ))}
          </ol>
        )}
      </div>
      <figcaption id={`${id}-summary`} className="variant-plot-summary">
        {summary}
      </figcaption>
    </figure>
  );
}
