export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly url: string,
    /** The response body, when the API explains the error, such as a list of problems per field. */
    readonly details?: unknown,
  ) {
    super(`Humanbase API returned ${status} for ${url}`);
    this.name = 'ApiError';
  }

  get isNotFound(): boolean {
    return this.status === 404;
  }
}

/** No sample was recorded for this request, so a client that answers only for recorded examples can't answer it. */
export class SampleMissingError extends ApiError {
  constructor(url: string) {
    super(404, url);
    this.name = 'SampleMissingError';
  }
}
