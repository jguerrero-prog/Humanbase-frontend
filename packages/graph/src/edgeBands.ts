// Connection strength as darkness and width, shared by the renderer, its legend and the docs diagrams.
export const edgeBands = [
  { min: 0.9, label: '0.9 and up', color: '--viz-seq-7', width: '--viz-edge-strong' },
  { min: 0.75, label: '0.75 to 0.9', color: '--viz-seq-6', width: '--viz-edge-medium' },
  { min: 0.5, label: '0.5 to 0.75', color: '--viz-seq-5', width: '--viz-edge-weak' },
] as const;

export type EdgeBand = (typeof edgeBands)[number];

export const weakestBand = edgeBands[edgeBands.length - 1] as EdgeBand;

export const edgeBand = (weight: number): EdgeBand | undefined => edgeBands.find((band) => weight >= band.min);
