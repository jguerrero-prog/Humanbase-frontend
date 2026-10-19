import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

// IRGM and PTEN are large tables, and each scan reads every heatmap cell, so these tests get longer than 30 seconds.
test.describe.configure({ timeout: 90_000 });

test('the ExPecto Gene tab opens IRGM by tissue system, then by tissue, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/expecto/`);
  await expect(page.getByRole('heading', { level: 1, name: 'ExPecto' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'IRGM' }).click();
  await expect(page).toHaveURL(`${web}/expecto/genes/345611/`);
  await expect(page.getByText('Predicted effect on IRGM expression, log fold change')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('hematopoietic system').first()).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('radio', { name: 'Tissues' }).click();
  await expect(page).toHaveURL(`${web}/expecto/genes/345611/?view=tissues`);
  expect(apiRequests).toEqual([]);
});

test('IRGM’s tissues filter by system and keep the filter in the URL, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  const heading = page.getByText('Predicted effect on IRGM expression, log fold change: 10 of 204 tissues');
  await page.goto(`${web}/expecto/genes/345611/?view=tissues`);
  await page.getByRole('combobox', { name: 'Tissue system' }).click();
  await page.getByRole('option', { name: 'hematopoietic system' }).click();
  await expect(heading).toBeVisible({ timeout: 15_000 });
  expect(await violationsOf(page)).toEqual([]);
  await page.reload();
  await expect(heading).toBeVisible({ timeout: 15_000 });
  expect(apiRequests).toEqual([]);
});

test('the SNP rsID tab finds a gene, an rsID and a position, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/expecto/snps/`);
  await page.getByRole('button', { name: 'IRGM' }).click();
  await expect(page.getByRole('heading', { name: '17 variants for IRGM' })).toBeVisible();
  await expect(page).toHaveURL(`${web}/expecto/snps/?q=IRGM`);
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'rs531708574' }).click();
  await expect(page.getByRole('heading', { name: '1 variant for rs531708574' })).toBeVisible();
  await page.getByRole('button', { name: 'chr1:877047' }).click();
  await expect(page.getByRole('link', { name: 'SAMD11' })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('ExPecto SC opens PTEN by organ, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/expecto-sc/`);
  await expect(page.getByRole('heading', { level: 1, name: 'ExPecto SC' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'PTEN' }).click();
  await expect(page).toHaveURL(`${web}/expecto-sc/genes/5728/`);
  await expect(page.getByText('Predicted effect on PTEN expression, z-score')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('retina').first()).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the ExPecto Submit variants tab checks its example, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/expecto/variants/`);
  await expect(page.getByRole('combobox', { name: 'Model' })).toHaveText(/Beluga \(DNA, 2019\)/);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await expect(page.getByRole('button', { name: 'Run ExPecto on 12 variants' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the ExPecto pages fit a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['expecto/', 'expecto/snps/?q=IRGM', 'expecto/variants/', 'expecto/genes/345611/', 'expecto-sc/', 'expecto-sc/genes/5728/']) {
    await page.goto(`${web}/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(375);
  }
});
