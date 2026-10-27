export interface EdgeBand {
  min: number;
  label: string;
  color: string;
  width: string;
  /** Weaker bands recede, so the strongest connections read first. */
  opacity: number;
}

// Connection strength as darkness, width and opacity, shared by the renderer, its legend and the docs diagrams.
export const edgeBands: readonly EdgeBand[] = [
  { min: 0.9, label: '0.9 and up', color: '--viz-seq-7', width: '--viz-edge-strong', opacity: 1 },
  { min: 0.75, label: '0.75 to 0.9', color: '--viz-seq-6', width: '--viz-edge-medium', opacity: 0.8 },
  { min: 0.5, label: '0.5 to 0.75', color: '--viz-seq-5', width: '--viz-edge-weak', opacity: 0.6 },
];

export const weakestBand = edgeBands[edgeBands.length - 1] as EdgeBand;

const rounded = (value: number) => Number(value.toFixed(2));

/** The bands a minimum confidence leaves on screen, the weakest starting at the minimum. */
export function edgeBandsFrom(minConfidence: number): readonly EdgeBand[] {
  const min = rounded(minConfidence);
  if (min === weakestBand.min) return edgeBands;
  const shown = edgeBands.filter((band, index) => index === 0 || (edgeBands[index - 1] as EdgeBand).min > min);
  const lowest = shown[shown.length - 1] as EdgeBand;
  if (lowest.min === min) return shown;
  const upper = edgeBands[shown.length - 2]?.min;
  return [...shown.slice(0, -1), { ...lowest, min, label: upper === undefined ? `${min} and up` : `${min} to ${upper}` }];
}

export const edgeBand = (weight: number): EdgeBand | undefined => edgeBands.find((band) => weight >= band.min);
