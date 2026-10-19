import type { Query } from '../DataClient';

// Also imported by scripts/record-samples.mjs, so it uses only syntax Node can strip.
export type SampleMethod = 'GET' | 'POST';

function hash(text: string): string {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 0x01000193);
  return (value >>> 0).toString(16).padStart(8, '0');
}

// An upload is keyed by its fields and the file's name, not the file's bytes.
function payloadOf(body: unknown): unknown {
  if (!(body instanceof FormData)) return body ?? null;
  return Object.fromEntries([...body.entries()].map(([name, value]) => [name, typeof value === 'string' ? value : value.name]));
}

// A file the API links to, such as a result file on S3, is kept under files/ with its host and path.
function routeOf(path: string): string {
  if (/^https?:\/\//.test(path)) {
    const url = new URL(path);
    return `files/${url.host}${url.pathname}`.replace(/\/+$/, '');
  }
  return path.replace(/^\/?(api\/)?/, '').replace(/\/+$/, '');
}

/** The file name, without .json, that holds the recorded response for one request. */
export function sampleKey(method: SampleMethod, path: string, query: Query = {}, body?: unknown): string {
  const route = routeOf(path);
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query).sort(([a], [b]) => a.localeCompare(b))) {
    for (const item of [value].flat()) if (item !== undefined) params.append(key, String(item));
  }
  // Long queries, such as every gene in a network, become a hash so the file name stays within file system limits.
  const encoded = String(params);
  const search = !params.size ? '' : encoded.length > 120 ? `@query-${hash(encoded)}` : `@${encoded}`;
  const payload = method === 'POST' ? `@post-${hash(JSON.stringify(payloadOf(body)))}` : '';
  return `${route}${search}${payload}`;
}
