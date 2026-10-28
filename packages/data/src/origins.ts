/** The public Humanbase API, used when no other origin is given. */
export const publicApi = 'https://hb.flatironinstitute.org';

/** Humanbase's S3 bucket of static files: genome tracks, NetWAS examples and job results. */
export const filesBucket = 'https://s3-us-west-2.amazonaws.com/humanbase';

export const tracksBase = `${filesBucket}/tracks/`;

/** The API origin to use: the given one, such as HB_API_PROXY_TARGET, or the public API when it is unset or empty. */
export function apiOrigin(given?: string): string {
  return (given || publicApi).replace(/\/$/, '');
}
