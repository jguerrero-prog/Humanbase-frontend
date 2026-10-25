import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test('Sei HGMD variants shows every variant on the heatmap, sorts them, and opens one in the genome browser, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/variant-effects/hgmd/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Sei HGMD variants' })).toBeVisible();
  const heatmap = page.getByRole('grid', { name: 'Sequence class score of 853 HGMD variants' });
  // Only the rows near the screen are drawn; the grid still counts all 853 for screen readers.
  await expect(heatmap).toHaveAttribute('aria-rowcount', '853');
  await expect(heatmap.getByRole('row').first().getByRole('button')).toHaveText('Haemophagocytic lymphohistiocytosis type 3 (chr17:73839907)');
  expect(await violationsOf(page)).toEqual([]);

  // The arrow keys reach rows that weren't drawn yet.
  await heatmap.getByRole('gridcell').first().focus();
  for (let step = 0; step < 100; step += 1) await page.keyboard.press('ArrowDown');
  await expect(page.locator(':focus')).toHaveAttribute('data-cell', '100-0');
  await expect(page.locator(':focus').locator('xpath=..')).toHaveAttribute('aria-rowindex', '101');
  await page.keyboard.press('Escape');

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

test('Sei HGMD variants’ Previous and Next step through the whole list in the heatmap’s order, jumping the view across chromosomes, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/variant-effects/hgmd/`);
  await page.getByRole('button', { name: 'Haemophagocytic lymphohistiocytosis type 3 (chr17:73839907)' }).click();
  await expect(page.getByText(/step through all 853 HGMD variants in the dataset’s order\.$/)).toBeVisible();
  const location = page.getByRole('searchbox', { name: 'Location or gene' });

  // The second variant is in view, so the view stays; the third is on chrX, so the view moves there at the same width.
  await page.getByRole('button', { name: 'Next variant' }).click();
  await expect(page.getByRole('heading', { name: /^Molecular effects of chr17:73,839,908/ })).toBeVisible();
  await expect(location).toHaveValue('chr17:73,789,907-73,889,907');
  await page.getByRole('button', { name: 'Next variant' }).click();
  await expect(page.getByRole('heading', { name: /^Molecular effects of chrX:37,639,264/ })).toBeVisible();
  await expect(location).toHaveValue('chrX:37,589,264-37,689,264');
  await expect(page).toHaveURL(/variant=chrX-37639264-T-C/);
  expect(await violationsOf(page)).toEqual([]);
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
