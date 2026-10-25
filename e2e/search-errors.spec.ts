import { expect, test, type Page } from '@playwright/test';
import { apiOff, sampleApi } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';
const failure = 'Suggestions couldn’t load';

/** Answers from the samples, but fails gene suggestions until the returned function is called. */
async function failSuggestions(page: Page) {
  await sampleApi(page);
  let failing = true;
  await page.route('**/api/genes/search/partial/**', (route) => (failing ? route.fulfill({ status: 502, body: 'Bad gateway' }) : route.fallback()));
  return () => {
    failing = false;
  };
}

test('the top bar search says when suggestions fail, and Try again searches again, with no WCAG 2.2 AA violations', async ({ page }) => {
  const recover = await failSuggestions(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${web}/cite/`);
  const box = page.getByRole('combobox', { name: 'Search genes' });
  await box.fill('SHANK3');
  await expect(page.getByText(failure, { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/No genes match/)).toHaveCount(0);
  expect(await violationsOf(page)).toEqual([]);
  recover();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(box).toBeFocused();
  await expect(page.getByRole('grid', { name: 'Genes' }).getByRole('row', { name: /SHANK3/ })).toBeVisible();
});

test('the homepage search says when suggestions fail, and Try again searches again', async ({ page }) => {
  const recover = await failSuggestions(page);
  await page.goto(`${web}/`);
  const box = page.getByRole('combobox', { name: 'Search genes' });
  await box.fill('IL1B');
  await expect(page.getByText(failure, { exact: true })).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/No genes match/)).toHaveCount(0);
  recover();
  await page.getByRole('button', { name: 'Try again' }).click();
  await expect(page.getByRole('option', { name: /CASP1/ })).toBeVisible();
});

test('with the API off, a gene with no sample reads as no match, not as a failure', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/cite/`);
  await page.getByRole('combobox', { name: 'Search genes' }).fill('BRCA2');
  await expect(page.locator('.search-suggestions-empty-title')).toHaveText('No genes match “BRCA2”');
  await expect(page.getByText(failure, { exact: true })).toHaveCount(0);
  expect(apiRequests).toEqual([]);
});
