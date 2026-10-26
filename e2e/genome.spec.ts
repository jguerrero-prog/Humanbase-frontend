import { expect, test } from '@playwright/test';
import { genomeBrowserPreview } from '../packages/hb/src/content/genomeBrowserPreview.ts';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test.skip(!genomeBrowserPreview, 'The genome browser preview is switched off.');

test('a gene opens the genome browser page on that gene, with humanbase.io’s /genome tracks and the preview notice, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1&gene=3383`);
  await page.getByRole('dialog', { name: 'ICAM1' }).getByRole('link', { name: 'View in genome browser' }).click();

  await expect(page).toHaveURL(/\/genome\/\?gene=ICAM1&from=networks$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Genome browser' })).toBeVisible();
  // The trail names the tool the link came from, not the page's place under Variants & sequences.
  await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('listitem')).toHaveText(['Genes & gene sets', 'Networks', 'Genome browser']);
  await expect(page.getByRole('link', { name: 'Read the proposal on GitHub' })).toHaveAttribute('href', /\/issues\/457$/);
  const browser = page.getByRole('application', { name: /^Genome browser, chr19:10,381,510-10,397,291, GRCh37\/hg19/ });
  await expect(browser.getByText('ICAM1 →')).toBeVisible();
  await expect(page.locator('.genome-engine .track-header-name')).toHaveText(['Sequence', 'Seqweaver gnomAD', 'DNA disease impact score (de novo ASD)', 'RNA disease impact score (de novo ASD)', 'Genes']);
  await expect(browser.locator('.genome-tracks-bar')).not.toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Previous variant' })).toHaveCount(0);
  await expect(page.getByText('Sample data covers only')).toHaveCount(0);
  expect(await violationsOf(page)).toEqual([]);

  // Moving keeps the gene the link named, beside the new view.
  await page.getByRole('radio', { name: '50 kb' }).click();
  await expect(page).toHaveURL(/gene=ICAM1&from=networks&location=chr19/);
  expect(apiRequests).toEqual([]);
});

test('clicking a gene opens its drawer beside the view, rings the gene, and closes back to it, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/genome/?gene=ICAM1`);
  const gene = page.getByRole('group', { name: 'Genes, items' }).getByRole('button', { name: 'ICAM1' });
  await page.locator('.genome-tracks-gene-name', { hasText: /^ICAM1/ }).click();
  const drawer = page.getByRole('dialog', { name: 'ICAM1' });
  await expect(drawer.getByText('intercellular adhesion molecule 1')).toBeVisible();
  await expect(drawer).toContainText('forward strand (GRCh37/hg19)');
  await expect(drawer).toContainText('protein_coding (GENCODE 19)');
  await expect(drawer.getByRole('link', { name: 'Open ICAM1 in Networks' })).toHaveAttribute('href', /entrez=3383/);
  await expect(gene).toHaveAttribute('aria-expanded', 'true');
  expect(await violationsOf(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(drawer).toHaveCount(0);
  await expect(gene).toHaveAttribute('aria-expanded', 'false');
  expect(apiRequests).toEqual([]);
});

test('a variant opens 50 kb around it, marked, and keeps the mark as the view moves, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/genome/?location=chr5:150226123`);
  const browser = page.getByRole('application', { name: /^Genome browser, chr5:150,201,123-150,251,123/ });
  await expect(browser.getByText('chr5:150,226,123', { exact: true })).toBeVisible();
  await page.getByRole('radio', { name: '500 kb' }).click();
  await expect(page).toHaveURL(/\?location=chr5:149,976,123-150,476,123&variant=chr5:150226123$/);
  await expect(page.getByRole('application', { name: /^Genome browser, chr5:149,976,123-150,476,123/ }).getByText('chr5:150,226,123', { exact: true })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('a gene the sample data doesn’t hold says so and opens humanbase.io’s /genome view, with the API off', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/genome/?gene=TP53`);
  await expect(page.getByText('TP53 isn’t in the gene index')).toBeVisible();
  await expect(page.getByRole('application', { name: /^Genome browser, chr1:2,230,000-2,440,000/ })).toBeVisible();
});
