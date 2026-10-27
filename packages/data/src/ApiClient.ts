import { ApiError } from './ApiError';
import type { DataClient, Query } from './DataClient';

export class ApiClient implements DataClient {
  constructor(
    private readonly baseUrl: string,
    private readonly fetcher: typeof fetch = globalThis.fetch.bind(globalThis),
  ) {}

  get<T>(path: string, query?: Query, signal?: AbortSignal): Promise<T> {
    return this.request<T>('GET', path, query, undefined, signal);
  }

  post<T>(path: string, body: unknown, query?: Query, signal?: AbortSignal): Promise<T> {
    return this.request<T>('POST', path, query, body, signal);
  }

  async text(url: string, signal?: AbortSignal): Promise<string> {
    const response = await this.fetcher(url, { signal: signal ?? null });
    if (!response.ok) throw new ApiError(response.status, url);
    return response.text();
  }

  url(path: string, query: Query = {}): string {
    const params = new URLSearchParams();
    for (const [key, value] of Object.entries(query)) {
      for (const item of [value].flat()) if (item !== undefined) params.append(key, String(item));
    }
    const search = params.size ? `?${params}` : '';
    return `${this.baseUrl.replace(/\/$/, '')}/${path.replace(/^\//, '')}${search}`;
  }

  private async request<T>(method: 'GET' | 'POST', path: string, query?: Query, body?: unknown, signal?: AbortSignal): Promise<T> {
    const url = this.url(path, query);
    const init: RequestInit = { method, headers: { Accept: 'application/json' }, signal: signal ?? null };
    if (body instanceof FormData) init.body = body;
    else if (body !== undefined) {
      init.headers = { ...init.headers, 'Content-Type': 'application/json' };
      init.body = JSON.stringify(body);
    }
    const response = await this.fetcher(url, init);
    if (!response.ok) throw new ApiError(response.status, url, await response.json().catch(() => undefined));
    return (await response.json()) as T;
  }
}
