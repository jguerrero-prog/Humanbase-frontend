import { tissueConfidenceScale } from '@humanbase/hb';
import { seqweaverGnomadEffects, type HeatmapCellDetail, type HeatmapRow, type ScaleSpec } from '@humanbase/ui';

export type LegendStatus = 'Decided' | 'Proposed' | 'To confirm';

export interface LegendPreset {
  status: LegendStatus;
  spec: ScaleSpec;
  note: string;
}

const zEdges = [-5, -3, -2, 2, 3, 5];

export const expressionGeneLegend: ScaleSpec = { title: 'Log fold change', kind: 'diverging', edges: [-1, -0.3, -0.1, 0.1, 0.3, 1], words: ['Decreases', 'Increases'] };

export const tissueConfidenceLegend: ScaleSpec = tissueConfidenceScale;

// One stepped legend per score. Statuses and notes are as Figma records them on October 17, 2026.
export const scoreLegends: LegendPreset[] = [
  {
    status: 'Decided',
    spec: { title: 'Variant features, z-score', kind: 'diverging', edges: zEdges, words: ['Lowers', 'Raises'] },
    note: 'Seqweaver, Beluga, Sei, ASD Browser. Edges at |z| 2, 3, 5.',
  },
  {
    status: 'Proposed',
    spec: { title: 'ExPecto SC, expression effect (z)', kind: 'diverging', edges: zEdges, words: ['Decreases', 'Increases expression'] },
    note: 'Same z edges; the docs call 3 to 5 or more reliable. Replaces today’s ±100.',
  },
  {
    status: 'Decided',
    spec: { title: 'ExPecto, expression effect (log fold change)', kind: 'diverging', edges: [-0.1, -0.05, -0.02, 0.02, 0.05, 0.1], words: ['Decreases', 'Increases expression'] },
    note: 'Job results: edges at 0.02, 0.05 and 0.1, inside the live −0.1 to 0.1 range. Gene pages: −1 to 1, edges at 0.1, 0.3 and 1, as the live gene page. Decided October 17, 2026.',
  },
  {
    status: 'To confirm',
    spec: { title: 'Probability diffs, p(alt) − p(ref)', kind: 'diverging', edges: [-0.2, -0.1, -0.05, 0.05, 0.1, 0.2], words: ['Lowers', 'Raises'] },
    note: 'Can only fall between −1 and 1; typical sizes weren’t captured.',
  },
  {
    status: 'To confirm',
    spec: { title: 'In silico mutagenesis, log2 fold change of odds', kind: 'diverging', edges: [-2, -1, -0.5, 0.5, 1, 2], words: ['Mutation raises', 'Mutation lowers'] },
    note: 'Words follow the formula, original minus mutated; the sign is on the facts to confirm.',
  },
  {
    status: 'To confirm',
    spec: seqweaverGnomadEffects.legend,
    note: 'Seqweaver gnomAD browser: live draws 0 to 5, white at 0 through yellow at 1 and orange at 4 to red at 5. Edges at 1, 2, 3 and 4 to confirm with the Seqweaver team.',
  },
  {
    status: 'Proposed',
    spec: { title: 'e-value', kind: 'one-sided', edges: [0.05, 0.01, 0.001], words: ['Weaker', 'Stronger evidence'] },
    note: 'Smaller is stronger; above 0.05 is grey, not a lighter blue.',
  },
  {
    status: 'To confirm',
    spec: tissueConfidenceLegend,
    note: 'Amounts from 0 to 1; below 0.5 shares the lightest step.',
  },
];

// The IRGM specimen: positions and tissue systems from the live page, values illustrative.
export const irgmPositions = [150226123, 150226178, 150226241, 150226285, 150226295, 150226296, 150226297, 150226299, 150226300, 150226301, 150226333, 150226334];

export const irgmRows: HeatmapRow[] = [
  { label: 'alimentary canal', values: [0.04, -0.12, 0.02, 0.18, -0.05, 0.01, 0.09, -0.21, 0.03, -0.02, 0.35, 0.06] },
  { label: 'cardiovascular system', values: [0.02, -0.08, 0.01, 0.12, -0.03, null, 0.05, -0.14, 0.02, -0.01, 0.22, 0.04] },
  { label: 'endocrine gland', values: [0.06, -0.15, 0.03, 0.27, -0.07, 0.02, 0.11, -0.33, 0.05, -0.03, 0.48, 0.09] },
  { label: 'exocrine gland', values: [0.03, -0.09, 0.02, 0.14, -0.04, 0.01, 0.07, -0.17, 0.02, -0.02, 0.29, 0.05] },
  { label: 'hematopoietic system', values: [0.11, -0.41, 0.07, 0.62, -0.18, 0.04, 0.26, -1.42, 0.09, -0.06, 1.18, 0.21] },
  { label: 'integument', values: [0.01, -0.05, 0.01, 0.08, -0.02, 0.0, 0.04, -0.09, 0.01, -0.01, 0.15, 0.03] },
  { label: 'nervous system', values: [0.05, -0.19, 0.03, 0.31, -0.09, 0.02, 0.13, -0.52, 0.04, -0.03, 0.66, 0.1] },
  { label: 'reproductive system', values: [0.02, -0.07, 0.01, 0.11, -0.03, 0.01, 0.06, -0.19, 0.02, -0.01, 0.24, 0.04] },
];

export const irgmSummary = 'Predicted effects of 12 variants near IRGM on its expression in 8 tissue systems. The strongest is a decrease of 1.42 at 150,226,299 in the hematopoietic system, past the end of the legend. Values are illustrative.';

// An illustrative compact specimen: 113 positions near 12,598,800, as Figma draws it. Values are made up, not data.
const specimenStart = 12598795;
export const positionSpecimenColumns = Array.from({ length: 113 }, (_, index) => ({ label: `chr3:${specimenStart + index}`, position: specimenStart + index }));
const wave = (row: number, column: number) => {
  return Number((Math.sin(column * 0.37 + row * 1.7) * Math.cos(column * 0.11 - row) * 0.3).toFixed(2));
};
// The open tooltip: every allele at 12,598,855, the reference marked and the strongest noted.
export const positionSpecimenActive = [0, 60] as const;
const openDetail: HeatmapCellDetail = { rows: [['A', 'Reference'], ['C', '−0.04'], ['G', '+0.12', 'strongest, shown in the cell'], ['T', '+0.02']], hint: 'Strongest tissue: Spleen, GTEx' };
const isOpen = (row: number, column: number) => row === positionSpecimenActive[0] && column === positionSpecimenActive[1];
const specimenRow = (label: string, row: number): HeatmapRow => ({
  label,
  values: positionSpecimenColumns.map((_, column) => (isOpen(row, column) ? 0.12 : wave(row, column))),
  ...(row === positionSpecimenActive[0] && { details: positionSpecimenColumns.map((_, column) => (isOpen(row, column) ? openDetail : undefined)) }),
});
export const positionSpecimenRows: HeatmapRow[] = ['Blood', 'Immune', 'Digestive', 'Nervous', 'Liver'].map(specimenRow);

// A substitution map specimen: position 999 is real (example job 0576e894, HepG2 / CEBPB); other values are illustrative.
export const mutagenesisScale: ScaleSpec = { title: 'Log2 fold change', kind: 'diverging', edges: [-0.5, -0.25, -0.1, 0.1, 0.25, 0.5], words: ['Mutation lowers', 'Mutation raises'] };
const specimenBases = 'GTCAATACTCGTTGCCCGCTATACCGGGGCTAACTATGTCTTGGCTTTTGCGCAGACGTCAGGTAGACTCACTGAACTCGGCAGCTATTGA';
export const substitutionColumns = Array.from(specimenBases, (reference, index) => {
  const position = 954 + index;
  const values: Record<string, number> = {};
  ['A', 'C', 'G', 'T'].forEach((base, row) => {
    if (base === reference) return;
    const near = Math.max(0, 1 - Math.abs(position - 999) / 12);
    values[base] = Number((Math.sin(position * 0.7 + row * 2.1) * 0.3 - near * 2.5).toFixed(2));
  });
  return { position, reference, values: position === 999 ? { A: -4.63, C: -4, G: -4.24 } : values };
});
export const substitutionOverview = Array.from({ length: 200 }, (_, bin) => Number((0.4 + Math.abs(Math.sin(bin * 1.3)) * 0.6 + (bin === 99 ? 4 : bin === 100 || bin === 98 ? 2 : 0)).toFixed(2)));
