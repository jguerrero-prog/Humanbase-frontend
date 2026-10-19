import type { DataVersion } from './Gene';

export interface GeneHitRecord {
  entrez: number;
  standard_name: string;
  aliases: string;
  description: string;
  versions_available: readonly string[];
}

// A gene as gene search returns it: lighter than the full record, but it says which networks include it.
export class GeneHit {
  constructor(private readonly record: GeneHitRecord) {}

  get entrez(): number {
    return this.record.entrez;
  }

  get symbol(): string {
    return this.record.standard_name;
  }

  get name(): string {
    return this.record.description;
  }

  get aliases(): string[] {
    return this.record.aliases.split('|').filter(Boolean);
  }

  get isInAnyNetwork(): boolean {
    return this.record.versions_available.length > 0;
  }

  isInVersion(version: DataVersion): boolean {
    return this.record.versions_available.includes(version);
  }

  /** The alias that matched what was typed, when the symbol itself didn't. */
  matchedAlias(typed: string): string | undefined {
    const term = typed.trim().toLowerCase();
    if (this.symbol.toLowerCase() === term) return undefined;
    return this.aliases.find((alias) => alias.toLowerCase() === term);
  }
}
