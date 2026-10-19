import type { DataClient } from '../DataClient';
import type { DataVersion } from '../genes/Gene';
import { Integration, type IntegrationRecord, type NetworkKind } from './Integration';

export class IntegrationService {
  constructor(private readonly client: DataClient) {}

  async list(): Promise<Integration[]> {
    const records = await this.client.get<IntegrationRecord[]>('integrations/');
    return records.map((record) => new Integration(record));
  }

  /** The networks of one kind in one data version, in alphabetical order. */
  static pick(networks: readonly Integration[], kind: NetworkKind, version: DataVersion): Integration[] {
    return networks.filter((network) => network.kind === kind && network.version === version).sort((a, b) => a.title.localeCompare(b.title));
  }
}
