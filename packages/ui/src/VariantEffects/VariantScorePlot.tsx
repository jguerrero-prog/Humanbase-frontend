import { useId, type CSSProperties } from 'react';
import { byGenomePosition, variantLabel, type Variant, type VariantScore } from './Variant';
import './VariantEffects.css';

export type PlotBy = 'genome' | 'rank';

export interface VariantScorePlotProps {
  variants: readonly Variant[];
  score: VariantScore;
  by?: PlotBy;
  selected?: string | undefined;
  onSelect?: ((id: string) => void) | undefined;
  /** A color custom property per point, such as its chromosome or sequence class; without one, chromosomes alternate grey. */
  pointColor?: ((variant: Variant) => string | undefined) | undefined;
  summary: string;
}

const width = 670;
const height = 327;
const left = 56;
const bottom = 52;
const top = 24;
const plotWidth = width - left - 16;
const plotHeight = height - top - bottom;

const steps = [0.5, 1, 2, 5, 10, 20, 50, 100, 200, 500, 1000];

/** The y axis always shows 0 and spans negative scores too, in at most six tick steps. */
function scoreAxis(values: readonly number[]) {
  const [low, high] = [Math.min(0, ...values), Math.max(0, ...values)];
  const step = steps.find((size) => (high - low) / size <= 6) ?? 1000;
  const [min, max] = [Math.floor(low / step) * step, Math.max(step, Math.ceil(high / step) * step)];
  const ticks = Array.from({ length: Math.round((max - min) / step) + 1 }, (_, index) => min + index * step);
  return { min, max, ticks, digits: step < 1 ? 1 : 0 };
}

interface Point {
  variant: Variant;
  x: number;
  band: number;
}

function genomePoints(variants: readonly Variant[]) {
  const sorted = [...variants].sort(byGenomePosition);
  const chromosomes = [...new Set(sorted.map((variant) => variant.chromosome))];
  const bandWidth = plotWidth / Math.max(chromosomes.length, 1);
  const points: Point[] = sorted.map((variant) => {
    const band = chromosomes.indexOf(variant.chromosome);
    const peers = sorted.filter((other) => other.chromosome === variant.chromosome).map((other) => other.position);
    const [low, high] = [Math.min(...peers), Math.max(...peers)];
    const share = high === low ? 0.5 : 0.2 + ((variant.position - low) / (high - low)) * 0.6;
    return { variant, band, x: left + bandWidth * (band + share) };
  });
  const labels = chromosomes.map((name, index) => ({ name, x: left + bandWidth * (index + 0.5) }));
  return { points, labels };
}

function rankPoints(variants: readonly Variant[], key: string) {
  const sorted = [...variants].sort((a, b) => (b.scores[key] ?? 0) - (a.scores[key] ?? 0));
  const step = plotWidth / Math.max(sorted.length, 1);
  const points: Point[] = sorted.map((variant, index) => ({ variant, band: 0, x: left + step * (index + 0.5) }));
  const labels = points.map((point, index) => ({ name: String(index + 1), x: point.x }));
  return { points, labels };
}

export function VariantScorePlot({ variants, score, by = 'genome', selected, onSelect, pointColor, summary }: VariantScorePlotProps) {
  const id = useId();
  const axis = scoreAxis(variants.map((variant) => variant.scores[score.key] ?? 0));
  const y = (value: number) => top + plotHeight - ((value - axis.min) / (axis.max - axis.min)) * plotHeight;
  const { points, labels } = by === 'genome' ? genomePoints(variants) : rankPoints(variants, score.key);
  const chosen = points.find((point) => point.variant.id === selected);
  const chosenY = chosen ? y(chosen.variant.scores[score.key] ?? 0) : 0;

  return (
    <figure className="variant-plot" aria-labelledby={`${id}-summary`}>
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true" focusable="false">
        {axis.ticks.map((tick) => (
          <g key={tick}>
            <line className="variant-plot-grid" x1={left} x2={width - 16} y1={y(tick)} y2={y(tick)} />
            <text className="variant-plot-tick" x={left - 8} y={y(tick) + 4} textAnchor="end">
              {tick.toFixed(axis.digits)}
            </text>
          </g>
        ))}
        {labels.map((label) => (
          <text key={label.name + label.x} className="variant-plot-tick" x={label.x} y={top + plotHeight + 18} textAnchor="middle">
            {label.name}
          </text>
        ))}
        <text className="variant-plot-title" x={left + plotWidth / 2} y={height - 8} textAnchor="middle">
          {by === 'genome' ? 'Genome position' : 'Rank'}
        </text>
        <text className="variant-plot-title" transform={`translate(14 ${top + plotHeight / 2}) rotate(-90)`} textAnchor="middle">
          {score.label}
        </text>
        {points.map(({ variant, x, band }) => {
          const color = pointColor?.(variant);
          return (
            <circle
              key={variant.id}
              className={color ? 'variant-plot-point variant-plot-point-colored' : band % 2 ? 'variant-plot-point variant-plot-point-light' : 'variant-plot-point'}
              {...(color && { style: { '--point-color': `var(${color})` } as CSSProperties })}
              cx={x}
              cy={y(variant.scores[score.key] ?? 0)}
              r="6"
              onPointerUp={() => onSelect?.(variant.id)}
            />
          );
        })}
        {chosen && (
          <g className="variant-plot-selected">
            <circle cx={chosen.x} cy={chosenY} r="10" />
            <text x={chosen.x + 14} y={chosenY - 10}>
              {variantLabel(chosen.variant)}
            </text>
          </g>
        )}
      </svg>
      <figcaption id={`${id}-summary`} className="variant-plot-summary">
        {summary}
      </figcaption>
    </figure>
  );
}
