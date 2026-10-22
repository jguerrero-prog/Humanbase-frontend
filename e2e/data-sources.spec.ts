import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const dataSources = 'http://localhost:4173/data-sources/';
const sections = ['Networks', 'Gene records', 'Ontologies', 'Gene annotations', 'Network compendia', 'SEEK (beta) data compendia', 'Variant effect prediction models'];

test.beforeEach(async ({ page }) => {
  await apiOff(page);
});

test('the current era opens by default with MAGE and no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto(dataSources);
  await expect(page).toHaveTitle('Data sources · Humanbase');
  await expect(page.getByRole('heading', { level: 1, name: 'Data sources' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Jun 2026 – present' })).toHaveAttribute('aria-selected', 'true');
  for (const name of sections) await expect(page.getByRole('heading', { level: 2, name })).toBeVisible();

  const networks = page.getByRole('table', { name: 'Networks' });
  await expect(networks.getByRole('rowheader', { name: 'MAGE', exact: true })).toBeVisible();
  await expect(page.getByRole('table', { name: 'Gene annotations' })).toContainText('GO BP annotations: Homo sapiens (NCBI gene2go)');
  await expect(page.getByRole('table', { name: 'Ontologies' })).toContainText('FMD enrichment (GIANT + MAGE)');
  await expect(page.getByRole('link', { name: 'mage_human_compendium.tsv' })).toHaveAttribute('href', 'https://humanbase.s3.amazonaws.com/compendia/mage_human_compendium.tsv');
  await expect(page.getByRole('link', { name: 'this CSV file' })).toHaveAttribute('href', 'https://s3-us-west-2.amazonaws.com/humanbase-dev/deepsea/examples/41588_2019_420_MOESM9_ESM.csv');
  await expect(page.getByRole('link', { name: 'Sokolova et al. 2023' })).toHaveAttribute('href', 'https://www.cell.com/cell-reports-methods/fulltext/S2667-2375(23)00224-2');
  await expect(page.getByText('About reproducibility for this era')).toHaveCount(0);
  expect(await violationsOf(page)).toEqual([]);
});

test('the Up to May 2026 tab is in the URL, drops MAGE and explains reproducibility', async ({ page }) => {
  await page.goto(dataSources);
  await page.getByRole('tab', { name: 'Up to May 2026' }).click();
  await expect(page).toHaveURL(/\/data-sources\/\?era=up-to-may-2026$/);

  await expect(page.getByRole('table', { name: 'Networks' }).getByRole('rowheader', { name: 'MAGE', exact: true })).toHaveCount(0);
  await expect(page.getByRole('table', { name: 'Gene annotations' })).not.toContainText('NCBI gene2go');
  await expect(page.getByRole('table', { name: 'Ontologies' })).not.toContainText('GIANT + MAGE');
  await expect(page.getByRole('link', { name: 'mage_human_compendium.tsv' })).toHaveCount(0);
  await expect(page.getByRole('link', { name: 'human_compendium.tsv', exact: true })).toBeVisible();

  const note = page.getByText('About reproducibility for this era');
  await expect(note).toBeVisible();
  await expect(page.getByRole('link', { name: 'Reproducing legacy results' })).toHaveAttribute('href', 'https://humanbase.readthedocs.io/en/latest/reproducibility.html');
  expect(await violationsOf(page)).toEqual([]);

  await page.reload();
  await expect(page.getByRole('tab', { name: 'Up to May 2026' })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'Jun 2026 – present' }).click();
  await expect(page).toHaveURL(/\/data-sources\/$/);
});

test('at 375px the tables scroll inside their own frames, not the page', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(dataSources);
  await expect(page.getByRole('table', { name: 'Variant effect prediction models' })).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  expect(overflow).toBe(0);
  const frame = page.locator('.table-scroll').first();
  expect(await frame.evaluate((element) => element.scrollWidth > element.clientWidth)).toBe(true);
});
