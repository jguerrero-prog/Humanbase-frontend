import type { DataVersion } from '../genes/Gene';

export const dataVersionNames: Record<DataVersion, string> = { v1: 'GIANT', v3: 'MAGE' };

// What a Networks page shows, read from and written to its URL so a refresh repeats the same request.
export class NetworkQuery {
  static readonly defaultVersion: DataVersion = 'v1';

  constructor(
    readonly entrez: readonly number[],
    readonly tissue: string | undefined = undefined,
    readonly version: DataVersion = NetworkQuery.defaultVersion,
  ) {}

  static fromSearch(search: URLSearchParams): NetworkQuery {
    const entrez = [...new Set(search.getAll('entrez').map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    const version = search.get('version') === 'v3' ? 'v3' : NetworkQuery.defaultVersion;
    return new NetworkQuery(entrez, search.get('tissue') || undefined, version);
  }

  get isEmpty(): boolean {
    return this.entrez.length === 0;
  }

  get versionName(): string {
    return dataVersionNames[this.version];
  }

  toSearch(): URLSearchParams {
    const search = new URLSearchParams();
    for (const id of this.entrez) search.append('entrez', String(id));
    if (this.tissue) search.set('tissue', this.tissue);
    search.set('version', this.version);
    return search;
  }

  get href(): string {
    return `/networks/?${this.toSearch()}`;
  }
}
