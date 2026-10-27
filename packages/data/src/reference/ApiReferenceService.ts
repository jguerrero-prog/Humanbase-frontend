import { ApiError } from '../ApiError';
import type { DataClient } from '../DataClient';
import { ApiReference, type ApiRequest } from './ApiReference';
import type { OpenApiDocument } from './OpenApi';

export type ApiResult = { ok: true; body: unknown } | { ok: false; status: number; body: unknown; sampleMissing: boolean };

export class ApiReferenceService {
  constructor(
    private readonly client: DataClient,
    private readonly apiBase = '/api',
  ) {}

  /** The API's full address, such as https://humanbase.io/api, for the addresses and curl commands the page shows. */
  get base(): string {
    return new URL(this.apiBase, globalThis.location?.origin ?? 'https://humanbase.io').href.replace(/\/$/, '');
  }

  async reference(): Promise<ApiReference> {
    return new ApiReference(await this.client.get<OpenApiDocument>('schema/', { format: 'json' }));
  }

  /** Sends a "Try it" request and keeps an error's status and body to show, rather than throwing. */
  async send(request: ApiRequest): Promise<ApiResult> {
    try {
      const body = request.method === 'GET' ? await this.client.get(request.route, request.query) : await this.client.post(request.route, request.body, request.query);
      return { ok: true, body };
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
      return { ok: false, status: error.status, body: error.details ?? null, sampleMissing: error.url.startsWith('sample:') };
    }
  }
}
