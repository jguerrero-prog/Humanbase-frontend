export type QueryValue = string | number | boolean | undefined;
export type Query = Record<string, QueryValue | readonly QueryValue[]>;

/** Where services get data from: the live API (ApiClient), bundled samples (SampleClient) or a fork's own engine. */
export interface DataClient {
  get<T>(path: string, query?: Query): Promise<T>;
  post<T>(path: string, body: unknown, query?: Query): Promise<T>;
}
