// The schema leaves the body undescribed; this is what GET /api/deepsea/jobs/{id}/in_silico_mutagenesis/ returns.
export interface InsilicoRecord {
  /** One "position,ref,alt,value" line per substitution, three per base. */
  positions: string[];
  /** Value cutoffs the live site colors by, from lowest to highest. */
  percentile?: number[];
}

export interface Substitution {
  position: number;
  ref: string;
  alt: string;
  /** Log2 fold change of the feature's odds: below 0 the mutation lowers the feature, above 0 it raises it. */
  value: number;
}

/** One sequence's in silico mutagenesis for one chromatin feature. */
export class InsilicoResult {
  readonly substitutions: readonly Substitution[];
  private readonly byPosition = new Map<number, Substitution[]>();

  constructor(record: InsilicoRecord) {
    this.substitutions = record.positions.map((line) => {
      const [position = '', ref = '', alt = '', value = ''] = line.split(',');
      return { position: Number(position), ref, alt, value: Number(value) };
    });
    for (const item of this.substitutions) this.byPosition.set(item.position, [...(this.byPosition.get(item.position) ?? []), item]);
  }

  /** The number of bases in the sequence. */
  get length(): number {
    return this.byPosition.size;
  }

  at(position: number): readonly Substitution[] {
    return this.byPosition.get(position) ?? [];
  }

  reference(position: number): string | undefined {
    return this.at(position)[0]?.ref;
  }

  /** Positions start to start + size - 1, each with its reference base and every substitution's value. */
  columns(start: number, size: number): { position: number; reference: string; values: Record<string, number> }[] {
    return Array.from({ length: size }, (_, index) => start + index)
      .filter((position) => this.byPosition.has(position))
      .map((position) => ({ position, reference: this.reference(position) ?? '', values: Object.fromEntries(this.at(position).map((item) => [item.alt, item.value])) }));
  }

  /** The largest change in each run of `size` bases, for the overview of the whole sequence. */
  strongestPer(size: number): Substitution[] {
    const bins: Substitution[] = [];
    for (const item of this.substitutions) {
      const bin = Math.floor(item.position / size);
      const current = bins[bin];
      if (!current || Math.abs(item.value) > Math.abs(current.value)) bins[bin] = item;
    }
    return bins.filter(Boolean);
  }

  /** The substitutions with the largest change, either way. */
  strongest(count: number): Substitution[] {
    return [...this.substitutions].sort((a, b) => Math.abs(b.value) - Math.abs(a.value)).slice(0, count);
  }

  csv(): string {
    return ['position,ref,alt,log2_fold_change', ...this.substitutions.map((item) => `${item.position},${item.ref},${item.alt},${item.value}`)].join('\n');
  }
}

/** Reads a sequence name such as known_CEBP_binding_increase-GtoT__chr1_109816591_109818590 for its genome span. */
export function sequenceSpan(name: string): { label: string; chromosome: string; start: number; end: number } | undefined {
  const match = /^(.*?)_+(chr[0-9XYM]+)_(\d+)_(\d+)$/i.exec(name);
  if (!match) return undefined;
  const [, raw = '', chromosome = '', start = '', end = ''] = match;
  const label = raw.replace(/-([ACGT])to([ACGT])$/, ' $1>$2').replace(/-ReferenceAllele$/, ' reference allele');
  return { label, chromosome, start: Number(start), end: Number(end) };
}
