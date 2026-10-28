import { readFileSync } from 'node:fs';
import { apiOrigin } from '../packages/data/src/origins.ts';

const target = apiOrigin(process.argv[2] || process.env.HB_API_PROXY_TARGET);
const { endpoints } = JSON.parse(readFileSync(new URL('../packages/data/endpoints.json', import.meta.url), 'utf8'));

async function check({ method, path, example, documented }) {
  if (method !== 'GET' || !example) return { path, result: 'skipped (not a read-only GET)' };
  try {
    const response = await fetch(target + example, { headers: { Accept: 'application/json' } });
    if (!response.ok) return { path, result: `FAIL ${response.status}`, failed: true };
    await response.json();
    return { path, result: documented ? 'ok' : 'ok (undocumented)' };
  } catch (error) {
    return { path, result: `FAIL ${error.message}`, failed: true };
  }
}

console.log(`Checking ${endpoints.length} endpoints against ${target}\n`);
const results = await Promise.all(endpoints.map(check));
console.table(results.map(({ path, result }) => ({ endpoint: path, result })));
if (results.some((r) => r.failed)) process.exit(1);
