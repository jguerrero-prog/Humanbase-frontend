import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';

test('with the API off, the homepage search answers from sample data and calls no API', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto('http://localhost:4173/');
  await page.getByRole('combobox', { name: 'Search genes' }).fill('IL1B');
  await expect(page.getByRole('option', { name: /CASP1/ })).toContainText('Matched on its alias IL1BC');
  await page.getByRole('combobox', { name: 'Search genes' }).fill('AUTS12 IL1B TNF');
  await page.getByRole('combobox', { name: 'Search genes' }).press('Enter');
  await expect(page.getByText('2 genes will be analyzed in MAGE')).toBeVisible();
  await page.getByRole('button', { name: 'Show network for 2 genes' }).click();
  await expect(page).toHaveURL(/\/networks\/\?entrez=3553&entrez=7124&version=v3$/);
  expect(apiRequests).toEqual([]);
});
