import { expect, test } from '@playwright/test';
import { checkScreen, watch, web } from './live';

test('the homepage suggests genes as you type', async ({ page }) => {
  const problems = watch(page);
  await page.goto(web);
  await page.getByRole('combobox', { name: 'Search genes' }).pressSequentially('IL1');
  await expect(page.getByRole('option', { name: /^IL1B/ })).toBeVisible();
  await expect(page.getByRole('option', { name: /interleukin 1 beta/ })).toBeVisible();
  await checkScreen(page, problems);
});

test('the top bar suggests genes with the pages each opens in', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/cite/`);
  await page.getByRole('combobox', { name: 'Search genes' }).pressSequentially('SHANK3');
  const row = page.getByRole('grid', { name: 'Genes' }).getByRole('row', { name: /^SHANK3/ });
  await expect(row.getByRole('link', { name: 'SHANK3 in Networks' })).toHaveAttribute('href', '/networks/?entrez=85358&version=v3');
  await expect(row.getByRole('link', { name: 'SHANK3 in Expression effects' })).toHaveAttribute('href', '/expression-effects/genes/85358/');
  await checkScreen(page, problems);
});

test('an example gene goes straight into the list', async ({ page }) => {
  const problems = watch(page);
  await page.goto(web);
  await page.getByRole('button', { name: 'IL1B', exact: true }).click();
  await expect(page.getByRole('table', { name: 'How your genes matched' }).getByText('interleukin 1 beta')).toBeVisible();
  await checkScreen(page, problems);
});

test('a pasted list matches every gene and warns about one in no network', async ({ page }) => {
  const problems = watch(page);
  await page.goto(web);
  const search = page.getByRole('combobox', { name: 'Search genes' });
  await search.fill('AUTS12 IL1B TNF');
  await search.press('Enter');
  const table = page.getByRole('table', { name: 'How your genes matched' });
  await expect(table.getByText('interleukin 1 beta')).toBeVisible();
  await expect(table.getByText('tumor necrosis factor')).toBeVisible();
  await expect(page.getByText('AUTS12 is a recognized gene, but it is not part of any Humanbase network, so it will not be included in this query.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Show network for 2 genes' })).toBeVisible();
  await checkScreen(page, problems);
});

test('Show network opens the Networks result for the matched genes', async ({ page }) => {
  const problems = watch(page);
  await page.goto(web);
  const search = page.getByRole('combobox', { name: 'Search genes' });
  await search.fill('IL1B TNF');
  await search.press('Enter');
  await page.getByRole('button', { name: 'Show network for 2 genes' }).click();
  await expect(page).toHaveURL(/\/networks\/\?.*entrez=3553.*entrez=7124/);
  await expect(page.getByText(/Showing \d+ of \d+ genes, \d+ connections at/)).toBeVisible();
  await checkScreen(page, problems);
});
