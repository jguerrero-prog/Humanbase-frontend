export type QueryValue = string | number | boolean | undefined;
export type Query = Record<string, QueryValue | readonly QueryValue[]>;

/** Where services get data from: the live API (ApiClient), bundled samples (SampleClient) or a fork's own engine. */
export interface DataClient {
  get<T>(path: string, query?: Query): Promise<T>;
  /** A FormData body is sent as multipart, for file uploads; anything else as JSON. */
  post<T>(path: string, body: unknown, query?: Query): Promise<T>;
  /** A text file the API links to, such as a job's result file, by its full URL. */
  text(url: string): Promise<string>;
  /** True when the client answers only for recorded examples, as SampleClient does; screens then explain why other genes or regions have no data. */
  readonly examplesOnly?: boolean;
}
