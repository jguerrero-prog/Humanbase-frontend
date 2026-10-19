import { ApiClient } from './ApiClient';
import type { AppConfig } from './AppConfig';
import type { DataClient } from './DataClient';
import { ConnectionService } from './connections/ConnectionService';
import { GeneFunctionService } from './functions/GeneFunctionService';
import { TermService } from './functions/TermService';
import { GeneService } from './genes/GeneService';
import { DeepseaService } from './deepsea/DeepseaService';
import { NetwasService } from './jobs/NetwasService';
import { IntegrationService } from './networks/IntegrationService';
import { ModuleService } from './modules/ModuleService';
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
  readonly modules: ModuleService;
  readonly netwas: NetwasService;
  readonly deepsea: DeepseaService;

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
    this.modules = new ModuleService(client);
    this.netwas = new NetwasService(client);
    this.deepsea = new DeepseaService(client);
  }

  static fromConfig(config: AppConfig): Humanbase {
    return new Humanbase(config.api ? new ApiClient(config.apiBase) : SampleClient.bundled());
  }
}
