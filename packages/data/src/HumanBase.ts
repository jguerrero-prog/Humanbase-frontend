import { ApiClient } from './ApiClient';
import type { AppConfig } from './AppConfig';
import type { DataClient } from './DataClient';
import { GeneService } from './genes/GeneService';
import { SampleClient } from './sample/SampleClient';

export class HumanBase {
  readonly genes: GeneService;

  constructor(
    readonly client: DataClient,
    readonly showsSamples = client instanceof SampleClient,
  ) {
    this.genes = new GeneService(client);
  }

  static fromConfig(config: AppConfig): HumanBase {
    return new HumanBase(config.api ? new ApiClient(config.apiBase) : SampleClient.bundled());
  }
}
