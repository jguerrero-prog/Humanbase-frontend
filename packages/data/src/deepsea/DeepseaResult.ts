export interface ScoreType {
  name: string;
  level: 'VARIANT' | 'FEATURE';
  short_name: string;
  range?: number[];
  reverse_order?: boolean;
  non_sig_range?: number[];
}

export interface VariantSequence {
  chromosome: string;
  position: number;
  name: string;
  ref_allele: string;
  alt_allele: string;
  strand?: string;
}

export interface VariantScoresRecord {
  ds_model: string;
  score_type: string;
  scores: { sequence: VariantSequence; value: number }[];
}

export interface FeaturePredictionRecord extends VariantSequence {
  feature_predictions: number[];
}

interface Named {
  name: string;
}

export interface ModelFeature {
  cell_type: Named;
  chromatin_feature_type: Named;
  treatment: Named;
  idx: number;
}

export interface FeaturesRecord {
  model_features: ModelFeature[];
}

/** One row of a result: a variant with each of its variant-level scores. */
export interface VariantRow {
  id: string;
  chromosome: string;
  position: number;
  change: string;
  name: string;
  scores: Record<string, number>;
}

/** One experiment's score for the selected variant. */
export interface FeatureEffect {
  feature: string;
  cell: string;
  context: string;
  label: string;
  value: number;
}

// Treatments name the experiment's sample, such as ago_adult_brain.BA4.hg19; "None" and bare IDs add nothing.
function treatmentOf(feature: ModelFeature): string {
  const name = feature.treatment.name.trim();
  if (!name || name === 'None' || /^ID:\d+$/.test(name)) return '';
  return name.replace(/\.hg\d+$/, '');
}

export function variantIdOf(sequence: VariantSequence): string {
  return `${sequence.chromosome}-${sequence.position}-${sequence.ref_allele}-${sequence.alt_allele}`;
}

/** The chr_variant parameter for a variant, such as 1:109817590. */
export function chrVariant(variant: Pick<VariantRow, 'chromosome' | 'position'>): string {
  return `${variant.chromosome.replace(/^chr/i, '')}:${variant.position}`;
}

/** Every variant once, with the score from each score type it appears in. */
export function variantRows(sets: readonly VariantScoresRecord[]): VariantRow[] {
  const rows = new Map<string, VariantRow>();
  for (const set of sets) {
    for (const { sequence, value } of set.scores) {
      const id = variantIdOf(sequence);
      const row = rows.get(id) ?? { id, chromosome: sequence.chromosome, position: sequence.position, change: `${sequence.ref_allele}>${sequence.alt_allele}`, name: sequence.name, scores: {} };
      row.scores[set.score_type] = value;
      rows.set(id, row);
    }
  }
  return [...rows.values()];
}

/** The selected variant’s score for every feature, named from the model’s feature list. */
export function featureEffects(prediction: FeaturePredictionRecord, features: FeaturesRecord): FeatureEffect[] {
  const byIndex = new Map(features.model_features.map((feature) => [feature.idx, feature]));
  return prediction.feature_predictions.flatMap((value, index) => {
    const feature = byIndex.get(index);
    if (!feature) return [];
    const name = feature.chromatin_feature_type.name;
    const cell = feature.cell_type.name;
    const treatment = treatmentOf(feature);
    const replicate = /rep\.?(\d+)/i.exec(treatment)?.[1];
    const context = replicate ? `${cell} rep ${replicate}` : cell;
    return [{ feature: name, cell, context, label: `${cell} / ${name}${treatment ? ` (${treatment})` : ''}`, value }];
  });
}
