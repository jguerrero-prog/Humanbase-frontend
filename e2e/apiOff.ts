import type { Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { sampleKey } from '../packages/data/src/sample/sampleKey.ts';

// The files the API links to on S3, such as example and result files and genome tracks, and Biodalliance, ours or its old host.
export const externalFiles = ['https://s3-us-west-2.amazonaws.com/humanbase/**', 'https://humanbase.s3.amazonaws.com/**', 'https://www.biodalliance.org/**', '**/biodalliance/**'];

/** Runs the web app with the API switched off and returns the requests it makes for Humanbase data, which should be none. */
export async function apiOff(page: Page): Promise<string[]> {
  const apiRequests: string[] = [];
  await page.route('**/config.json', (route) => route.fulfill({ json: { api: false, apiBase: '/api' } }));
  for (const pattern of ['**/api/**', ...externalFiles]) {
    await page.route(pattern, (route) => {
      apiRequests.push(route.request().url());
      return route.abort();
    });
  }
  return apiRequests;
}

const samples = fileURLToPath(new URL('../packages/data/samples/', import.meta.url));

/** The recorded API response kept under packages/data/samples for one sample key. */
export async function recorded(key: string): Promise<{ status: number; body: unknown }> {
  return JSON.parse(await readFile(join(samples, `${key}.json`), 'utf8')) as { status: number; body: unknown };
}

/** Runs the web app with the API on but answers each GET from the samples, so screens take their API-on paths without the network. */
export async function sampleApi(page: Page) {
  await page.route('**/config.json', (route) => route.fulfill({ json: { api: true, apiBase: '/api' } }));
  for (const pattern of externalFiles) await page.route(pattern, (route) => route.abort());
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const answer = await recorded(sampleKey('GET', url.pathname, Object.fromEntries(url.searchParams))).catch(() => ({ status: 404, body: { detail: 'Not found.' } }));
    return route.fulfill({ status: answer.status, json: answer.body });
  });
}
