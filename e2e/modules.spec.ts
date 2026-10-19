import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';

const web = 'http://localhost:4173';
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const violationsOf = async (page: Parameters<typeof apiOff>[0]) =>
  (await new AxeBuilder({ page }).exclude('[data-illustration]').withTags(axeTags).analyze()).violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);

test('Modules on the homepage checks an example list and starts a job, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/modules/`);
  await expect(page).toHaveURL(/\/\?analysis=modules$/);
  await expect(page.getByRole('heading', { name: 'How module detection works' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.getByRole('button', { name: 'renal disease panel' }).click();
  await expect(page.getByText('468 matched', { exact: true })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.getByRole('button', { name: 'Find modules in 504 genes' }).click();
  await expect(page).toHaveURL(/\/modules\/\?body_tag=faa09d1786f0998dbd03d7323f544f5457d98936/);
  await expect(page.getByRole('heading', { level: 1, name: 'Renal disease panel' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('a module result that no longer exists says so', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/modules/?body_tag=0000`);
  await expect(page.getByText('This module result isn’t available')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});
