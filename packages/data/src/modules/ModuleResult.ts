import type { DataVersion } from '../genes/Gene';

// The schema leaves the community result undefined. This shape follows what the live site reads
// (query.integration, query.title, query.entrez_list, enrichment per database) and is checked against a real result before launch.
export interface CommunityTermRecord {
  identifier: string;
  title: string;
}

export interface CommunityEnrichmentRecord {
  module: number;
  term: CommunityTermRecord;
  q_value: number;
  genes: readonly number[];
}

export interface CommunityModuleRecord {
  id: number;
  genes: readonly number[];
}

export interface CommunityRecord {
  query: { integration: string; giant_version: DataVersion; title?: string; entrez_list: readonly number[] };
  modules: readonly CommunityModuleRecord[];
  enrichment: Readonly<Record<string, readonly CommunityEnrichmentRecord[]>>;
  edges?: readonly (readonly [number, number, number])[];
}

export interface ModuleTerm {
  id: string;
  title: string;
  qValue: number;
  genes: readonly number[];
}

export interface Module {
  id: number;
  label: string;
  genes: readonly number[];
}

export interface ModuleFilter {
  minimumSize: number;
  hideUnenriched: boolean;
}

export class ModuleResult {
  static readonly defaultFilter: ModuleFilter = { minimumSize: 2, hideUnenriched: true };

  readonly modules: readonly Module[];
  private readonly moduleByGene = new Map<number, Module>();

  constructor(readonly record: CommunityRecord) {
    this.modules = record.modules.map((module) => ({ id: module.id, label: `M${module.id}`, genes: module.genes }));
    for (const module of this.modules) for (const gene of module.genes) this.moduleByGene.set(gene, module);
  }

  get integration(): string {
    return this.record.query.integration;
  }

  get version(): DataVersion {
    return this.record.query.giant_version;
  }

  get title(): string {
    return this.record.query.title ?? '';
  }

  get entrez(): readonly number[] {
    return this.record.query.entrez_list;
  }

  get edges(): readonly (readonly [number, number, number])[] {
    return this.record.edges ?? [];
  }

  /** Databases with at least one enriched term, Gene Ontology (BP) first, as the live site picks it. */
  get databases(): string[] {
    const withTerms = Object.keys(this.record.enrichment).filter((database) => (this.record.enrichment[database]?.length ?? 0) > 0);
    return withTerms.sort((a, b) => Number(b === 'gene-ontology-bp') - Number(a === 'gene-ontology-bp'));
  }

  moduleOf(entrez: number): Module | undefined {
    return this.moduleByGene.get(entrez);
  }

  module(id: number): Module | undefined {
    return this.modules.find((module) => module.id === id);
  }

  /** A module's enriched terms in one database, most significant first. */
  terms(moduleId: number, database: string): ModuleTerm[] {
    return (this.record.enrichment[database] ?? [])
      .filter((row) => row.module === moduleId)
      .map((row) => ({ id: row.term.identifier, title: row.term.title, qValue: row.q_value, genes: row.genes }))
      .sort((a, b) => a.qValue - b.qValue);
  }

  isEnriched(moduleId: number, database: string): boolean {
    return (this.record.enrichment[database] ?? []).some((row) => row.module === moduleId);
  }

  /** The modules the result shows, in module order. */
  shown(database: string, filter: ModuleFilter = ModuleResult.defaultFilter): Module[] {
    return this.modules.filter((module) => module.genes.length >= filter.minimumSize && (!filter.hideUnenriched || this.isEnriched(module.id, database)));
  }

  enrichedCount(database: string): number {
    return this.modules.filter((module) => this.isEnriched(module.id, database)).length;
  }
}
