import type { DataClient, Query } from '../DataClient';
import { GeneFunction, type AnnotationRecord, type PredictionRecord } from './GeneFunction';

export type FunctionDatabase = 'gene-ontology-bp' | 'disease-ontology' | 'brenda-ontology';

export class GeneFunctionService {
  constructor(private readonly client: DataClient) {}

  // The live site limits processes and diseases to predictions of 0.05 or more and terms of up to 300 genes.
  private static paramsFor(database: FunctionDatabase): Query {
    return database === 'brenda-ontology' ? { database } : { database, score_cutoff: 0.05, max_term_size: 300 };
  }

  /** A gene's annotations and predictions for one database, merged into one row per term. */
  async get(entrez: number, database: FunctionDatabase): Promise<GeneFunction[]> {
    const params = GeneFunctionService.paramsFor(database);
    const [annotations, predictions] = await Promise.all([
      this.client.get<AnnotationRecord[]>(`genes/${entrez}/annotations/`, params),
      this.client.get<PredictionRecord[]>(`genes/${entrez}/predictions/`, params),
    ]);
    return GeneFunction.fromRecords(annotations, predictions);
  }
}
