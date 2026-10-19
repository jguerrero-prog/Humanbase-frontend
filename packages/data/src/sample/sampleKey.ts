import type { Query } from '../DataClient';

// Also imported by scripts/record-samples.mjs, so it uses only syntax Node can strip.
export type SampleMethod = 'GET' | 'POST';

function hash(text: string): string {
  let value = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) value = Math.imul(value ^ text.charCodeAt(i), 0x01000193);
  return (value >>> 0).toString(16).padStart(8, '0');
}

/** The file name, without .json, that holds the recorded response for one request. */
export function sampleKey(method: SampleMethod, path: string, query: Query = {}, body?: unknown): string {
  const route = path.replace(/^\/?(api\/)?/, '').replace(/\/+$/, '');
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query).sort(([a], [b]) => a.localeCompare(b))) {
    for (const item of [value].flat()) if (item !== undefined) params.append(key, String(item));
  }
  const search = params.size ? `@${params}` : '';
  const payload = method === 'POST' ? `@post-${hash(JSON.stringify(body ?? null))}` : '';
  return `${route}${search}${payload}`;
}
