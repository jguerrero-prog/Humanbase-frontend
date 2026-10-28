import type { UseQueryResult } from '@tanstack/react-query';

/** The first failed query's error, and a retry for only the queries that failed. */
export function queryFailures(queries: readonly Pick<UseQueryResult, 'isError' | 'error' | 'refetch'>[]) {
  const failed = queries.filter((query) => query.isError);
  return { error: failed[0]?.error, refetch: () => failed.forEach((query) => void query.refetch()) };
}
