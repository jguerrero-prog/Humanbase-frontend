export type QueryValue = string | number | boolean | undefined;
export type Query = Record<string, QueryValue | readonly QueryValue[]>;

/** Where services get data from: the live API (ApiClient), bundled samples (SampleClient) or a fork's own engine. An aborted signal cancels the request. */
export interface DataClient {
  get<T>(path: string, query?: Query, signal?: AbortSignal): Promise<T>;
  /** A FormData body is sent as multipart, for file uploads; anything else as JSON. */
  post<T>(path: string, body: unknown, query?: Query, signal?: AbortSignal): Promise<T>;
  /** A text file the API links to, such as a job's result file, by its full URL. */
  text(url: string, signal?: AbortSignal): Promise<string>;
}
