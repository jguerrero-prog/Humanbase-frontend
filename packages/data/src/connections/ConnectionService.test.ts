import type { DataClient, Query } from '../DataClient';
import type { ConnectionNetworkRecord, EvidenceRecord } from './Connection';
import { ConnectionService } from './ConnectionService';

const network = (slug: string, posterior: number): ConnectionNetworkRecord => ({ slug, posterior, context: { title: slug, term: null, version: null } });

class FakeClient implements DataClient {
  readonly requests: { path: string; query?: Query | undefined }[] = [];

  constructor(private readonly answer: unknown) {}

  get<T>(path: string, query?: Query): Promise<T> {
    this.requests.push({ path, query });
    return Promise.resolve(this.answer as T);
  }

  post<T>(): Promise<T> {
    return Promise.reject(new Error('not used'));
  }

  text(): Promise<string> {
    return Promise.reject(new Error('not used'));
  }
}

describe('ConnectionService', () => {
  it('asks for a pair lowest gene first, whichever order it is given in', async () => {
    const evidence: EvidenceRecord = { datatypes: [], datasets: [] };
    const client = new FakeClient(evidence);
    const service = new ConnectionService(client);
    await service.evidence('blood', 7185, 6348);
    await service.evidence('blood', 6348, 7185);
    expect(client.requests).toEqual([
      { path: 'integrations/blood/evidence/', query: { source: 6348, target: 7185 } },
      { path: 'integrations/blood/evidence/', query: { source: 6348, target: 7185 } },
    ]);
  });

  it('lists the pair in every network, strongest first', async () => {
    const client = new FakeClient([network('liver', 0.2), network('blood', 0.9), network('global', 0.5)]);
    const connections = await new ConnectionService(client).inAllNetworks(7185, 6348);
    expect(client.requests).toEqual([{ path: 'integrations/edges/', query: { source: 6348, target: 7185 } }]);
    expect(connections.map((connection) => [connection.network.slug, connection.weight])).toEqual([
      ['blood', 0.9],
      ['global', 0.5],
      ['liver', 0.2],
    ]);
  });
});
