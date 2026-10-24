import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test('Sei HGMD variants shows every variant on the heatmap, sorts them, and opens one in the genome browser, with the API off', async ({ page }) => {
  // Axe reads all 75,000 elements of the heatmap view before it checks anything, which takes about half a minute.
  test.setTimeout(120_000);
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/variant-effects/hgmd/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Sei HGMD variants' })).toBeVisible();
  const heatmap = page.getByRole('grid', { name: 'Sequence class score of 853 HGMD variants' });
  await expect(heatmap.getByRole('row')).toHaveCount(853);
  await expect(heatmap.getByRole('row').first().getByRole('button')).toHaveText('Haemophagocytic lymphohistiocytosis type 3 (chr17:73839907)');
  // Axe takes minutes over 34,120 cells and their table; the Heatmap's cells are checked on smaller heatmaps elsewhere.
  expect(await violationsOf(page, ['.heatmap-grid', '.heatmap-table'])).toEqual([]);

  await page.getByRole('combobox', { name: 'Sort variants by' }).click();
  await page.getByRole('option', { name: 'Disease name' }).click();
  await expect(page).toHaveURL(`${web}/variant-effects/hgmd/?sort=disease`);
  await expect(heatmap.getByRole('row').first().getByRole('button')).toHaveText('Acampomelic campomelic dysplasia (chr17:70117348)');

  await heatmap.getByRole('button', { name: 'Acampomelic campomelic dysplasia (chr17:70117348)' }).click();
  await expect(page).toHaveURL(/view=genome/);
  await expect(page.getByRole('tab', { name: 'Genome browser' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('searchbox', { name: 'Location or gene' })).toHaveValue('chr17:70,067,348-70,167,348');
  await expect(page.getByRole('heading', { name: /^Molecular effects of chr17:70,117,348/ })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Heatmap' })).toHaveAttribute('aria-selected', 'true');
  expect(apiRequests).toEqual([]);
});

test('humanbase.io’s /sei-hgmd link opens Sei HGMD variants, and Variant effects and the tools comparison link to it', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/sei-hgmd`);
  await expect(page).toHaveURL(`${web}/variant-effects/hgmd/`);
  await page.goto(`${web}/variant-effects/`);
  await expect(page.getByRole('link', { name: 'Explore Sei scores for 853 noncoding HGMD disease variants' })).toHaveAttribute('href', '/variant-effects/hgmd/');
  await page.goto(`${web}/sequence-tools/`);
  await expect(page.getByRole('link', { name: 'Sei scores for 853 noncoding HGMD disease variants' })).toHaveAttribute('href', '/variant-effects/hgmd/');
});
