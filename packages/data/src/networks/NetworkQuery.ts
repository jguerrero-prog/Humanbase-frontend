import type { DataVersion } from '../genes/Gene';

/** A second network drawn beside the first: same genes and data version, its own tissue and data types. */
export interface ComparedNetwork {
  tissue: string | undefined;
  dataTypes: readonly string[];
}

const globalSlug = 'global';

// MAGE comes first, as the current version; GIANT stays for earlier results.
export const dataVersionNames: Record<DataVersion, string> = { v3: 'MAGE', v1: 'GIANT' };

// What a Networks page requests, read from and written to its URL so a refresh repeats the same request.
export class NetworkQuery {
  static readonly defaultVersion: DataVersion = 'v3';

  constructor(
    readonly entrez: readonly number[],
    readonly tissue: string | undefined = undefined,
    readonly version: DataVersion = NetworkQuery.defaultVersion,
    /** Data type slugs to integrate; empty means all of them. */
    readonly dataTypes: readonly string[] = [],
    /** The biological process network chosen in the Process network tab. */
    readonly process: string | undefined = undefined,
    readonly compare: ComparedNetwork | undefined = undefined,
  ) {}

  static fromSearch(search: URLSearchParams): NetworkQuery {
    const entrez = [...new Set(search.getAll('entrez').map(Number).filter((id) => Number.isInteger(id) && id > 0))];
    // A shared link keeps the version it names; a link without one opens the default.
    const named = search.get('version');
    const version = named === 'v1' || named === 'v3' ? named : NetworkQuery.defaultVersion;
    const compared = search.get('compare');
    const compare = compared ? { tissue: compared === globalSlug ? undefined : compared, dataTypes: [...new Set(search.getAll('compare_datatype'))] } : undefined;
    return new NetworkQuery(entrez, search.get('tissue') || undefined, version, [...new Set(search.getAll('datatype'))], search.get('process') || undefined, compare);
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

  with(changes: { entrez?: readonly number[]; tissue?: string | undefined; version?: DataVersion; dataTypes?: readonly string[]; process?: string | undefined; compare?: ComparedNetwork | undefined }): NetworkQuery {
    const version = changes.version ?? this.version;
    return new NetworkQuery(
      changes.entrez ?? this.entrez,
      'tissue' in changes ? changes.tissue : this.tissue,
      version,
      changes.dataTypes ?? this.dataTypes,
      'process' in changes ? changes.process : this.process,
      // Tissue slugs belong to one data version, so changing the version ends a comparison.
      'compare' in changes ? changes.compare : version === this.version ? this.compare : undefined,
    );
  }

  /** The request for the compared network, made with the same genes and data version. */
  get compared(): NetworkQuery | undefined {
    return this.compare && new NetworkQuery(this.entrez, this.compare.tissue, this.version, this.compare.dataTypes);
  }

  /** Removes the first network, so the compared one takes its place. */
  withoutFirst(): NetworkQuery {
    return this.compare ? new NetworkQuery(this.entrez, this.compare.tissue, this.version, this.compare.dataTypes, this.process) : this;
  }

  /** The request for the chosen process network. Process networks exist for GIANT only. */
  get processNetwork(): NetworkQuery | undefined {
    return this.process ? new NetworkQuery(this.entrez, this.process, 'v1', this.dataTypes) : undefined;
  }

  toSearch(): URLSearchParams {
    const search = new URLSearchParams();
    for (const id of this.entrez) search.append('entrez', String(id));
    if (this.tissue) search.set('tissue', this.tissue);
    search.set('version', this.version);
    for (const type of this.dataTypes) search.append('datatype', type);
    if (this.process) search.set('process', this.process);
    if (this.compare) {
      search.set('compare', this.compare.tissue ?? globalSlug);
      for (const type of this.compare.dataTypes) search.append('compare_datatype', type);
    }
    return search;
  }

  get href(): string {
    return `/networks/?${this.toSearch()}`;
  }
}
