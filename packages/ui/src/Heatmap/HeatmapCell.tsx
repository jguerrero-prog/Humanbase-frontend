import type { ComponentProps, CSSProperties } from 'react';
import './Heatmap.css';

export interface HeatmapCellProps extends Omit<ComponentProps<'span'>, 'color'> {
  /** The step's color custom property, such as `--viz-seq-5`; null draws Not available. */
  color: string | null;
  outlined?: boolean | undefined;
  'data-state'?: 'hover' | undefined;
}

export function HeatmapCell({ color, outlined, className, style, ...rest }: HeatmapCellProps) {
  return (
    <span
      {...rest}
      className={['heatmap-cell', className].filter(Boolean).join(' ')}
      data-missing={color === null || undefined}
      data-outlined={outlined || undefined}
      style={{ ...style, ...(color ? { '--cell-color': `var(${color})` } : {}) } as CSSProperties}
    />
  );
}
