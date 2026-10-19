export type TissueDatabase = 'expecto-tissues' | 'clever-tissues';

interface PositionRecord {
  chr: string;
  position: number;
  ref: string;
}

interface SlimTermRecord {
  title: string;
}

interface TissueRecord {
  title: string;
  /** The resource, such as GTEx or Roadmap; CLEVER tissues all say scRNAseq. */
  description: string;
  identifier: string;
  slim_terms: readonly SlimTermRecord[];
  /** One entry per position: the predicted effect of each alternative allele. */
  variants: readonly Readonly<Record<string, number>>[];
}

// The schema leaves this response undescribed; this is what GET /api/genes/{entrez}/tissue_variants/ returns.
export interface TissueVariantsRecord {
  variants: readonly PositionRecord[];
  tissues: readonly TissueRecord[];
}

export interface GenePosition {
  chromosome: string;
  position: number;
  ref: string;
}

export interface TissueEffects {
  title: string;
  resource: string;
  /** Tissue systems for ExPecto, organs for ExPecto SC; empty when the API gives none. */
  groups: readonly string[];
  /** The strongest allele's effect at each position, or null where no allele was scored. */
  values: readonly (number | null)[];
  alleles: readonly Readonly<Record<string, number>>[];
}

export interface EffectRow {
  label: string;
  values: readonly (number | null)[];
}

export interface PositionAxis {
  chromosome: string;
  /** The shared prefix ticks count from, such as 150,226,000. */
  offset: number;
  ticks: number[];
}

const tickSteps = [50, 100, 200, 500, 1000, 2000, 5000, 10000];

/** A tissue's name without the resource the API adds to tell repeats apart, as in Spleen | GTEx. */
export function tissueTitle(title: string): string {
  return title.replace(/ \| [^|]+$/, '');
}

/** The value furthest from zero, keeping its sign; null when there is none. */
export function strongestOf(values: readonly (number | null)[]): number | null {
  let strongest: number | null = null;
  for (const value of values) if (value !== null && (strongest === null || Math.abs(value) > Math.abs(strongest))) strongest = value;
  return strongest;
}

/** A gene's predicted expression effects: every scored position near it, in every tissue or cell type. */
export class TissueVariants {
  readonly positions: GenePosition[];
  readonly tissues: TissueEffects[];

  constructor(record: TissueVariantsRecord) {
    this.positions = record.variants.map(({ chr, position, ref }) => ({ chromosome: chr, position, ref }));
    this.tissues = record.tissues.map((tissue) => ({
      title: tissueTitle(tissue.title),
      resource: tissue.description,
      groups: [...new Set(tissue.slim_terms.map((term) => term.title))],
      values: tissue.variants.map((alleles) => strongestOf(Object.values(alleles))),
      alleles: tissue.variants,
    }));
  }

  get chromosome(): string {
    return this.positions[0]?.chromosome ?? '';
  }

  /** Tissue systems or organs, alphabetically. */
  get groups(): string[] {
    return [...new Set(this.tissues.flatMap((tissue) => tissue.groups))].sort((a, b) => a.localeCompare(b));
  }

  get resources(): string[] {
    return [...new Set(this.tissues.map((tissue) => tissue.resource))].sort((a, b) => a.localeCompare(b));
  }

  /** One row per system or organ: at each position, the strongest effect among its tissues. */
  groupRows(): EffectRow[] {
    return this.groups.map((group) => {
      const members = this.tissues.filter((tissue) => tissue.groups.includes(group));
      return { label: group, values: this.positions.map((_, index) => strongestOf(members.map((tissue) => tissue.values[index] ?? null))) };
    });
  }

  tissuesIn(group?: string, resource?: string): TissueEffects[] {
    return this.tissues.filter((tissue) => (!group || tissue.groups.includes(group)) && (!resource || tissue.resource === resource));
  }

  /** A ruler for the positions: ticks are short offsets from a rounded shared prefix. */
  axis(): PositionAxis {
    const values = this.positions.map((item) => item.position);
    const low = Math.min(...values);
    const high = Math.max(...values);
    const offset = Math.floor(low / 1000) * 1000;
    const step = tickSteps.find((candidate) => (high - offset) / candidate <= 10) ?? tickSteps[tickSteps.length - 1] ?? 1000;
    const ticks: number[] = [];
    for (let tick = Math.floor((low - offset) / step) * step; tick <= high - offset + step / 2; tick += step) ticks.push(tick);
    return { chromosome: this.chromosome, offset, ticks };
  }

  /** The farthest-from-zero effect in the whole table, for summaries. */
  strongest(): { value: number; tissue: string; position: GenePosition } | undefined {
    let best: { value: number; tissue: string; position: GenePosition } | undefined;
    for (const tissue of this.tissues) {
      tissue.values.forEach((value, index) => {
        const position = this.positions[index];
        if (value !== null && position && (!best || Math.abs(value) > Math.abs(best.value))) best = { value, tissue: tissue.title, position };
      });
    }
    return best;
  }
}
