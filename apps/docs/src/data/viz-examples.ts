import { tissueConfidenceScale } from '@humanbase/hb';
import type { HeatmapRow, ScaleSpec } from '@humanbase/ui';
import { expressionGeneLegend } from './score-legends';

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

export { edgeBand, edgeBands, edgeCurve } from '@humanbase/graph';

export const tissueScores = {
  scale: { ...tissueConfidenceScale, title: 'Score with IL1B' } satisfies ScaleSpec,
  columns: ['Blood vessel', 'Liver', 'Lung', 'Brain', 'Kidney', 'Heart', 'Skin', 'Spleen'],
  rows: [
    { label: 'IL1R1', values: [0.93, 0.76, 0.84, 0.64, 0.75, 0.83, 0.76, 0.94] },
    { label: 'PTGS2', values: [0.95, 0.6, 0.86, 0.44, 0.64, 0.75, 0.83, 0.86] },
    { label: 'TNFAIP6', values: [0.97, 0.45, 0.73, 0.33, 0.44, 0.64, 0.75, 0.83] },
    { label: 'ICAM1', values: [0.94, 0.77, 0.85, 0.6, 0.86, 0.74, 0.77, 0.95] },
    { label: 'CXCL8', values: [0.96, 0.61, 0.87, 0.45, 0.43, 0.76, 0.84, 0.87] },
    { label: 'IL6', values: [0.93, 0.76, 0.84, 0.64, 0.62, 0.73, 0.76, 0.84] },
    { label: 'CCL2', values: [0.95, 0.6, 0.86, null, 0.64, 0.75, 0.6, 0.86] },
    { label: 'SOD2', values: [0.87, 0.85, 0.73, 0.46, 0.74, 0.84, 0.45, 0.73] },
  ] satisfies HeatmapRow[],
};

export const variantEffects = {
  scale: expressionGeneLegend,
  columns: ['Blood vessel', 'Liver', 'Lung', 'Brain', 'Spleen', 'Skin'],
  rows: [
    { label: 'rs1143634', values: [-0.62, -0.19, -0.21, 0.02, -0.6, -0.22] },
    { label: 'rs16944', values: [0.6, -0.02, 0.21, -0.01, 1, 0.2] },
    { label: 'rs1143627', values: [0.22, 0, 0.18, 0.01, 0.19, 0.02] },
    { label: 'rs4848306', values: [-0.01, -0.18, 0, null, -0.19, -0.01] },
    { label: 'rs33944208', values: [1, 0.19, 0.62, 0, 0.58, 0.21] },
  ] satisfies HeatmapRow[],
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
