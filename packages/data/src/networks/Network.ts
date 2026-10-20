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
    /** Average weight of this gene's connections to the query genes. */
    readonly score: number,
    /** How much more this gene connects to the query genes than to the rest of the network. */
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
  /** Genes to draw, counting the query genes, as the live site's "Maximum number of genes" does. */
  shown: number;
  minConfidence: number;
  prioritizeUniqueness: boolean;
}

export interface NetworkSubset {
  genes: NetworkGene[];
  edges: NetworkEdge[];
}

const mean = (values: readonly number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);

export class Network {
  static readonly fallbackConfidence = 0.5;

  readonly genes: readonly NetworkGene[];
  readonly edges: readonly NetworkEdge[];

  constructor(private readonly record: NetworkRecord) {
    const isQuery = record.genes.map((gene) => gene.query);
    const toQuery = record.genes.map((): number[] => []);
    const toOthers = record.genes.map((): number[] => []);
    for (const { source, target, weight } of record.edges) {
      (isQuery[target] ? toQuery : toOthers)[source]?.push(weight);
      (isQuery[source] ? toQuery : toOthers)[target]?.push(weight);
    }
    this.genes = record.genes.map((gene, index) => {
      const score = mean(toQuery[index] ?? []);
      return new NetworkGene(gene, score, score - mean(toOthers[index] ?? []));
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

  /** Every non-query gene, best first. */
  related(prioritizeUniqueness = false): NetworkGene[] {
    const key = prioritizeUniqueness ? (gene: NetworkGene) => gene.uniqueness : (gene: NetworkGene) => gene.score;
    return this.genes.filter((gene) => !gene.isQuery).sort((a, b) => key(b) - key(a) || a.symbol.localeCompare(b.symbol));
  }

  /** The genes and connections drawn for a set of view options. */
  subset({ shown, minConfidence, prioritizeUniqueness }: NetworkViewOptions): NetworkSubset {
    const query = this.queryGenes;
    const genes = [...query, ...this.related(prioritizeUniqueness).slice(0, Math.max(0, shown - query.length))];
    const kept = new Set(genes);
    const edges = this.edges.filter((edge) => edge.weight >= minConfidence && kept.has(edge.source) && kept.has(edge.target));
    return { genes, edges };
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
