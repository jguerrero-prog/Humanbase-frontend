import { ApiError } from '../ApiError';
import type { DataClient, Query } from '../DataClient';
import { sampleKey, type SampleMethod } from './sampleKey';

export interface RecordedResponse {
  status: number;
  body: unknown;
}

export type SampleLoaders = Record<string, () => Promise<unknown>>;

/** Answers requests from recorded responses. It never touches the network. */
export class SampleClient implements DataClient {
  constructor(private readonly loaders: SampleLoaders) {}

  static bundled(): SampleClient {
    const files = import.meta.glob<RecordedResponse>('../../samples/**/*.json', { import: 'default' });
    const loaders = Object.fromEntries(Object.entries(files).map(([file, load]) => [file.replace(/^\.\.\/\.\.\/samples\//, '').replace(/\.json$/, ''), load]));
    return new SampleClient(loaders);
  }

  get<T>(path: string, query?: Query): Promise<T> {
    return this.answer<T>('GET', path, query);
  }

  post<T>(path: string, body: unknown, query?: Query): Promise<T> {
    return this.answer<T>('POST', path, query, body);
  }

  has(method: SampleMethod, path: string, query?: Query, body?: unknown): boolean {
    return sampleKey(method, path, query, body) in this.loaders;
  }

  private async answer<T>(method: SampleMethod, path: string, query?: Query, body?: unknown): Promise<T> {
    const key = sampleKey(method, path, query, body);
    const load = this.loaders[key];
    if (!load) {
      console.warn(`No sample recorded for ${method} ${key}. Add it to endpoints.json and run pnpm samples:record.`);
      throw new ApiError(404, `sample:${key}`);
    }
    const recorded = (await load()) as RecordedResponse;
    if (recorded.status >= 400) throw new ApiError(recorded.status, `sample:${key}`);
    return recorded.body as T;
  }
}
