import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';

const pages = [
  'http://localhost:4173/ism/',
  'http://localhost:4173/sequence-tools/',
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
