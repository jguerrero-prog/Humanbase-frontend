import type { DataClient } from '../DataClient';
import { ExtendedUniverse } from './ExtendedUniverse';
import { TermEnrichment, type AnnotatedTermRecord } from './TermEnrichment';

export type TermDatabase = 'sfari-gene' | 'disease-ontology' | 'gene-ontology-bp' | 'brenda-ontology';

export class TermService {
  /** The databases ranked together in the Processes panel, in humanbase.io's order, which breaks ties. */
  static readonly processDatabases: readonly TermDatabase[] = ['sfari-gene', 'disease-ontology', 'gene-ontology-bp'];
  static readonly tissueDatabases: readonly TermDatabase[] = ['brenda-ontology'];

  constructor(private readonly client: DataClient) {}

  /** The terms a set of genes is annotated to in each database, ready to rank against whichever genes are shown. */
  async annotated(entrez: readonly number[], databases: readonly TermDatabase[], extendedUniverse = false): Promise<TermEnrichment> {
    const ids = [...entrez].sort((a, b) => a - b);
    const lists = await Promise.all(databases.map((database) => this.client.get<AnnotatedTermRecord[]>('terms/annotated/', { entrez: ids, database, ...ExtendedUniverse.query(extendedUniverse) })));
    return new TermEnrichment(lists.flat());
  }
}
