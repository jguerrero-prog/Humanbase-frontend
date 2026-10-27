import { expect, test } from '@playwright/test';
import { checkScreen, watch, web } from './live';

test('the Humanbase API page reads the live schema, and Try it gets a real gene', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/humanbase-api/#get-api-genes-entrez`);
  await expect(page.locator('main h2:not(.docs-nav-heading)')).toHaveText(['Getting started', 'Compendiums', 'Databases', 'Datasets', 'Data types', 'DeepSEA', 'Genes', 'Integrations', 'NetWAS', 'SEEK', 'Terms']);
  await expect(page.getByText('The API is off')).toHaveCount(0);
  const gene = page.locator('#get-api-genes-entrez');
  await gene.getByRole('button', { name: 'Try it' }).click();
  await gene.getByRole('button', { name: 'Send request' }).click();
  await expect(gene.getByRole('figure', { name: 'Response', exact: true })).toContainText('"systematic_name": "IL1B"', { timeout: 90_000 });
  await checkScreen(page, problems);
});
