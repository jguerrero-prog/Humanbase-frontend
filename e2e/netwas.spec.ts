import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { apiOff } from './apiOff';

const web = 'http://localhost:4173';
const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const violationsOf = async (page: Page) => {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
  return (await new AxeBuilder({ page }).withTags(axeTags).analyze()).violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
};

test('the NetWAS form checks the example and explains a missing file, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/netwas/`);
  await expect(page.getByRole('heading', { level: 1, name: 'NetWAS' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.getByRole('button', { name: 'Run NetWAS' }).click();
  await expect(page.getByText('1 thing to fix before submitting')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.getByRole('radio', { name: 'Use the example' }).click();
  await expect(page.getByText('17,692 genes with p-values, VEGAS format, ready to run')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Tissue network' })).toHaveText(/Adipose tissue/);
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the NetWAS form fits a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${web}/netwas/`);
  await expect(page.getByRole('heading', { level: 1, name: 'NetWAS' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
