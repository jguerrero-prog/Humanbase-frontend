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
  // As on humanbase.io, the effects card opens on Heatmap, even with one variant in range.
  await expect(page.getByRole('tab', { name: 'Heatmap' })).toHaveAttribute('aria-selected', 'true');
  expect(await violationsOf(page)).toEqual([]);
  for (const tab of ['Strongest effects', 'All features']) {
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
  await page.getByRole('tab', { name: 'Strongest effects' }).click();
  await expect(page.getByText('Raises, 13 sequence classes')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.goto(`${web}/deepsea/jobs/8b26a498-278c-4c73-a6a4-5f2550c30073/`);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr3:12,598,855 G>A' })).toBeVisible();
  await page.getByRole('tab', { name: 'Strongest effects' }).click();
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

test('the Sei score plot switches plot style, zooms with the brush, the wheel and keys, and selects, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/deepsea/jobs/2e18fedf-3de7-4d08-a894-9a937a2b860b/`);
  const plot = page.getByRole('figure', { name: /^12 variants/ });
  const ticks = plot.locator('.variant-plot-tick');
  const windowWidth = async () => Number(await plot.locator('.variant-plot-window').getAttribute('width'));
  await expect(plot.getByText('Genome', { exact: true })).toBeVisible();
  await expect(ticks.filter({ hasText: 'chr3:12598855' })).toHaveCount(1);
  await expect(plot.getByRole('button', { name: /^chr3:12,598,855 G>A/ })).toHaveAttribute('aria-pressed', 'true');
  const whole = await windowWidth();
  const wholeTicks = await ticks.allTextContents();

  await plot.scrollIntoViewIfNeeded();
  const brush = await plot.locator('.variant-plot-brush').boundingBox();
  if (!brush) throw new Error('no brush');
  // The window starts on the whole axis, so zooming starts from a handle.
  await page.mouse.move(brush.x + brush.width - 1, brush.y + brush.height / 2);
  await page.mouse.down();
  await page.mouse.move(brush.x + brush.width * 0.4, brush.y + brush.height / 2, { steps: 5 });
  await page.mouse.up();
  expect(await windowWidth()).toBeLessThan(whole * 0.5);
  expect(await ticks.allTextContents()).not.toEqual(wholeTicks);

  await page.getByRole('combobox', { name: 'Plot style' }).click();
  await page.getByRole('option', { name: 'Score Rank' }).click();
  await expect(plot.getByText('Rank', { exact: true })).toBeVisible();
  expect(await windowWidth()).toBeCloseTo(whole);
  await plot.getByRole('button', { name: /^chr7:49,813,589 G>C/ }).click();
  await expect(page).toHaveURL(/variant=chr7-49813589-G-C/);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr7:49,813,589 G>C' })).toBeVisible();

  await plot.scrollIntoViewIfNeeded();
  const box = await plot.locator('svg').boundingBox();
  if (!box) throw new Error('no plot');
  await page.mouse.move(box.x + box.width / 2, box.y + 120);
  await page.mouse.wheel(0, -100);
  await expect.poll(windowWidth).toBeLessThan(whole);

  await plot.getByRole('button', { name: /^chr7:49,813,589 G>C/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(plot.getByRole('button', { name: /^chr17:76,352,731/ })).toBeFocused();
  await expect(page.getByRole('tooltip')).toContainText('chr17:76,352,731');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/variant=chr17-76352731-/);
  const zoomed = await windowWidth();
  await page.keyboard.press('-');
  await expect.poll(windowWidth).toBeGreaterThan(zoomed);
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});
