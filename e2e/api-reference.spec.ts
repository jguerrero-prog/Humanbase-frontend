import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';
const groups = ['Getting started', 'Compendiums', 'Databases', 'Datasets', 'Data types', 'DeepSEA', 'Genes', 'Integrations', 'NetWAS', 'SEEK', 'Terms'];

test('the Humanbase API page lists every endpoint from the API’s schema but the newsletter, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(web);
  await page.getByRole('button', { name: 'Resources' }).click();
  await page.locator('.nav-menu-link', { hasText: 'Humanbase API' }).click();

  await expect(page).toHaveURL(/\/humanbase-api\/$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Humanbase API' })).toBeVisible();
  await expect(page.locator('main h2:not(.docs-nav-heading)')).toHaveText(groups);
  await expect(page.locator('.api-endpoint')).toHaveCount(45);
  await expect(page.locator('main').getByText(/newsletter/i)).toHaveCount(0);
  await expect(page.getByText('The API is off')).toBeVisible();
  // Getting started names the public API, not the address serving this copy.
  await expect(page.locator('.api-facts')).toContainText('https://humanbase.io/api/');
  await expect(page.locator('.api-facts')).not.toContainText('localhost');
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the sidebar jumps to an endpoint, and Filter endpoints narrows the sidebar and the page', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${web}/humanbase-api/`);
  const sidebar = page.getByRole('navigation', { name: 'Endpoints' });
  await sidebar.getByRole('link', { name: 'Network', exact: true }).click();
  await expect(page).toHaveURL(/#get-api-integrations-slug-network$/);
  await expect(page.getByRole('heading', { level: 3, name: 'Network', exact: true })).toBeInViewport();

  await page.getByRole('searchbox', { name: 'Filter endpoints' }).fill('genes predictions');
  await expect(page.locator('.api-endpoint')).toHaveCount(1);
  await expect(sidebar.getByRole('link')).toHaveText(['Returns a list of terms a gene is predicted to be associated with']);
  await page.getByRole('searchbox', { name: 'Filter endpoints' }).fill('nothing like this');
  await expect(page.getByText('No endpoint matches “nothing like this”')).toBeVisible();
});

test('Try it sends the request with the schema’s example and shows the response and the same request with curl', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/humanbase-api/#get-api-genes-entrez`);
  const gene = page.locator('#get-api-genes-entrez');
  await gene.getByRole('button', { name: 'Try it' }).click();
  await expect(gene.getByRole('textbox', { name: 'entrez' })).toHaveValue('3553');
  await expect(gene.getByRole('figure', { name: 'The same request with curl' })).toContainText("curl -X GET 'http://localhost:4173/api/genes/3553/'");
  await gene.getByRole('button', { name: 'Send request' }).click();
  await expect(gene.getByRole('figure', { name: 'Response', exact: true })).toContainText('"systematic_name": "IL1B"');

  await gene.getByRole('textbox', { name: 'entrez' }).fill('');
  await gene.getByRole('button', { name: 'Send request' }).click();
  await expect(gene.getByText('Enter entrez.')).toBeVisible();

  // With the API off, a request without recorded sample data says so instead of failing.
  await gene.getByRole('textbox', { name: 'entrez' }).fill('1');
  await gene.getByRole('button', { name: 'Send request' }).click();
  await expect(gene.getByText('No sample data for this request')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
});

test('a POST endpoint shows its request body example and says sending it does the work', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/humanbase-api/#post-api-integrations-community`);
  const community = page.locator('#post-api-integrations-community');
  await expect(community.getByRole('heading', { level: 4, name: /Request body/ })).toBeVisible();
  await expect(community.getByRole('figure', { name: /^Request body example/ })).toContainText('"entrez"');
  await community.getByRole('button', { name: 'Try it' }).click();
  await expect(community.getByRole('textbox', { name: 'Request body (JSON)' })).not.toHaveValue('');
  await expect(community.getByText(/may start a job/)).toBeVisible();
});
