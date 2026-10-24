import { expect, test } from '@playwright/test';
import { asdBrowserRetired } from '../packages/hb/src/content/asdBrowser.ts';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test.skip(!asdBrowserRetired, 'The ASD Browser is on; asd.spec.ts tests it.');

test('old ASD Browser links show the retired notice and point to SFARI Base, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    for (const path of ['/asd/', '/asd/?view=table']) {
      await page.goto(`${web}${path}`);
      await expect(page.getByRole('heading', { level: 1, name: 'ASD Browser' })).toBeAttached();
      await expect(page.getByText('The ASD Browser is retired')).toBeVisible();
      await expect(page.getByText('For autism genetics data, visit SFARI Base.')).toBeVisible();
      await expect(page.getByRole('link', { name: 'Go to SFARI Base' })).toHaveAttribute('href', 'https://base.sfari.org');
      expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
      expect(await violationsOf(page)).toEqual([]);
    }
  }
  expect(apiRequests).toEqual([]);
});

test('the top bar and the homepage analysis menu no longer offer the ASD Browser, with the API off', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${web}/`);
  const main = page.getByRole('navigation', { name: 'Main' });
  await main.getByRole('button', { name: 'Variants & sequences' }).click();
  await expect(main.getByRole('link', { name: /^Variant effects/ })).toBeVisible();
  await expect(main.getByRole('link', { name: /ASD Browser/ })).toHaveCount(0);
  await page.keyboard.press('Escape');
  await page.getByRole('combobox', { name: 'Analysis' }).click();
  await expect(page.getByRole('option', { name: /^Variant effects/ })).toBeVisible();
  await expect(page.getByRole('option', { name: /ASD Browser/ })).toHaveCount(0);
  await expect(page.getByRole('contentinfo').getByRole('link', { name: /ASD Browser/ })).toHaveCount(0);
});
