import { ApiClient } from './ApiClient';
import { AsdService } from './asd/AsdService';
import type { AppConfig } from './AppConfig';
import type { DataClient } from './DataClient';
import { ConnectionService } from './connections/ConnectionService';
import { GeneFunctionService } from './functions/GeneFunctionService';
import { TermService } from './functions/TermService';
import { GeneService } from './genes/GeneService';
import { SampleGeneLocator } from './genome/SampleGeneLocator';
import { S3GeneLocator } from './genome/S3GeneLocator';
import type { GenomeTracks } from './genome/GenomeTracks';
import { SampleGenomeTracks } from './genome/SampleGenomeTracks';
import { S3GenomeTracks } from './genome/S3GenomeTracks';
import { UserTracks } from './genome/UserTracks';
import { DeepseaService } from './deepsea/DeepseaService';
import { ExpectoService } from './expecto/ExpectoService';
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
  readonly expecto: ExpectoService;
  readonly asd: AsdService;
  readonly genomeTracks: GenomeTracks;
  /** The tracks people add from their own files or by address; also what genomeTracks reads through. */
  readonly userTracks: UserTracks;

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
    this.expecto = new ExpectoService(client);
    // Gene lookups and genome tracks read static files on S3, which also stay off while the API is off.
    this.asd = new AsdService(client, showsSamples ? new SampleGeneLocator(client) : new S3GeneLocator());
    const files = new S3GenomeTracks();
    this.userTracks = new UserTracks(showsSamples ? new SampleGenomeTracks(client) : files, files);
    this.genomeTracks = this.userTracks;
  }

  static fromConfig(config: AppConfig): Humanbase {
    return new Humanbase(config.api ? new ApiClient(config.apiBase) : SampleClient.bundled());
  }
}
