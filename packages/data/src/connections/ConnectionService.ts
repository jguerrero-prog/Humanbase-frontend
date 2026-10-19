import type { DataClient } from '../DataClient';
import { ConnectionEvidence, ConnectionInNetwork, type ConnectionNetworkRecord, type EvidenceRecord } from './Connection';

export class ConnectionService {
  constructor(private readonly client: DataClient) {}

  // The API answers either order of the pair; asking in one order keeps requests and samples consistent.
  private static pair(a: number, b: number) {
    return { source: Math.min(a, b), target: Math.max(a, b) };
  }

  /** The datasets behind a connection in one network. */
  async evidence(slug: string, a: number, b: number): Promise<ConnectionEvidence> {
    return new ConnectionEvidence(await this.client.get<EvidenceRecord>(`integrations/${slug}/evidence/`, ConnectionService.pair(a, b)));
  }

  /** The connection's weight in every network, strongest first. */
  async inAllNetworks(a: number, b: number): Promise<ConnectionInNetwork[]> {
    const records = await this.client.get<ConnectionNetworkRecord[]>('integrations/edges/', ConnectionService.pair(a, b));
    return records.map((record) => new ConnectionInNetwork(record)).sort((x, y) => y.weight - x.weight);
  }
}
