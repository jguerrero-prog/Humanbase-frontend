export interface EdgeBand {
  min: number;
  label: string;
  color: string;
  width: string;
}

// Connection strength as darkness and width, shared by the renderer, its legend and the docs diagrams.
export const edgeBands: readonly EdgeBand[] = [
  { min: 0.9, label: '0.9 and up', color: '--viz-seq-7', width: '--viz-edge-strong' },
  { min: 0.75, label: '0.75 to 0.9', color: '--viz-seq-6', width: '--viz-edge-medium' },
  { min: 0.5, label: '0.5 to 0.75', color: '--viz-seq-5', width: '--viz-edge-weak' },
];

export const weakestBand = edgeBands[edgeBands.length - 1] as EdgeBand;

/** The bands for a minimum confidence: below 0.5 the weakest band starts there instead, since it draws those connections too. */
export function edgeBandsFrom(minConfidence: number): readonly EdgeBand[] {
  if (minConfidence >= weakestBand.min) return edgeBands;
  const min = Number(minConfidence.toFixed(2));
  const upper = edgeBands[edgeBands.length - 2]?.min;
  return [...edgeBands.slice(0, -1), { ...weakestBand, min, label: `${min} to ${upper}` }];
}

export const edgeBand = (weight: number): EdgeBand | undefined => edgeBands.find((band) => weight >= band.min);
