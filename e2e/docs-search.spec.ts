import { expect, test } from '@playwright/test';

test('docs search finds a page and links to it', async ({ page }) => {
  await page.goto('http://localhost:4322/');
  await page.getByRole('searchbox', { name: 'Search the design system' }).fill('slider');
  const result = page.locator('output[for="docs-search-input"] a', { hasText: 'Sliders' }).first();
  await result.click();
  await expect(page).toHaveURL('http://localhost:4322/components/sliders/');
});
