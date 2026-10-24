import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';
const example = `${web}/deepsea/jobs/0576e894-a2c5-48bb-9bdf-227962495d5f/`;

test('the region scan form runs its example into the job page, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/variant-effects/?tab=region-scan`);
  await expect(page.getByRole('tab', { name: 'Region scan' })).toHaveAttribute('aria-selected', 'true');
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await page.getByRole('button', { name: 'Run region scan on 4 sequences' }).click();
  await expect(page).toHaveURL(`${web}/deepsea/jobs/00000000-0000-4000-8000-000000000151/`);
  await expect(page.getByText('4 sequences, FASTA')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the in silico mutagenesis result moves its window and explains choices the samples lack, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(example);
  await expect(page.getByRole('grid', { name: 'Substitutions at positions 954 to 1,044' })).toBeVisible();
  await expect(page.getByRole('region', { name: 'Position 999' })).toContainText('−4.63');
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('slider', { name: 'Window along the sequence' }).press('ArrowRight');
  await expect(page.getByRole('grid', { name: 'Substitutions at positions 955 to 1,045' })).toBeVisible();
  await page.getByRole('gridcell', { name: /^Position 1,005, \w to \w:/ }).first().click();
  await expect(page.getByRole('region', { name: 'Position 1,005' })).toBeVisible();
  await page.getByRole('combobox', { name: /^Sequence/ }).click();
  await page.getByRole('option', { name: /known_GATA1_binding_increase/ }).click();
  await expect(page.getByText('The sample data doesn’t include this choice')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the region scan form and result fit a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [`${web}/variant-effects/?tab=region-scan`, example]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
