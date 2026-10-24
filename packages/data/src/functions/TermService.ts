import type { DataClient } from '../DataClient';
import { ExtendedUniverse } from './ExtendedUniverse';
import { TermEnrichment, type AnnotatedTermRecord } from './TermEnrichment';

export type TermDatabase = 'gene-ontology-bp' | 'brenda-ontology';

export class TermService {
  constructor(private readonly client: DataClient) {}

  /** The terms a set of genes is annotated to, ready to rank against whichever genes are shown. */
  async annotated(entrez: readonly number[], database: TermDatabase, extendedUniverse = false): Promise<TermEnrichment> {
    const query = { entrez: [...entrez].sort((a, b) => a - b), database, ...ExtendedUniverse.query(extendedUniverse) };
    const records = await this.client.get<AnnotatedTermRecord[]>('terms/annotated/', query);
    return new TermEnrichment(records);
  }
}
