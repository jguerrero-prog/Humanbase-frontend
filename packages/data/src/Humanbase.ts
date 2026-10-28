import { ApiClient } from './ApiClient';
import { AsdService } from './asd/AsdService';
import type { AppConfig } from './AppConfig';
import type { DataClient } from './DataClient';
import { ConnectionService } from './connections/ConnectionService';
import { GeneFunctionService } from './functions/GeneFunctionService';
import { TermService } from './functions/TermService';
import { GeneService } from './genes/GeneService';
import { SampleGeneLocator } from './genome/SampleGeneLocator';
import { S3GeneLocator, type GeneLocator } from './genome/S3GeneLocator';
import type { GenomeTracks } from './genome/GenomeTracks';
import { SampleGenomeTracks } from './genome/SampleGenomeTracks';
import { S3GenomeTracks } from './genome/S3GenomeTracks';
import { UserTracks } from './genome/UserTracks';
import { DeepseaService } from './deepsea/DeepseaService';
import { SeiHgmdService } from './deepsea/SeiHgmdService';
import { ExpectoService } from './expecto/ExpectoService';
import { NetwasService } from './jobs/NetwasService';
import { IntegrationService } from './networks/IntegrationService';
import { ModuleService } from './modules/ModuleService';
import { NetworkService } from './networks/NetworkService';
import { ApiReferenceService } from './reference/ApiReferenceService';
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
  readonly seiHgmd: SeiHgmdService;
  readonly expecto: ExpectoService;
  readonly asd: AsdService;
  readonly apiReference: ApiReferenceService;
  /** Finds a gene's span by name, for genome browser searches. */
  readonly geneLocator: GeneLocator;
  readonly genomeTracks: GenomeTracks;
  /** The tracks people add from their own files or by address; also what genomeTracks reads through. */
  readonly userTracks: UserTracks;

  /** The data covers only recorded examples, as with the API off (see DataClient.examplesOnly). */
  readonly examplesOnly: boolean;

  constructor(
    readonly client: DataClient,
    /** Where the API answers, as the app's config names it; the API reference shows full addresses from it. */
    apiBase = '/api',
  ) {
    this.examplesOnly = client.examplesOnly ?? false;
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
    this.seiHgmd = new SeiHgmdService(client);
    this.expecto = new ExpectoService(client);
    this.apiReference = new ApiReferenceService(client, apiBase);
    // Gene lookups and genome tracks read static files on S3, which also stay off while the API is off.
    this.geneLocator = this.examplesOnly ? new SampleGeneLocator(client) : new S3GeneLocator();
    this.asd = new AsdService(client, this.geneLocator);
    const files = new S3GenomeTracks();
    this.userTracks = new UserTracks(this.examplesOnly ? new SampleGenomeTracks(client) : files, files);
    this.genomeTracks = this.userTracks;
  }

  static fromConfig(config: AppConfig): Humanbase {
    const client = config.api ? new ApiClient(config.apiBase) : SampleClient.bundled();
    return new Humanbase(client, config.apiBase);
  }
}
