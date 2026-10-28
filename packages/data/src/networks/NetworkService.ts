import type { DataClient } from '../DataClient';
import type { DataVersion } from '../genes/Gene';
import { DataType, type DataTypeRecord } from './DataType';
import { Network, type NetworkRecord } from './Network';
import type { NetworkQuery } from './NetworkQuery';

const versionNumbers: Record<DataVersion, string> = { v1: '1', v3: '3' };

export class NetworkService {
  constructor(private readonly client: DataClient) {}

  /** The query genes and the 50 genes most related to them, with every connection's weight. */
  async get(query: NetworkQuery, signal?: AbortSignal): Promise<Network> {
    const params = { entrez: [...query.entrez].sort((a, b) => a - b), giant_version: query.version, datatypes: query.dataTypes.length ? [...query.dataTypes] : undefined };
    return new Network(await this.client.get<NetworkRecord>(`integrations/${query.slug}/network/`, params, signal));
  }

  async dataTypes(version: DataVersion): Promise<DataType[]> {
    const records = await this.client.get<DataTypeRecord[]>('datatypes/', { version: versionNumbers[version] });
    return records.map((record) => new DataType(record));
  }
}
