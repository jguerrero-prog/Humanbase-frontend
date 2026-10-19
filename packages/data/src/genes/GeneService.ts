import type { ApiClient } from '../ApiClient';
import { Gene, type GeneRecord } from './Gene';

export class GeneService {
  constructor(private readonly client: ApiClient) {}

  async get(entrez: number): Promise<Gene> {
    return new Gene(await this.client.get<GeneRecord>(`genes/${entrez}/`));
  }
}
