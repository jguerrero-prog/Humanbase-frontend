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

const job = (n: number) => `${web}/deepsea/jobs/00000000-0000-4000-8000-${String(n).padStart(12, '0')}/`;
const example = `${web}/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/`;

test('the Seqweaver example result has no WCAG 2.2 AA violations in each view, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(example);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr1:109,817,590 G>T' })).toBeVisible();
  await expect(page.getByText('LIN28A').first()).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  for (const tab of ['Heatmap', 'All features']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
    expect(await violationsOf(page)).toEqual([]);
  }
  await page.getByRole('button', { name: 'Next' }).click();
  await expect(page).toHaveURL(/variant=chr10-23508363-A-G/);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr10:23,508,363 A>G' })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('Sei and Beluga results read their own scales, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/deepsea/jobs/2e18fedf-3de7-4d08-a894-9a937a2b860b/?variant=chr7-49813589-G-C`);
  await expect(page.getByText('Raises, 13 sequence classes')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.goto(job(102));
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr3:12,598,855 G>A' })).toBeVisible();
  await expect(page.getByText('UBF', { exact: true })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('each waiting job state has no WCAG 2.2 AA violations, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  for (const [n, text] of [[131, 'Queued'], [111, /Running for/], [121, 'Failed: chr23 is not a chromosome on GRCh37/hg19']] as const) {
    await page.goto(job(n));
    await expect(page.getByRole('status').filter({ hasText: text })).toBeVisible();
    expect(await violationsOf(page)).toEqual([]);
  }
  await page.goto(job(0));
  await expect(page.getByText('This job isn’t available')).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('the DeepSEA job and result pages fit a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const url of [job(111), example]) {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
