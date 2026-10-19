import type { components } from '../schema';

export type DataTypeRecord = components['schemas']['EdgeType'];

/** A kind of evidence a network can integrate, such as co-expression. MAGE has none to choose from. */
export class DataType {
  constructor(private readonly record: DataTypeRecord) {}

  get slug(): string {
    return this.record.slug;
  }

  get title(): string {
    return this.record.title;
  }

  get description(): string {
    return this.record.description;
  }
}
