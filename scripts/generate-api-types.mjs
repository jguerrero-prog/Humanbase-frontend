import { writeFileSync } from 'node:fs';
import openapiTS, { astToString } from 'openapi-typescript';

const target = (process.argv[2] ?? process.env.HB_API_PROXY_TARGET ?? 'https://hb.flatironinstitute.org').replace(/\/$/, '');
const schema = new URL('/api/schema/', target);
const output = new URL('../packages/data/src/schema.d.ts', import.meta.url);

console.log(`Generating packages/data/src/schema.d.ts from ${schema}`);
writeFileSync(output, astToString(await openapiTS(schema)));
