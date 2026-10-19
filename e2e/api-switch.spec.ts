import { expect, test } from '@playwright/test';

test('with the API off, the front end shows sample data and calls no API', async ({ page }) => {
  const apiRequests: string[] = [];
  await page.route('**/config.json', (route) => route.fulfill({ json: { api: false, apiBase: '/api' } }));
  await page.route('**/api/**', (route) => {
    apiRequests.push(route.request().url());
    return route.abort();
  });

  await page.goto('http://localhost:4173/');
  await expect(page.getByRole('status')).toHaveText(/The API is off, so this is sample data\. Gene 3553 is IL1B/);
  expect(apiRequests).toEqual([]);
});
