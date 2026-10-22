import type { Page } from '@playwright/test';

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
