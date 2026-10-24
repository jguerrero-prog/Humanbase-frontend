import type { DataClient } from '../DataClient';
import type { FeaturePredictionRecord, FeaturesRecord } from './DeepseaResult';
import { seiSequenceClasses } from './seiSequenceClasses';

// Not in the schema: one HGMD variant as GET /api/deepsea/sei_hgmd/feature_predictions/ returns it.
export interface HgmdVariantRecord extends FeaturePredictionRecord {
  /** The dataset's own order, from 1, as text. */
  idx: string;
  /** The HGMD accession, such as CR095375. */
  id: string;
  gene: string;
  phenotype: string;
  sequence_class_assigned: string;
  sequence_class_assigned_diff: string;
}

/** humanbase.io's Sort variants by: the dataset's order, disease name, or genome position as the API lists them. */
export type HgmdOrder = 'default' | 'disease' | 'position';

const groups = new Map((seiSequenceClasses.model_features ?? []).map((feature) => [feature.chromatin_feature_type.name, feature.cell_type.name]));

/** Sei's sequence class scores for 853 noncoding pathogenic variants from the Human Gene Mutation Database, as humanbase.io's /sei-hgmd shows them. */
export class SeiHgmdService {
  static readonly orders: readonly { value: HgmdOrder; label: string }[] = [
    { value: 'default', label: 'Default' },
    { value: 'disease', label: 'Disease name' },
    { value: 'position', label: 'Genome position' },
  ];

  constructor(private readonly client: DataClient) {}

  /** A variant as the heatmap names it, such as Breast cancer (chr17:41196424). */
  static nameOf(variant: HgmdVariantRecord): string {
    return `${variant.phenotype} (${variant.chromosome}:${variant.position})`;
  }

  /** The variants in humanbase.io's order: the dataset's idx, disease names A to Z, or as the API lists them, which is by genome position. */
  static sorted(variants: readonly HgmdVariantRecord[], order: HgmdOrder): HgmdVariantRecord[] {
    const list = [...variants];
    if (order === 'default') return list.sort((a, b) => Number.parseInt(a.idx, 10) - Number.parseInt(b.idx, 10));
    if (order === 'disease') return list.sort((a, b) => a.phenotype.localeCompare(b.phenotype));
    return list;
  }

  /** The 40 sequence classes in the order the predictions use, each with its group, as Sei job results name them. */
  async features(): Promise<FeaturesRecord> {
    const record = await this.client.get<FeaturesRecord>('deepsea/sei_hgmd/features/');
    return { model_features: (record.model_features ?? []).map((feature) => ({ ...feature, cell_type: { name: groups.get(feature.chromatin_feature_type.name) ?? feature.cell_type.name } })) };
  }

  /** Every variant with its 40 scores; the genome view picks the ones in its range from these. */
  variants(): Promise<HgmdVariantRecord[]> {
    return this.client.get<HgmdVariantRecord[]>('deepsea/sei_hgmd/feature_predictions/');
  }
}
