import type { DataVersion } from '../genes/Gene';
import type { GeneHitRecord } from '../genes/GeneHit';

// The schema leaves the community result undefined. This shape was read from a real result on October 20, 2026:
// the renal disease panel's cached result, polled by its body_tag.
/** Database names for results that don't send their own lookup. */
export const termDatabaseNames: Readonly<Record<string, string>> = {
  'gene-ontology-bp': 'Gene Ontology (BP)',
  'disease-ontology': 'Disease Ontology',
  'brenda-ontology': 'Tissues (BRENDA)',
  'msigdb-h': 'MSigDB: Hallmark (H)',
  'msigdb-c2-cp': 'MSigDB: Canonical Pathways (C2-CP)',
};

/** A gene in the result, with the module (cluster, counted from 0) it belongs to. */
export interface CommunityNodeRecord {
  id: string;
  cluster: string;
  entrez: string;
  symbol: string;
  description: string;
}

export interface CommunityEdgeRecord {
  source: string;
  target: string;
  weight: number;
}

/** One enriched term in one module; genes are node ids. */
export interface CommunityEnrichmentRecord {
  cluster: string;
  term: string;
  name: string;
  genes: readonly string[];
  p_value: number;
  q_value: number;
}

export interface CommunityRecord {
  query: { integration: string; giant_version: DataVersion; title?: string | null; entrez_list: readonly number[]; extended_universe?: boolean };
  nodes: readonly CommunityNodeRecord[];
  edges: readonly CommunityEdgeRecord[];
  enrichment: Readonly<Record<string, readonly CommunityEnrichmentRecord[]>>;
  enrichment_name_lookup?: Readonly<Record<string, string>>;
  /** Every query gene: [symbol, name] by Entrez ID. */
  query_entrez?: Readonly<Record<string, readonly [string, string]>>;
  /** The term release and network version the result was computed with. */
  versions?: { term: string; integration: string };
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

/** A gene connected to another in the result, in any module, with the connection's weight. */
export interface ModuleNeighbor {
  entrez: number;
  weight: number;
  module: Module | undefined;
}

export interface ModuleFilter {
  minimumSize: number;
  hideUnenriched: boolean;
}

export class ModuleResult {
  static readonly defaultFilter: ModuleFilter = { minimumSize: 2, hideUnenriched: true };

  readonly modules: readonly Module[];
  private readonly moduleByGene = new Map<number, Module>();
  private readonly entrezByNode: ReadonlyMap<string, number>;
  private edgeList: readonly (readonly [number, number, number])[] | undefined;
  private neighborsByGene: Map<number, { entrez: number; weight: number }[]> | undefined;

  constructor(readonly record: CommunityRecord) {
    this.entrezByNode = new Map(record.nodes.map((node) => [node.id, Number(node.entrez)]));
    const clusters = new Map<number, number[]>();
    for (const node of record.nodes) clusters.set(ModuleResult.moduleId(node.cluster), [...(clusters.get(ModuleResult.moduleId(node.cluster)) ?? []), Number(node.entrez)]);
    this.modules = [...clusters.entries()].sort(([a], [b]) => a - b).map(([id, genes]) => ({ id, label: `M${id}`, genes }));
    for (const module of this.modules) for (const gene of module.genes) this.moduleByGene.set(gene, module);
  }

  /** Modules are numbered from 1, as the live site labels them; clusters count from 0. */
  private static moduleId(cluster: string): number {
    return Number(cluster) + 1;
  }

  private entrezOf(nodes: readonly string[]): number[] {
    return nodes.flatMap((node) => {
      const entrez = this.entrezByNode.get(node);
      return entrez === undefined ? [] : [entrez];
    });
  }

  /** How a term database is named on screen, from the result's own lookup when it sends one. */
  databaseName(slug: string): string {
    return this.record.enrichment_name_lookup?.[slug] ?? termDatabaseNames[slug] ?? slug;
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

  /** Every query gene's symbol and name, when the result carries them, shaped like a gene search hit. */
  geneRecords(): GeneHitRecord[] | undefined {
    const genes = this.record.query_entrez;
    if (!genes) return undefined;
    return Object.entries(genes).map(([entrez, [symbol, name]]) => ({ entrez: Number(entrez), standard_name: symbol, description: name, aliases: '', versions_available: [this.version] }));
  }

  /** A query gene's symbol, from the result itself. */
  symbol(entrez: number): string | undefined {
    return this.record.query_entrez?.[String(entrez)]?.[0];
  }

  get entrez(): readonly number[] {
    return this.record.query.entrez_list;
  }

  /** Connections between genes in the result, as Entrez IDs and a weight. */
  get edges(): readonly (readonly [number, number, number])[] {
    this.edgeList ??= this.record.edges.flatMap(({ source, target, weight }) => {
      const [from, to] = this.entrezOf([source, target]);
      return from === undefined || to === undefined ? [] : [[from, to, weight] as const];
    });
    return this.edgeList;
  }

  /** Databases with at least one enriched term, Gene Ontology (BP) first, as the live site picks it. MAGE results send it as gene-ontology-bp-ncbi. */
  get databases(): string[] {
    const withTerms = Object.keys(this.record.enrichment).filter((database) => (this.record.enrichment[database]?.length ?? 0) > 0);
    const isGeneOntology = (slug: string) => Number(slug.startsWith('gene-ontology-bp'));
    return withTerms.sort((a, b) => isGeneOntology(b) - isGeneOntology(a));
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
      .filter((row) => ModuleResult.moduleId(row.cluster) === moduleId)
      .map((row) => ({ id: row.term, title: row.name, qValue: row.q_value, genes: this.entrezOf(row.genes) }))
      .sort((a, b) => a.qValue - b.qValue);
  }

  /** The enriched terms of a gene's own module that include it, most significant first. */
  termsOf(entrez: number, database: string): ModuleTerm[] {
    const module = this.moduleOf(entrez);
    return module ? this.terms(module.id, database).filter((term) => term.genes.includes(entrez)) : [];
  }

  /** Every gene a gene connects to in the result, strongest first. */
  neighbors(entrez: number): ModuleNeighbor[] {
    if (!this.neighborsByGene) {
      this.neighborsByGene = new Map();
      for (const [source, target, weight] of this.edges) {
        this.neighborsByGene.set(source, [...(this.neighborsByGene.get(source) ?? []), { entrez: target, weight }]);
        this.neighborsByGene.set(target, [...(this.neighborsByGene.get(target) ?? []), { entrez: source, weight }]);
      }
    }
    return (this.neighborsByGene.get(entrez) ?? []).map((neighbor) => ({ ...neighbor, module: this.moduleOf(neighbor.entrez) })).sort((a, b) => b.weight - a.weight);
  }

  isEnriched(moduleId: number, database: string): boolean {
    return (this.record.enrichment[database] ?? []).some((row) => ModuleResult.moduleId(row.cluster) === moduleId);
  }

  /** The modules the result shows, in module order. */
  shown(database: string, filter: ModuleFilter = ModuleResult.defaultFilter): Module[] {
    return this.modules.filter((module) => module.genes.length >= filter.minimumSize && (!filter.hideUnenriched || this.isEnriched(module.id, database)));
  }

  enrichedCount(database: string): number {
    return this.modules.filter((module) => this.isEnriched(module.id, database)).length;
  }
}
