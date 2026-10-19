import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test('the ASD Browser opens on the default range with each effects view, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/`);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr1:2,337,101 A>C' })).toBeVisible();
  await expect(page.getByText('Raises, 28 DNA features')).toBeVisible();
  // With the API off the page draws the score tracks itself instead of loading Biodalliance.
  await expect(page.locator('.genome-engine')).toHaveCount(0);
  await expect(page.getByRole('region', { name: /^Genome browser, chr1:2,230,000-2,440,000/ })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  for (const tab of ['Heatmap', 'All features']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
    expect(await violationsOf(page)).toEqual([]);
  }
  await page.getByRole('combobox', { name: 'Features' }).click();
  await page.getByRole('option', { name: 'RNA features' }).click();
  await expect(page).toHaveURL(/features=rna/);
  expect(apiRequests).toEqual([]);
});

test('the ASD table finds a gene and opens a row in the browser, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/?view=table`);
  await expect(page.getByRole('table', { name: 'ASD Browser variants' })).toBeVisible();
  await expect(page.getByText('127,133 variants', { exact: true })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'CHD8' }).click();
  await expect(page.getByText('2 variants', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^chr14:/ }).first().click();
  await expect(page.getByRole('heading', { name: /^Molecular effects of chr14:/ })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the ASD Browser fits a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['/asd/', '/asd/?view=table']) {
    await page.goto(`${web}${path}`);
    await expect(page.getByRole('heading', { level: 1, name: 'ASD Browser' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
