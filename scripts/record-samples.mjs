import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { sampleKey } from '../packages/data/src/sample/sampleKey.ts';

const args = process.argv.slice(2);
const only = args.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);
const target = (args.find((arg) => !arg.startsWith('--')) ?? process.env.HB_API_PROXY_TARGET ?? 'https://hb.flatironinstitute.org').replace(/\/$/, '');
const { endpoints } = JSON.parse(readFileSync(new URL('../packages/data/endpoints.json', import.meta.url), 'utf8'));
const samplesDir = new URL('../packages/data/samples/', import.meta.url);

// Drops long text the screens never show, such as term descriptions, wherever it appears in a response.
function without(value, keys) {
  if (Array.isArray(value)) return value.map((item) => without(item, keys));
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)).map(([key, item]) => [key, without(item, keys)]));
}

function queryOf(url) {
  const query = {};
  for (const key of new Set(url.searchParams.keys())) {
    const values = url.searchParams.getAll(key);
    query[key] = values.length > 1 ? values : values[0];
  }
  return query;
}

// Records one response per sample. POST samples run only on endpoints marked readOnly, so no job is ever submitted.
async function record(endpoint, sample) {
  const { path, body } = typeof sample === 'string' ? { path: sample } : sample;
  // A full URL is a file the API links to, such as an example or result file, read as text.
  const isFile = /^https?:\/\//.test(path);
  const url = new URL(isFile ? path : target + path);
  if (endpoint.method === 'POST' && !endpoint.readOnly) return { sample: path, result: 'skipped (POST not marked readOnly)' };
  const key = isFile ? sampleKey('GET', path) : sampleKey(endpoint.method, url.pathname, queryOf(url), body);
  const init = { method: endpoint.method, headers: { Accept: 'application/json' } };
  if (body !== undefined) Object.assign(init, { body: JSON.stringify(body), headers: { ...init.headers, 'Content-Type': 'application/json' } });
  const response = await fetch(url, init);
  const read = () => (isFile ? response.text() : response.json().then((json) => without(json, endpoint.omit ?? [])));
  const recorded = { status: response.status, body: response.ok ? await read() : null };
  const file = new URL(`${key}.json`, samplesDir);
  mkdirSync(dirname(file.pathname), { recursive: true });
  writeFileSync(file, `${JSON.stringify(recorded, null, 2)}\n`);
  return { sample: key, result: String(response.status) };
}

const pathOf = (sample) => (typeof sample === 'string' ? sample : sample.path);
const jobs = endpoints.flatMap((endpoint) => (endpoint.samples ?? []).filter((sample) => !only || pathOf(sample).startsWith(only)).map((sample) => record(endpoint, sample)));
console.log(`Recording ${jobs.length} samples from ${target}\n`);
console.table(await Promise.all(jobs));
