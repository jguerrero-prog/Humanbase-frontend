import type { DataVersion } from '../genes/Gene';

export const dataVersionNames: Record<DataVersion, string> = { v1: 'GIANT', v3: 'MAGE' };

// What a Networks page requests, read from and written to its URL so a refresh repeats the same request.
export class NetworkQuery {
  static readonly defaultVersion: DataVersion = 'v1';

  constructor(
    readonly entrez: readonly number[],
    readonly tissue: string | undefined = undefined,
    readonly version: DataVersion = NetworkQuery.defaultVersion,
    /** Data type slugs to integrate; empty means all of them. */
    readonly dataTypes: readonly string[] = [],
  ) {}

  static fromSearch(search: URLSearchParams): NetworkQuery {
    const entrez = [...new Set(search.getAll('entrez').map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    const version = search.get('version') === 'v3' ? 'v3' : NetworkQuery.defaultVersion;
    return new NetworkQuery(entrez, search.get('tissue') || undefined, version, [...new Set(search.getAll('datatype'))]);
  }

  get isEmpty(): boolean {
    return this.entrez.length === 0;
  }

  get versionName(): string {
    return dataVersionNames[this.version];
  }

  /** The integration slug to request: the chosen tissue, or the global network of this version. */
  get slug(): string {
    return this.tissue ?? (this.version === 'v3' ? 'global-v3' : 'global');
  }

  with(changes: { entrez?: readonly number[]; tissue?: string | undefined; version?: DataVersion; dataTypes?: readonly string[] }): NetworkQuery {
    return new NetworkQuery(changes.entrez ?? this.entrez, 'tissue' in changes ? changes.tissue : this.tissue, changes.version ?? this.version, changes.dataTypes ?? this.dataTypes);
  }

  toSearch(): URLSearchParams {
    const search = new URLSearchParams();
    for (const id of this.entrez) search.append('entrez', String(id));
    if (this.tissue) search.set('tissue', this.tissue);
    search.set('version', this.version);
    for (const type of this.dataTypes) search.append('datatype', type);
    return search;
  }

  get href(): string {
    return `/networks/?${this.toSearch()}`;
  }
}
