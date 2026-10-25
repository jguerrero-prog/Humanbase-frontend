import type { components } from '../schema';

type CrossRef = components['schemas']['CrossRef'];

export interface NetworkGeneRecord {
  entrez: number;
  systematic_name: string;
  standard_name?: string | null;
  description: string;
  aliases: readonly string[];
  xrefs: readonly CrossRef[];
  query: boolean;
}

export interface NetworkEdgeRecord {
  source: number;
  target: number;
  weight: number;
}

/** The network response: genes, every pair's weight (edges point at positions in genes) and the suggested cutoff. */
export interface NetworkRecord {
  mincut: number | null;
  genes: readonly NetworkGeneRecord[];
  edges: readonly NetworkEdgeRecord[];
}

export class NetworkGene {
  constructor(
    private readonly record: NetworkGeneRecord,
    /** Average weight of this gene's connections to the query genes; NaN for a query gene with no other query gene. */
    readonly score: number,
    /** Its score over the average weight of all its connections, query genes included, as humanbase.io computes it. */
    readonly uniqueness: number,
  ) {}

  get entrez(): number {
    return this.record.entrez;
  }

  get symbol(): string {
    return this.record.standard_name || this.record.systematic_name;
  }

  get name(): string {
    return this.record.description;
  }

  get aliases(): readonly string[] {
    return this.record.aliases;
  }

  get xrefs(): readonly CrossRef[] {
    return this.record.xrefs;
  }

  get isQuery(): boolean {
    return this.record.query;
  }
}

export interface NetworkEdge {
  source: NetworkGene;
  target: NetworkGene;
  weight: number;
}

export interface NetworkViewOptions {
  /** How many top-ranked genes to draw, as the live site's "Maximum number of genes" does. Query genes are always drawn. */
  shown: number;
  minConfidence: number;
  prioritizeUniqueness: boolean;
}

export interface NetworkSubset {
  genes: NetworkGene[];
  edges: NetworkEdge[];
}

const mean = (values: readonly number[]) => values.reduce((sum, value) => sum + value, 0) / values.length;
// A lone query gene has no query genes to score against; humanbase.io ranks it first.
const rankKey = (value: number) => (Number.isNaN(value) ? Infinity : value);

export class Network {
  static readonly fallbackConfidence = 0.5;

  readonly genes: readonly NetworkGene[];
  readonly edges: readonly NetworkEdge[];

  constructor(private readonly record: NetworkRecord) {
    const isQuery = record.genes.map((gene) => gene.query);
    const toQuery = record.genes.map((): number[] => []);
    const toAll = record.genes.map((): number[] => []);
    for (const { source, target, weight } of record.edges) {
      if (isQuery[target]) toQuery[source]?.push(weight);
      if (isQuery[source]) toQuery[target]?.push(weight);
      toAll[source]?.push(weight);
      toAll[target]?.push(weight);
    }
    this.genes = record.genes.map((gene, index) => {
      const score = mean(toQuery[index] ?? []);
      return new NetworkGene(gene, score, score / mean(toAll[index] ?? []));
    });
    this.edges = record.edges.flatMap(({ source, target, weight }) => {
      const a = this.genes[source];
      const b = this.genes[target];
      return a && b ? [{ source: a, target: b, weight }] : [];
    });
  }

  /** The cutoff the API suggests for this network, or a middle value when it gives none. */
  get suggestedConfidence(): number {
    return this.record.mincut ?? Network.fallbackConfidence;
  }

  get queryGenes(): NetworkGene[] {
    return this.genes.filter((gene) => gene.isQuery);
  }

  /** Every gene, best first, query genes included, in the order humanbase.io ranks them. */
  ranked(prioritizeUniqueness = false): NetworkGene[] {
    const byScore = [...this.genes].sort((a, b) => rankKey(b.score) - rankKey(a.score));
    return prioritizeUniqueness ? byScore.sort((a, b) => rankKey(b.uniqueness) - rankKey(a.uniqueness)) : byScore;
  }

  /** Every non-query gene, best first. */
  related(prioritizeUniqueness = false): NetworkGene[] {
    return this.ranked(prioritizeUniqueness).filter((gene) => !gene.isQuery);
  }

  /** As humanbase.io draws it: query genes and the top `shown` ranked genes, connections above the cutoff, no unconnected non-query gene. */
  subset({ shown, minConfidence, prioritizeUniqueness }: NetworkViewOptions): NetworkSubset {
    const top = this.ranked(prioritizeUniqueness).slice(0, Math.max(0, shown));
    const candidates = new Set([...this.queryGenes, ...top.filter((gene) => !gene.isQuery)]);
    const edges = this.edges.filter((edge) => edge.weight > minConfidence && candidates.has(edge.source) && candidates.has(edge.target));
    const connected = new Set(edges.flatMap((edge) => [edge.source, edge.target]));
    return { genes: [...candidates].filter((gene) => gene.isQuery || connected.has(gene)), edges };
  }

  /** Requested genes the network left out, because they are in no network of this version. */
  missing(requested: readonly number[]): number[] {
    const found = new Set(this.queryGenes.map((gene) => gene.entrez));
    return requested.filter((entrez) => !found.has(entrez));
  }

  edgeBetween(a: number, b: number): NetworkEdge | undefined {
    return this.edges.find(({ source, target }) => (source.entrez === a && target.entrez === b) || (source.entrez === b && target.entrez === a));
  }
}
