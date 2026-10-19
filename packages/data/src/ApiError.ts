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
