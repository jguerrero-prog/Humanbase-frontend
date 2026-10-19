import type { DataClient } from '../DataClient';
import { Gene, type GeneRecord } from './Gene';

export class GeneService {
  constructor(private readonly client: DataClient) {}

  async get(entrez: number): Promise<Gene> {
    return new Gene(await this.client.get<GeneRecord>(`genes/${entrez}/`));
  }
}
