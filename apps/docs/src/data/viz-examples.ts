// Example data drawn on the Data visualization page, transcribed from the Figma diagrams.
export interface NetworkNode {
  gene: string;
  x: number;
  y: number;
  module: 1 | 2 | 3 | 'other';
}

export interface NetworkEdge {
  from: string;
  to: string;
  weight: number;
}

export const queryGene = { gene: 'IL1B', x: 309, y: 208 };

export const networkNodes: NetworkNode[] = [
  { gene: 'IRAK1', x: 222, y: 41, module: 2 },
  { gene: 'CXCL8', x: 305, y: 54, module: 1 },
  { gene: 'MMP3', x: 422, y: 26, module: 'other' },
  { gene: 'TNF', x: 540, y: 92, module: 1 },
  { gene: 'PTGS2', x: 449, y: 116, module: 2 },
  { gene: 'IL1R1', x: 161, y: 138, module: 1 },
  { gene: 'SOD2', x: 62, y: 200, module: 'other' },
  { gene: 'NFKBIA', x: 556, y: 206, module: 1 },
  { gene: 'TNFAIP6', x: 138, y: 282, module: 3 },
  { gene: 'ICAM1', x: 470, y: 292, module: 3 },
  { gene: 'SELE', x: 72, y: 331, module: 3 },
  { gene: 'IL6', x: 251, y: 355, module: 2 },
  { gene: 'CCL2', x: 391, y: 368, module: 2 },
];

export const networkEdges: NetworkEdge[] = [
  { from: 'IL1B', to: 'IL1R1', weight: 0.97 },
  { from: 'IL1B', to: 'PTGS2', weight: 0.96 },
  { from: 'IL1B', to: 'TNFAIP6', weight: 0.96 },
  { from: 'IL1B', to: 'ICAM1', weight: 0.94 },
  { from: 'IL1B', to: 'CXCL8', weight: 0.93 },
  { from: 'IL1B', to: 'IL6', weight: 0.92 },
  { from: 'IL1B', to: 'CCL2', weight: 0.88 },
  { from: 'IL1B', to: 'SOD2', weight: 0.86 },
  { from: 'IL1B', to: 'NFKBIA', weight: 0.84 },
  { from: 'IL1B', to: 'IRAK1', weight: 0.81 },
  { from: 'IL1B', to: 'MMP3', weight: 0.72 },
  { from: 'IL1B', to: 'SELE', weight: 0.66 },
  { from: 'IL1B', to: 'TNF', weight: 0.61 },
  { from: 'PTGS2', to: 'ICAM1', weight: 0.68 },
  { from: 'IL1R1', to: 'SOD2', weight: 0.58 },
  { from: 'IRAK1', to: 'CXCL8', weight: 0.55 },
];

export const modules = [
  { id: 1, label: 'Inflammation' },
  { id: 2, label: 'Cytokine signaling' },
  { id: 3, label: 'Cell adhesion' },
  { id: 'other', label: 'Other' },
] as const;

export const edgeBands = [
  { min: 0.9, label: '0.9 and up', color: '--viz-seq-7', width: '--viz-edge-strong' },
  { min: 0.75, label: '0.75 to 0.9', color: '--viz-seq-6', width: '--viz-edge-medium' },
  { min: 0.5, label: '0.5 to 0.75', color: '--viz-seq-5', width: '--viz-edge-weak' },
] as const;

export const edgeBand = (weight: number) => edgeBands.find((band) => weight >= band.min);

export const tissueScores = {
  columns: ['Blood vessel', 'Liver', 'Lung', 'Brain', 'Kidney', 'Heart', 'Skin', 'Spleen'],
  rows: [
    ['IL1R1', [7, 5, 6, 4, 5, 6, 5, 7]],
    ['PTGS2', [7, 4, 6, 3, 4, 5, 6, 6]],
    ['TNFAIP6', [7, 3, 5, 2, 3, 4, 5, 6]],
    ['ICAM1', [7, 5, 6, 4, 6, 5, 5, 7]],
    ['CXCL8', [7, 4, 6, 3, 3, 5, 6, 6]],
    ['IL6', [7, 5, 6, 4, 4, 5, 5, 6]],
    ['CCL2', [7, 4, 6, null, 4, 5, 4, 6]],
    ['SOD2', [6, 6, 5, 3, 5, 6, 3, 5]],
  ] as [string, (number | null)[]][],
};

export const variantEffects = {
  columns: ['Blood vessel', 'Liver', 'Lung', 'Brain', 'Spleen', 'Skin'],
  rows: [
    ['rs1143634', [-2, -1, -1, 0, -2, -1]],
    ['rs16944', [2, 0, 1, 0, 3, 1]],
    ['rs1143627', [1, 0, 1, 0, 1, 0]],
    ['rs4848306', [0, -1, 0, null, -1, 0]],
    ['rs33944208', [3, 1, 2, 0, 2, 1]],
  ] as [string, (number | null)[]][],
};

export const enrichedTerms: [string, number][] = [
  ['inflammatory response', 11.9],
  ['cytokine-mediated signaling', 8.5],
  ['response to lipopolysaccharide', 7.1],
  ['regulation of NF-kappaB', 5.6],
  ['leukocyte migration', 4.8],
  ['fever generation', 3.2],
];

// Effect of each position on expression, from 1 kb upstream to 1 kb downstream of the TSS.
export const promoterTrack = [
  0.05, -0.2, -0.12, -0.05, -0.2, 0.2, 0.08, -0.1, 0.18, -0.05, 0.12, 0.08, -0.15, 0.1, -0.05, -0.55, -0.75, 0.7, 0.75, -0.65, -0.05, 0.75, -0.15, 0.1, 0.1,
  -0.1, -0.15, 0.27, -0.05, 0.07, -0.07, -0.15, 0.12, -0.05, -0.1, 0.24, -0.15, -0.1, -0.2, 0.25, 0.2, -0.05, -0.15,
];
