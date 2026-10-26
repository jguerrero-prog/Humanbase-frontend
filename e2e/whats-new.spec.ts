import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test.beforeEach(async ({ page }) => {
  await apiOff(page);
});

test('the What’s new page lists humanbase.io’s updates by month with no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto(`${web}/whats-new/`);
  await expect(page).toHaveTitle('What’s new in Humanbase');
  const article = page.getByRole('article', { name: 'What’s new in Humanbase' });
  await expect(article.getByRole('heading', { level: 2 })).toHaveText(['June 2026', 'February 2026', 'August 2025', 'October 2024', 'July 2024']);
  await expect(article.getByRole('heading', { level: 3 })).toHaveCount(11);
  await expect(article.getByRole('link', { name: 'Reproducing legacy results' })).toHaveAttribute('href', '/docs/reproducibility/');
  await expect(article.getByRole('link', { name: 'https://doi.org/10.1038/s41592-025-02994-8' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
});

test('the banner and the homepage’s All updates both reach the page', async ({ page }) => {
  await page.goto(`${web}/`);
  await page.getByRole('link', { name: 'All updates' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'What’s new in Humanbase' })).toBeVisible();
  await page.goto(`${web}/cite/`);
  await page.getByRole('link', { name: 'See what’s new' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'What’s new in Humanbase' })).toBeVisible();
});
