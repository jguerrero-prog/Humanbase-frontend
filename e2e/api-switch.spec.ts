import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';

test('with the API off, the homepage calls no API', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto('http://localhost:4173/');
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  expect(apiRequests).toEqual([]);
});
