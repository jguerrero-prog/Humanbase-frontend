import type { DataClient } from '../DataClient';
import { TermEnrichment, type AnnotatedTermRecord } from './TermEnrichment';

export type TermDatabase = 'gene-ontology-bp' | 'brenda-ontology';

export class TermService {
  constructor(private readonly client: DataClient) {}

  /** The terms a set of genes is annotated to, ready to rank against whichever genes are shown. */
  async annotated(entrez: readonly number[], database: TermDatabase): Promise<TermEnrichment> {
    const records = await this.client.get<AnnotatedTermRecord[]>('terms/annotated/', { entrez: [...entrez].sort((a, b) => a - b), database });
    return new TermEnrichment(records);
  }
}
