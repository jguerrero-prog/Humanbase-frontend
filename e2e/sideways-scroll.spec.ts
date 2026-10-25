import { expect, test, type Page } from '@playwright/test';
import { apiOff } from './apiOff';

const pages = [
  'http://localhost:4173/ism/',
  'http://localhost:4173/sequence-tools/',
  'http://localhost:4173/seqweaver/gnomad/',
  'http://localhost:4173/genome/?gene=IL1B',
  'http://localhost:4322/ui-library/job-submission/',
  'http://localhost:4322/components/navigation-and-breadcrumbs/',
  'http://localhost:4322/tokens/radius-and-elevation/',
];

for (const url of pages) {
  test(`${new URL(url).pathname} fits a phone, a 1024px screen and a 1440px screen without scrolling sideways`, async ({ page }) => {
    await apiOff(page);
    for (const width of [390, 1024, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      await page.goto(url);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await page.evaluate(() => document.documentElement.scrollWidth), `at ${width}px`).toBeLessThanOrEqual(width);
    }
  });
}

const phoneRoutes = ['/', '/networks/', '/modules/', '/netwas/', '/netwas/c66b3d05-2f49-4522-b910-1605609e4083/', '/variant-effects/', '/variant-effects/hgmd/', '/expression-effects/', '/seqweaver/', '/downloads/', '/about/', '/cite/', '/data-sources/', '/docs/', '/jobs/', '/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/'];
const finishedJob = { id: '76aea8fe-8ec7-4698-a193-a186c7665edb', tool: 'Seqweaver', status: 'finished', startedAt: '2026-10-20T21:02:00.000Z', link: '/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/', title: 'IL1B region variants', detail: 'Seqweaver, example.vcf' };
const pageScrollsSideways = (page: Page) => page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth || window.scrollX > 0);

test.describe('at 390px', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  for (const path of phoneRoutes) {
    test(`${path} fits a phone without scrolling sideways`, async ({ page }) => {
      await apiOff(page);
      await page.addInitScript((job) => localStorage.setItem('humanbase:jobs', JSON.stringify([job])), finishedJob);
      await page.goto(`http://localhost:4173${path}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.waitForLoadState('networkidle');
      expect(await pageScrollsSideways(page)).toBe(false);
    });
  }

  test('Jobs keeps to the screen with a row menu open; the table scrolls inside itself', async ({ page }) => {
    await apiOff(page);
    await page.addInitScript((job) => localStorage.setItem('humanbase:jobs', JSON.stringify([job])), finishedJob);
    await page.goto('http://localhost:4173/jobs/');
    await page.getByRole('button', { name: 'More actions for IL1B region variants' }).click();
    await expect(page.getByRole('menuitem', { name: 'Copy link' })).toBeVisible();
    expect(await pageScrollsSideways(page)).toBe(false);
    const table = page.getByRole('region', { name: 'Jobs in this browser' });
    expect(await table.evaluate((region) => region.scrollWidth > region.clientWidth)).toBe(true);
  });
});
