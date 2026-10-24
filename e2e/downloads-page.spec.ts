import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const downloads = 'http://localhost:4173/downloads/';

test.beforeEach(async ({ page }) => {
  await apiOff(page);
});

test('MAGE tissue networks open by default with no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto(downloads);
  await expect(page).toHaveTitle('Downloads · Humanbase');
  await expect(page.getByRole('heading', { level: 1, name: 'Downloads' })).toBeVisible();
  await expect(page.locator('.article-band')).toHaveCount(0);
  await expect(page.getByRole('radio', { name: 'MAGE' })).toBeChecked();
  await expect(page.getByRole('link', { name: 'acinar_cell_of_salivary_gland.dat.gz' })).toHaveAttribute('href', 'https://s3-us-west-2.amazonaws.com/humanbase/networks/v3/acinar_cell_of_salivary_gland.dat.gz');
  await expect(page.getByText('1 to 25 of 290 tissues and cell types')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
});

test('GIANT shows its archives, script and filterable tissue files', async ({ page }) => {
  await page.goto(downloads);
  await page.locator('label.segment', { hasText: 'GIANT' }).click();
  await expect(page).toHaveURL(/\/downloads\/\?version=v1$/);
  await expect(page.getByRole('link', { name: 'all_networks.tar.gz' })).toHaveAttribute('href', 'https://s3-us-west-2.amazonaws.com/humanbase/networks/all_networks.tar.gz');
  await expect(page.getByRole('link', { name: 'Download script' })).toHaveAttribute('download', 'download_all_networks.py');

  await page.getByRole('button', { name: 'Show script' }).click();
  await expect(page.locator('figcaption', { hasText: 'download_all_networks.py' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  const filter = page.getByRole('searchbox', { name: 'Filter tissues' });
  await filter.fill('lymphocyte');
  await expect(page.getByRole('link', { name: 'b_lymphocyte.dat' })).toHaveAttribute('href', 'https://s3-us-west-2.amazonaws.com/humanbase/standards/b_lymphocyte.dat');
  await filter.fill('nothing like this');
  await expect(page.getByText('No tissues match')).toBeVisible();
});

test('the Variant effects tab is in the URL and the back button returns', async ({ page }) => {
  await page.goto(downloads);
  await page.getByRole('tab', { name: 'Variant effects' }).click();
  await expect(page).toHaveURL(/\/downloads\/\?tab=variant-effects$/);
  await expect(page.getByRole('link', { name: 'Download deepsea.beluga.pth' })).toHaveAttribute('href', 'https://humanbase.s3.us-west-2.amazonaws.com/clever/deepsea.beluga.pth');
  await expect(page.getByRole('link', { name: /Read the ExPecto documentation/ })).toHaveAttribute('href', '/docs/expecto/');
  await expect(page.getByRole('link', { name: /Go to SFARI Base/ })).toHaveAttribute('href', 'https://base.sfari.org');
  await expect(page.getByText('The ASD Browser is retired, and its data is also on SFARI Base.')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Tissue networks' })).toHaveAttribute('aria-selected', 'true');
});

test('humanbase.io download links open the matching tab', async ({ page }) => {
  await page.goto('http://localhost:4173/download/tissue-networks/giant');
  await expect(page).toHaveURL(/\/downloads\/\?version=v1$/);
  await page.goto('http://localhost:4173/download/variant-effects');
  await expect(page).toHaveURL(/\/downloads\/\?tab=variant-effects$/);
});
