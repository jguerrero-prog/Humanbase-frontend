import { variantIdOf, type VariantSequence } from '@humanbase/data';

/** Previous and Next through a whole list of variants in its order, such as the 853 HGMD variants by disease name. */
export class VariantSteps<T extends VariantSequence> {
  private readonly indexOf: Map<string, number>;

  constructor(readonly variants: readonly T[]) {
    this.indexOf = new Map(variants.map((variant, index) => [variantIdOf(variant), index]));
  }

  previous(id: string | undefined): T | undefined {
    return this.step(id, -1);
  }

  next(id: string | undefined): T | undefined {
    return this.step(id, 1);
  }

  private step(id: string | undefined, by: number): T | undefined {
    const at = id === undefined ? undefined : this.indexOf.get(id);
    return at === undefined ? undefined : this.variants[at + by];
  }
}
