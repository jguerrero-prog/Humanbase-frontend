export interface TermDatabaseRecord {
  name: string;
  slug: string;
}

export interface TermRecord {
  title: string;
  identifier: string;
  database: TermDatabaseRecord;
  slim_terms?: readonly { title: string; identifier: string }[];
  annotation_count?: number;
}

export interface PublicationRecord {
  pmid: number;
  title: string;
  authors: string;
  date: string;
  journal: string;
}

export interface AnnotationRecord {
  term: TermRecord;
  database: TermDatabaseRecord;
  pub: PublicationRecord | null;
  evidence: string;
}

export interface PredictionRecord {
  score: number;
  term: TermRecord;
}

export interface FunctionEvidence {
  source: string;
  code: string;
  publication: PublicationRecord | null;
}

// The Gene Ontology evidence codes, by the name the code stands for.
const evidenceNames: Record<string, string> = {
  EXP: 'Inferred from experiment',
  IDA: 'Inferred from direct assay',
  IPI: 'Inferred from physical interaction',
  IMP: 'Inferred from mutant phenotype',
  IGI: 'Inferred from genetic interaction',
  IEP: 'Inferred from expression pattern',
  HTP: 'Inferred from high throughput experiment',
  HDA: 'Inferred from high throughput direct assay',
  HMP: 'Inferred from high throughput mutant phenotype',
  HGI: 'Inferred from high throughput genetic interaction',
  HEP: 'Inferred from high throughput expression pattern',
  TAS: 'Traceable author statement',
  NAS: 'Non-traceable author statement',
  IC: 'Inferred by curator',
  ISS: 'Inferred from sequence or structural similarity',
  IBA: 'Inferred from biological aspect of ancestor',
  IEA: 'Inferred from electronic annotation',
};

/** One term a gene is linked to: experimentally (confidence 1) or by prediction (the model's score). */
export class GeneFunction {
  constructor(
    readonly term: TermRecord,
    readonly confidence: number,
    readonly evidence: readonly FunctionEvidence[],
  ) {}

  static evidenceName(code: string): string {
    return evidenceNames[code] ?? code;
  }

  /** Merges a gene's annotations and predictions for one database, one row per term, strongest first. */
  static fromRecords(annotations: readonly AnnotationRecord[], predictions: readonly PredictionRecord[]): GeneFunction[] {
    const evidence = new Map<string, { term: TermRecord; items: FunctionEvidence[] }>();
    for (const record of annotations) {
      const entry = evidence.get(record.term.identifier) ?? { term: record.term, items: [] };
      entry.items.push({ source: record.database.name, code: record.evidence, publication: record.pub });
      evidence.set(record.term.identifier, entry);
    }
    const rows = [...evidence.values()].map(({ term, items }) => new GeneFunction(term, 1, items));
    for (const { term, score } of predictions) if (!evidence.has(term.identifier)) rows.push(new GeneFunction(term, score, []));
    return rows.sort((a, b) => b.confidence - a.confidence || a.term.title.localeCompare(b.term.title));
  }

  get name(): string {
    return this.term.title;
  }

  get identifier(): string {
    return this.term.identifier;
  }

  get isExperimental(): boolean {
    return this.evidence.length > 0;
  }

  /** The broad groups a term belongs to, such as a tissue's organ system. */
  get groups(): string[] {
    return (this.term.slim_terms ?? []).map((slim) => slim.title);
  }
}
