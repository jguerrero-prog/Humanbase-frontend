import './ThemedArt.css';

/** One shape: its paint classes, its path, a stroke width, and for an outlined stroke the class of the stroke drawn inside it. */
export type ThemedPath = readonly [className: string, d: string, strokeWidth?: number, innerClassName?: string];

export interface ThemedArtProps {
  paths: readonly ThemedPath[];
  width: number;
  height: number;
  className?: string;
  preserveAspectRatio?: string;
  /** How much wider an outlined stroke is than the stroke inside it. */
  outline?: number;
}

/** Decorative art drawn with theme tokens, so it follows every theme; generated from the Illustrator source, never hand-drawn here. */
export function ThemedArt({ paths, width, height, className, preserveAspectRatio, outline = 2.4 }: ThemedArtProps) {
  return (
    <svg className={className ? `themed-art ${className}` : 'themed-art'} viewBox={`0 0 ${width} ${height}`} width={width} height={height} preserveAspectRatio={preserveAspectRatio} aria-hidden="true">
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        {paths.map(([paint, d, strokeWidth, innerPaint], index) =>
          innerPaint && strokeWidth ? (
            <g key={index}>
              <path className={paint} d={d} strokeWidth={strokeWidth + outline} />
              <path className={innerPaint} d={d} strokeWidth={strokeWidth} />
            </g>
          ) : (
            <path key={index} className={paint} d={d} strokeWidth={strokeWidth} />
          ),
        )}
      </g>
    </svg>
  );
}
