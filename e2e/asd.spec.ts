import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test('the ASD Browser opens on the default range with each effects view, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/`);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr1:2,337,101 A>C' })).toBeVisible();
  await expect(page.getByText('Raises, 39 DNA features')).toBeVisible();
  // With the API off the genome browser draws from the recorded track windows, with no request.
  const browser = page.getByRole('application', { name: /^Genome browser, chr1:2,230,000-2,440,000/ });
  await expect(browser.getByText('← PEX10')).toBeVisible();
  await expect(browser.getByText('chr1:2,337,101', { exact: true })).toBeVisible();
  await expect(browser.locator('.genome-tracks-bar')).not.toHaveCount(0);
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

test('the ASD Browser shows and hides its tracks and exports the view as SVG, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/`);
  const browser = page.getByRole('application', { name: /^Genome browser, chr1:2,230,000-2,440,000/ });
  const headers = page.locator('.genome-engine .track-header-name');
  await expect(browser.getByText('← PEX10')).toBeVisible();
  await expect(headers).toHaveText(['Sequence', 'DNA disease impact score', 'RNA disease impact score', 'Genes']);
  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await drawer.getByRole('checkbox', { name: 'Conservation' }).check();
  await drawer.getByRole('checkbox', { name: 'GM12878 ChromHMM' }).check();
  await drawer.getByRole('checkbox', { name: 'Genes' }).uncheck();
  await drawer.getByRole('checkbox', { name: 'Sequence' }).uncheck();
  expect(await violationsOf(page)).toEqual([]);
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['DNA disease impact score', 'RNA disease impact score', 'Conservation', 'GM12878 ChromHMM']);
  await expect(page.locator('.genome-engine').getByText('← PEX10')).toHaveCount(0);
  await page.reload();
  await expect(headers).toHaveText(['DNA disease impact score', 'RNA disease impact score', 'Conservation', 'GM12878 ChromHMM']);
  await expect(page.locator('.genome-engine .genome-tracks-bar')).not.toHaveCount(0);

  const segments = page.locator('.genome-engine .genome-tracks-segment');
  await expect(segments).toHaveCount(108);
  await expect(segments.first()).toHaveAttribute('fill', '#C2D69A');
  await segments.nth(23).hover();
  await expect(page.getByRole('tooltip')).toHaveText(/^QuiesGM12878 ChromHMMStart2,249,001Length17,400 bp$/);
  await page.getByText('View as table').click();
  const table = page.getByRole('table', { name: 'GM12878 ChromHMM segments in chr1:2,230,000-2,440,000, GRCh37/hg19' });
  await expect(table.getByRole('row')).toHaveCount(109);
  await expect(table.getByRole('row').nth(1)).toHaveText(/^Low\s*2,229,601\s*2,230,400\s*800 bp$/);
  expect(await violationsOf(page)).toEqual([]);

  await page.locator('.genome-engine').focus();
  await page.keyboard.press('x');
  const dialog = page.getByRole('dialog', { name: 'Export the view' });
  await dialog.getByRole('textbox', { name: 'Width' }).fill('900 px');
  await dialog.getByRole('checkbox', { name: 'Include the vertical guideline' }).uncheck();
  expect(await violationsOf(page)).toEqual([]);
  const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Export' }).click()]);
  expect(download.suggestedFilename()).toBe('chr1_2230000-2440000_hg19.svg');
  const svg = await readFile(await download.path(), 'utf8');
  expect(svg).toMatch(/^<svg[^>]+width="1120"/);
  expect(svg).toContain('chr1:2,230,000-2,440,000, GRCh37/hg19');
  expect(svg).toContain('Conservation');
  expect(svg).toContain('GM12878 ChromHMM');
  expect(svg.match(/class="genome-tracks-segment"/g)).toHaveLength(108);
  expect(svg).toContain('chr1:2,337,101');
  expect(svg).not.toContain('genome-tracks-guide');
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Tracks' }).click();
  await drawer.getByRole('button', { name: 'Reset to default tracks' }).click();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['Sequence', 'DNA disease impact score', 'RNA disease impact score', 'Genes']);
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
