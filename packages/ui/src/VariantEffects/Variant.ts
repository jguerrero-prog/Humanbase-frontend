/** The variant's name, with Sei's top sequence class, such as VWC2 · P Promoter. */
export const variantName = (variant: Pick<Variant, 'name' | 'topClass'>) => (variant.topClass ? `${variant.name} · ${variant.topClass}` : variant.name);

export interface Variant {
  id: string;
  chromosome: string;
  position: number;
  /** The allele change, such as G>T. */
  change: string;
  /** The gene or annotation nearest the variant. */
  name: string;
  /** Sei: the sequence class the variant changes most, such as P Promoter. */
  topClass?: string | undefined;
  scores: Readonly<Record<string, number>>;
}

export interface VariantScore {
  key: string;
  label: string;
}

const positions = new Intl.NumberFormat('en-US');

export const variantLocation = (variant: Pick<Variant, 'chromosome' | 'position'>) => `${variant.chromosome}:${positions.format(variant.position)}`;

export const variantLabel = (variant: Pick<Variant, 'chromosome' | 'position' | 'change'>) => `${variantLocation(variant)} ${variant.change}`;

/** A variant's score as the table, plot and focus line show it, to two decimals. */
export const variantScore = (variant: Pick<Variant, 'scores'>, key: string) => (variant.scores[key] ?? 0).toFixed(2);

const chromosomeRank = (name: string) => {
  const id = name.replace(/^chr/i, '');
  const number = Number(id);
  return Number.isNaN(number) ? 100 + id.charCodeAt(0) : number;
};

/** Variants in genome order: chromosome 1 to 22, then X and Y, then position. */
export const byGenomePosition = (a: Pick<Variant, 'chromosome' | 'position'>, b: Pick<Variant, 'chromosome' | 'position'>) => chromosomeRank(a.chromosome) - chromosomeRank(b.chromosome) || a.position - b.position;
