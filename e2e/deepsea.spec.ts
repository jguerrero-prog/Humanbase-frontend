import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

for (const [path, tool] of [['sei', 'Sei'], ['beluga', 'Beluga'], ['seqweaver', 'Seqweaver']]) {
  test(`the ${tool} form checks its example, with the API off`, async ({ page }) => {
    const apiRequests = await apiOff(page);
    await page.goto(`${web}/${path}/`);
    await expect(page.getByRole('heading', { level: 1, name: tool })).toBeVisible();
    expect(await violationsOf(page)).toEqual([]);
    await page.getByRole('radio', { name: 'Use the example' }).click();
    await expect(page.getByRole('button', { name: new RegExp(`^Run ${tool} on \\d+ variants$`) })).toBeVisible();
    expect(await violationsOf(page)).toEqual([]);
    expect(apiRequests).toEqual([]);
  });
}

test('choosing another model opens its page', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/seqweaver/`);
  await page.getByRole('combobox', { name: 'Model' }).click();
  await page.getByRole('option', { name: 'Beluga (DNA, 2019)' }).click();
  await expect(page).toHaveURL(`${web}/beluga/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Beluga' })).toBeVisible();
});

test('starting the Seqweaver example opens its job page, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/seqweaver/`);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await page.getByRole('button', { name: 'Run Seqweaver on 10 variants' }).click();
  await expect(page).toHaveURL(`${web}/deepsea/jobs/00000000-0000-4000-8000-000000000113/`);
  expect(apiRequests).toEqual([]);
});

test('the DeepSEA forms fit a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['sei', 'beluga', 'seqweaver']) {
    await page.goto(`${web}/${path}/`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
