import { ApiClient } from './ApiClient';
import type { AppConfig } from './AppConfig';
import type { DataClient } from './DataClient';
import { ConnectionService } from './connections/ConnectionService';
import { GeneFunctionService } from './functions/GeneFunctionService';
import { TermService } from './functions/TermService';
import { GeneService } from './genes/GeneService';
import { IntegrationService } from './networks/IntegrationService';
import { NetworkService } from './networks/NetworkService';
import { SampleClient } from './sample/SampleClient';
import { GeneSearchService } from './search/GeneSearchService';

export class Humanbase {
  readonly genes: GeneService;
  readonly search: GeneSearchService;
  readonly integrations: IntegrationService;
  readonly networks: NetworkService;
  readonly functions: GeneFunctionService;
  readonly terms: TermService;
  readonly connections: ConnectionService;

  constructor(
    readonly client: DataClient,
    readonly showsSamples = client instanceof SampleClient,
  ) {
    this.genes = new GeneService(client);
    this.search = new GeneSearchService(client);
    this.integrations = new IntegrationService(client);
    this.networks = new NetworkService(client);
    this.functions = new GeneFunctionService(client);
    this.terms = new TermService(client);
    this.connections = new ConnectionService(client);
  }

  static fromConfig(config: AppConfig): Humanbase {
    return new Humanbase(config.api ? new ApiClient(config.apiBase) : SampleClient.bundled());
  }
}
