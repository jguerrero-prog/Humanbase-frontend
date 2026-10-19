import { ApiClient } from './ApiClient';
import type { AppConfig } from './AppConfig';
import { GeneService } from './genes/GeneService';

export class HumanBase {
  readonly genes: GeneService;

  constructor(readonly client: ApiClient) {
    this.genes = new GeneService(client);
  }

  static fromConfig(config: AppConfig): HumanBase {
    return new HumanBase(new ApiClient(config.apiBase));
  }
}
