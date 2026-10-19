import type { DataVersion } from '../genes/Gene';

export interface IntegrationRecord {
  slug: string;
  context: {
    title: string;
    term: { database?: { slug?: string } } | null;
    version: { identifier: string } | null;
  };
}

export type NetworkKind = 'global' | 'tissue' | 'process';

// One Humanbase network: the global one, a tissue or cell type, or a biological process (GIANT only).
export class Integration {
  constructor(private readonly record: IntegrationRecord) {}

  get slug(): string {
    return this.record.slug;
  }

  get title(): string {
    return this.record.context.title;
  }

  get version(): DataVersion {
    return this.record.context.version?.identifier === '3' ? 'v3' : 'v1';
  }

  get kind(): NetworkKind {
    if (this.slug === 'global' || this.slug === 'global-v3') return 'global';
    return this.record.context.term?.database?.slug === 'gene-ontology-bp' ? 'process' : 'tissue';
  }
}
