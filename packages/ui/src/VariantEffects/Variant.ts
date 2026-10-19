export interface Variant {
  id: string;
  chromosome: string;
  position: number;
  /** The allele change, such as G>T. */
  change: string;
  /** The gene or annotation nearest the variant. */
  name: string;
  scores: Readonly<Record<string, number>>;
}

export interface VariantScore {
  key: string;
  label: string;
}

const positions = new Intl.NumberFormat('en-US');

export const variantLocation = (variant: Variant) => `${variant.chromosome}:${positions.format(variant.position)}`;

export const variantLabel = (variant: Variant) => `${variantLocation(variant)} ${variant.change}`;

const chromosomeRank = (name: string) => {
  const id = name.replace(/^chr/i, '');
  const number = Number(id);
  return Number.isNaN(number) ? 100 + id.charCodeAt(0) : number;
};

/** Variants in genome order: chromosome 1 to 22, then X and Y, then position. */
export const byGenomePosition = (a: Variant, b: Variant) => chromosomeRank(a.chromosome) - chromosomeRank(b.chromosome) || a.position - b.position;
