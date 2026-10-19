import type { DataClient } from '../DataClient';
import { ApiError } from '../ApiError';
import type { GeneLocator, GeneSpan } from './S3GeneLocator';

/** Answers gene lookups from recorded spans, so a gene search makes no request while the API is off. */
export class SampleGeneLocator implements GeneLocator {
  constructor(private readonly client: DataClient) {}

  async locate(name: string): Promise<GeneSpan | undefined> {
    try {
      return await this.client.get<GeneSpan>(`genome/genes/${name.trim().toLowerCase()}`);
    } catch (error) {
      if (error instanceof ApiError && error.isNotFound) return undefined;
      throw error;
    }
  }
}
