import { sampleKey } from '../packages/data/src/sample/sampleKey.ts';

function queryOf(url) {
  const query = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length > 1 ? values : values[0];
  }
  return query;
}

/** Each sample endpoints.json lists for recording, with the file it is saved under and the status it must answer. */
export function plannedSamples(endpoints, target) {
  return endpoints.flatMap((endpoint) =>
    (endpoint.samples ?? []).map((sample) => {
      const { path, body, omit, digits, status = 200 } = typeof sample === 'string' ? { path: sample } : sample;
      // A full URL is a file the API links to, such as an example or result file, read as text.
      const isFile = /^https?:\/\//.test(path);
      const url = new URL(isFile ? path : target + path);
      // A plain path keeps the key as written; a file URL would decode %3A into a colon.
      const key = isFile ? sampleKey('GET', path) : sampleKey(endpoint.method, url.pathname, queryOf(url), body);
      return { endpoint, path, url, key, body, isFile, digits, status, omit: omit ?? endpoint.omit ?? [] };
    }),
  );
}

/** Samples made or recorded by hand, which pnpm samples:record never overwrites. */
export function handSamples(endpoints) {
  return endpoints.flatMap((endpoint) => [...(endpoint.handBuiltSamples?.files ?? []), ...(endpoint.recordedByHandSamples?.files ?? [])]);
}

/** Runs the tasks a few at a time; a failed task is reported and the rest still run. */
export async function settleInBatches(tasks, size) {
  const results = [];
  for (let start = 0; start < tasks.length; start += size) {
    results.push(...(await Promise.allSettled(tasks.slice(start, start + size).map((task) => task()))));
  }
  return results;
}
