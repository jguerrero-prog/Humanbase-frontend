import type { Page } from '@playwright/test';

/** Runs the web app with the API switched off and returns the API requests it makes, which should be none. */
export async function apiOff(page: Page): Promise<string[]> {
  const apiRequests: string[] = [];
  await page.route('**/config.json', (route) => route.fulfill({ json: { api: false, apiBase: '/api' } }));
  await page.route('**/api/**', (route) => {
    apiRequests.push(route.request().url());
    return route.abort();
  });
  return apiRequests;
}
