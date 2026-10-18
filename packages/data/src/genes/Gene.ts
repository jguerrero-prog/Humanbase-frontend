import type { components } from '../schema';

export type GeneRecord = components['schemas']['GeneDetail'];
export type DataVersion = 'v1' | 'v3';

export class Gene {
  constructor(private readonly record: GeneRecord) {}

  get entrez(): number {
    return this.record.entrez;
  }

  get symbol(): string {
    return this.record.standard_name ?? this.record.systematic_name;
  }

  get name(): string {
    return this.record.description;
  }

  get aliases(): readonly string[] {
    return this.record.aliases;
  }

  get isInAnyNetwork(): boolean {
    return this.record.versions_available.length > 0;
  }

  isInVersion(version: DataVersion): boolean {
    return this.record.versions_available.includes(version);
  }
}
