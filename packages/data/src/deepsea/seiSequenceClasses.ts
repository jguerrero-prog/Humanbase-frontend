import type { FeaturesRecord } from './DeepseaResult';

// Sei's 40 sequence classes and their groups, in the order sequence class predictions use.
// The order was checked against a real Sei job's per-class variant scores on October 20, 2026.
const classes: readonly (readonly [name: string, group: string])[] = [
  ['PC1 Polycomb / Heterochromatin', 'Polycomb'],
  ['L1 Low signal', 'Low signal'],
  ['TN1 Transcription', 'Transcription'],
  ['TN2 Transcription', 'Transcription'],
  ['L2 Low signal', 'Low signal'],
  ['E1 Stem cell', 'Enhancer'],
  ['E2 Multi-tissue', 'Enhancer'],
  ['E3 Brain / Melanocyte', 'Enhancer'],
  ['L3 Low signal', 'Low signal'],
  ['E4 Multi-tissue', 'Enhancer'],
  ['TF1 NANOG / FOXA1', 'TF binding'],
  ['HET1 Heterochromatin', 'Heterochromatin'],
  ['E5 B-cell-like', 'Enhancer'],
  ['E6 Weak epithelial', 'Enhancer'],
  ['TF2 CEBPB', 'TF binding'],
  ['PC2 Weak Polycomb', 'Polycomb'],
  ['E7 Monocyte / Macrophage', 'Enhancer'],
  ['E8 Weak multi-tissue', 'Enhancer'],
  ['L4 Low signal', 'Low signal'],
  ['TF3 FOXA1 / AR / ESR1', 'TF binding'],
  ['PC3 Polycomb', 'Polycomb'],
  ['TN3 Transcription', 'Transcription'],
  ['L5 Low signal', 'Low signal'],
  ['HET2 Heterochromatin', 'Heterochromatin'],
  ['L6 Low signal', 'Low signal'],
  ['P Promoter', 'Promoter'],
  ['E9 Liver / Intestine', 'Enhancer'],
  ['CTCF CTCF-Cohesin', 'CTCF-Cohesin binding'],
  ['TN4 Transcription', 'Transcription'],
  ['HET3 Heterochromatin', 'Heterochromatin'],
  ['E10 Brain', 'Enhancer'],
  ['TF4 OTX2', 'TF binding'],
  ['HET4 Heterochromatin', 'Heterochromatin'],
  ['L7 Low signal', 'Low signal'],
  ['PC4 Polycomb / Bivalent stem cell Enh', 'Polycomb'],
  ['HET5 Centromere', 'Heterochromatin'],
  ['E11 T-cell', 'Enhancer'],
  ['TF5 AR', 'TF binding'],
  ['E12 Erythroblast-like', 'Enhancer'],
  ['HET6 Centromere', 'Heterochromatin'],
];

const groups = new Map(classes.map(([name, group]) => [name, group]));

/** Gives each Sei sequence class in a feature list its group, as the bundled list does; other features keep their cell type. */
export function withSequenceClassGroups(record: FeaturesRecord): FeaturesRecord {
  return { ...record, model_features: (record.model_features ?? []).map((feature) => ({ ...feature, cell_type: { name: groups.get(feature.chromatin_feature_type.name) ?? feature.cell_type.name } })) };
}

/** Names Sei's sequence class predictions; the API's Sei feature list holds its 21,907 chromatin profiles instead. */
export const seiSequenceClasses: FeaturesRecord = {
  model_features: classes.map(([name, group], idx) => ({ cell_type: { name: group }, chromatin_feature_type: { name }, treatment: { name: 'None' }, idx })),
};
