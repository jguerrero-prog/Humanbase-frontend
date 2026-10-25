import { expect, test } from '@playwright/test';
import { readdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
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

test('every design system page fits a 390px phone without scrolling sideways', async ({ page }) => {
  const dist = fileURLToPath(new URL('../apps/docs/dist/', import.meta.url));
  const paths = readdirSync(dist, { recursive: true, encoding: 'utf8' })
    .filter((file) => file.endsWith('index.html'))
    .map((file) => `/${file.replace(/index\.html$/, '')}`);
  expect(paths.length).toBeGreaterThan(50);
  await apiOff(page);
  await page.setViewportSize({ width: 390, height: 900 });
  for (const path of paths) {
    await page.goto(`http://localhost:4322${path}`);
    expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(390);
  }
});
