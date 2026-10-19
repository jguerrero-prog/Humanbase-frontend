import { useId } from 'react';
import { ScoreScale } from '../Heatmap/ScoreScale';
import { effectZScale } from './MolecularEffects';
import './VariantEffects.css';

export interface AllFeaturesPlotProps {
  /** Every feature's score for the selected variant, in any order. */
  values: readonly number[];
  /** The strongest features to name on the plot, with their values. */
  labels?: readonly { label: string; value: number }[] | undefined;
  /** How many of the strongest are drawn as the heatmap's top rows. */
  marked?: number | undefined;
  summary: string;
}

const width = 1214;
const height = 380;
const left = 56;
const bottom = 56;
const top = 16;
const plotWidth = width - left - 260;
const plotHeight = height - top - bottom;
const scale = new ScoreScale(effectZScale);

export function AllFeaturesPlot({ values, labels = [], marked = 20, summary }: AllFeaturesPlotProps) {
  const id = useId();
  const sorted = [...values].sort((a, b) => a - b);
  const max = Math.max(5, Math.ceil(Math.max(...sorted) / 5) * 5);
  const min = Math.min(0, Math.floor(Math.min(...sorted)));
  const x = (rank: number) => left + ((rank - 1) / Math.max(sorted.length - 1, 1)) * plotWidth;
  const y = (value: number) => top + plotHeight - ((value - min) / (max - min)) * plotHeight;
  const yTicks = Array.from({ length: Math.floor(max / 5) + 1 }, (_, index) => index * 5);
  const xTicks = [1, ...[50, 100, 150, 200].filter((tick) => tick < sorted.length), sorted.length];
  const firstMarked = sorted.length - marked + 1;

  return (
    <figure className="all-features" aria-labelledby={`${id}-summary`}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        {yTicks.map((tick) => (
          <g key={tick}>
            <line className="variant-plot-grid" x1={left} x2={left + plotWidth} y1={y(tick)} y2={y(tick)} />
            <text className="variant-plot-tick" x={left - 8} y={y(tick) + 4} textAnchor="end">
              {tick}
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
          z-score
        </text>
        <rect className="all-features-marked" x={x(firstMarked) - 6} y={top} width={x(sorted.length) - x(firstMarked) + 12} height={plotHeight} />
        <text className="variant-plot-tick" x={x(firstMarked) - 10} y={top + 12} textAnchor="end">
          Top {marked}, shown in the heatmap
        </text>
        {sorted.map((value, index) => (
          <circle key={index} className="all-features-point" cx={x(index + 1)} cy={y(value)} r="3" style={{ fill: `var(${scale.color(scale.step(value) ?? 4)})` }} />
        ))}
        {labels.map(({ label, value }, index) => (
          <text key={label} className="all-features-label" x={x(sorted.length) + 14} y={top + 12 + index * 20}>
            {label}, {ScoreScale.number(value)}
          </text>
        ))}
      </svg>
      <figcaption id={`${id}-summary`} className="variant-plot-summary">
        {summary}
      </figcaption>
    </figure>
  );
}
