import { writeFileSync } from 'node:fs';
import openapiTS, { astToString } from 'openapi-typescript';
import { apiOrigin } from '../packages/data/src/origins.ts';

const target = apiOrigin(process.argv[2] || process.env.HB_API_PROXY_TARGET);
const schema = new URL('/api/schema/', target);
const output = new URL('../packages/data/src/schema.d.ts', import.meta.url);

console.log(`Generating packages/data/src/schema.d.ts from ${schema}`);
writeFileSync(output, astToString(await openapiTS(schema)));
