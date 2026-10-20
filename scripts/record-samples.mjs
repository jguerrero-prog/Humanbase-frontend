import { mkdirSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleKey } from '../packages/data/src/sample/sampleKey.ts';

const args = process.argv.slice(2);
const only = args.find((arg) => arg.startsWith('--only='))?.slice('--only='.length);
const target = (args.find((arg) => !arg.startsWith('--')) ?? process.env.HB_API_PROXY_TARGET ?? 'https://hb.flatironinstitute.org').replace(/\/$/, '');
const { endpoints, geneLookups } = JSON.parse(readFileSync(new URL('../packages/data/endpoints.json', import.meta.url), 'utf8'));
const samplesDir = fileURLToPath(new URL('../packages/data/samples/', import.meta.url));

// Samples over 100 KB skip the indentation, which only helps reading small ones.
const compactOver = 100 * 1024;
function writeSample(file, recorded) {
  const indented = JSON.stringify(recorded, null, 2);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, `${indented.length > compactOver ? JSON.stringify(recorded) : indented}\n`);
}

// --compact rewrites the samples already recorded by the same rule, without asking the API.
if (args.includes('--compact')) {
  const files = readdirSync(samplesDir, { recursive: true }).filter((name) => name.endsWith('.json')).map((name) => join(samplesDir, name));
  for (const file of files) writeSample(file, JSON.parse(readFileSync(file, 'utf8')));
  console.log(`Checked ${files.length} samples`);
  process.exit(0);
}

// Drops long text the screens never show, such as term descriptions, wherever it appears in a response.
function without(value, keys) {
  if (Array.isArray(value)) return value.map((item) => without(item, keys));
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).filter(([key]) => !keys.includes(key)).map(([key, item]) => [key, without(item, keys)]));
}

// Rounds long decimals, so large score tables stay small enough to bundle.
function rounded(value, digits) {
  if (Array.isArray(value)) return value.map((item) => rounded(item, digits));
  if (typeof value === 'number' && !Number.isInteger(value)) return Number(value.toFixed(digits));
  if (value === null || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => [key, rounded(item, digits)]));
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
  const { path, body, omit, digits } = typeof sample === 'string' ? { path: sample } : sample;
  // A sample may set its own omit list, replacing the endpoint's, and round its numbers to digits.
  // A full URL is a file the API links to, such as an example or result file, read as text.
  const isFile = /^https?:\/\//.test(path);
  const url = new URL(isFile ? path : target + path);
  if (endpoint.method === 'POST' && !endpoint.readOnly) return { sample: path, result: 'skipped (POST not marked readOnly)' };
  const key = isFile ? sampleKey('GET', path) : sampleKey(endpoint.method, url.pathname, queryOf(url), body);
  const init = { method: endpoint.method, headers: { Accept: 'application/json' } };
  if (body !== undefined) Object.assign(init, { body: JSON.stringify(body), headers: { ...init.headers, 'Content-Type': 'application/json' } });
  const response = await fetch(url, init);
  const shrink = (json) => (digits === undefined ? json : rounded(json, digits));
  const read = () => (isFile ? response.text() : response.json().then((json) => shrink(without(json, omit ?? endpoint.omit ?? []))));
  const recorded = { status: response.status, body: response.ok ? await read() : null };
  // A plain path keeps the key as written; a file URL would decode %3A into a colon.
  writeSample(join(samplesDir, `${key}.json`), recorded);
  return { sample: key, result: String(response.status) };
}

// Gene lookups read static files on S3, not the API; a gene that isn't found gets no file, which reads as not found.
async function recordGene(name) {
  const { S3GeneLocator } = await import('../packages/data/src/genome/S3GeneLocator.ts');
  const key = `genome/genes/${name.toLowerCase()}`;
  const span = await new S3GeneLocator(geneLookups.tracks).locate(name);
  if (!span) return { sample: key, result: 'not found, no file' };
  writeSample(join(samplesDir, `${key}.json`), { status: 200, body: span });
  return { sample: key, result: `${span.chrom}:${span.start}-${span.end}` };
}

const pathOf = (sample) => (typeof sample === 'string' ? sample : sample.path);
const genes = (geneLookups?.genes ?? []).filter((name) => !only || `genome/genes/${name.toLowerCase()}`.startsWith(only)).map(recordGene);
const jobs = [...endpoints.flatMap((endpoint) => (endpoint.samples ?? []).filter((sample) => !only || pathOf(sample).startsWith(only)).map((sample) => record(endpoint, sample))), ...genes];
console.log(`Recording ${jobs.length} samples from ${target}\n`);
console.table(await Promise.all(jobs));
