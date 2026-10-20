import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test('a page whose code can no longer load asks for a reload and keeps the layout', async ({ page }) => {
  const apiRequests = await apiOff(page);
  // As after a deploy, when an open tab asks for a page chunk the server no longer has.
  await page.route('**/assets/NetworksPage-*.js', (route) => route.abort());
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);

  const alert = page.getByRole('alert').filter({ hasText: 'This page needs a refresh' });
  await expect(alert).toContainText('This page needs a refresh');
  await expect(alert.getByRole('button', { name: 'Reload the page' })).toBeVisible();
  await expect(alert.getByRole('link', { name: 'Go to the homepage' })).toBeVisible();
  await expect(page.getByRole('banner')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});
