import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

// IRGM and PTEN are large tables, and each scan reads every heatmap cell, so these tests get longer than 30 seconds.
test.describe.configure({ timeout: 90_000 });

test('the Expression effects Gene tab opens IRGM by tissue system, then by tissue, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/expression-effects/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Expression effects' })).toBeVisible();
  await expect(page.getByRole('tab')).toHaveText(['Gene', 'rsID', 'Submit variants']);
  await expect(page.getByRole('combobox', { name: 'Model' })).toHaveText(/ExPecto \(tissues\)/);
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'IRGM' }).click();
  await expect(page).toHaveURL(`${web}/expression-effects/genes/345611/`);
  await expect(page.getByText('Predicted effect on IRGM expression, log fold change')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('hematopoietic system').first()).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('radio', { name: 'Tissues' }).click();
  await expect(page).toHaveURL(`${web}/expression-effects/genes/345611/?view=tissues`);
  expect(apiRequests).toEqual([]);
});

test('IRGM’s tissues filter by system and keep the filter in the URL, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  const heading = page.getByText('Predicted effect on IRGM expression, log fold change: 10 of 204 tissues');
  await page.goto(`${web}/expression-effects/genes/345611/?view=tissues`);
  await page.getByRole('combobox', { name: 'Tissue system' }).click();
  await page.getByRole('option', { name: 'hematopoietic system' }).click();
  await expect(heading).toBeVisible({ timeout: 15_000 });
  expect(await violationsOf(page)).toEqual([]);
  await page.reload();
  await expect(heading).toBeVisible({ timeout: 15_000 });
  expect(apiRequests).toEqual([]);
});

test('the rsID tab finds a gene, an rsID and a position, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/expression-effects/`);
  await page.getByRole('tab', { name: 'rsID' }).click();
  await expect(page).toHaveURL(`${web}/expression-effects/?tab=rsid`);
  await page.getByRole('button', { name: 'IRGM' }).click();
  await expect(page.getByRole('heading', { name: '17 variants for IRGM' })).toBeVisible();
  await expect(page).toHaveURL(`${web}/expression-effects/?tab=rsid&q=IRGM`);
  await expect(page.getByRole('link', { name: 'IRGM' }).first()).toHaveAttribute('href', '/expression-effects/genes/345611/');
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'rs531708574' }).click();
  await expect(page.getByRole('heading', { name: '1 variant for rs531708574' })).toBeVisible();
  await page.getByRole('button', { name: 'chr1:877047' }).click();
  await expect(page.getByRole('link', { name: 'SAMD11' })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('ExPecto SC opens PTEN by organ, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/expression-effects/`);
  await page.getByRole('combobox', { name: 'Model' }).click();
  await page.getByRole('option', { name: 'ExPecto SC (cell types)' }).click();
  await expect(page).toHaveURL(`${web}/expression-effects/?model=expecto-sc`);
  await expect(page.getByRole('heading', { level: 2, name: 'About ExPecto SC' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'PTEN' }).click();
  await expect(page).toHaveURL(`${web}/expression-effects/genes/5728/?model=expecto-sc`);
  await expect(page.getByText('Predicted effect on PTEN expression, z-score')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('retina').first()).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the PTEN heatmap scrolls inside its card under pinned row labels, with no cut position label, with the API off', async ({ page }) => {
  await apiOff(page);
  const labelsOutside = () =>
    page.locator('.heatmap-plot').evaluate((plot) => {
      const box = plot.getBoundingClientRect();
      const cells = plot.querySelector('.heatmap-row-label')?.getBoundingClientRect().right ?? box.left;
      return [...plot.querySelectorAll<HTMLElement>('.heatmap-position-labels > span:not([data-cut])')]
        .filter((label) => label.textContent)
        .filter((label) => {
          const left = label.getBoundingClientRect().left;
          return left < cells - 0.5 || left + label.scrollWidth > box.right + 0.5;
        })
        .map((label) => label.textContent);
    });
  const rowLabelLeft = () => page.locator('.heatmap-plot').evaluate((plot) => (plot.querySelector('.heatmap-row-label')?.getBoundingClientRect().left ?? 0) - plot.getBoundingClientRect().left);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${web}/expression-effects/genes/5728/?model=expecto-sc`);
    const frame = page.locator('.heatmap-frame');
    await expect(frame).toHaveAttribute('data-more', 'true', { timeout: 15_000 });
    const [plotRight, cardRight] = await page.locator('.heatmap-plot').evaluate((plot) => [plot.getBoundingClientRect().right, plot.closest('section')?.getBoundingClientRect().right ?? 0]);
    expect(plotRight).toBeLessThanOrEqual(cardRight);
    await expect.poll(labelsOutside).toEqual([]);
    await page.locator('.heatmap-plot').evaluate((plot) => plot.scrollTo({ left: plot.scrollWidth }));
    await expect(frame).not.toHaveAttribute('data-more');
    expect(await rowLabelLeft()).toBeCloseTo(0, 0);
    await expect.poll(labelsOutside).toEqual([]);
    await expect(page.locator('.heatmap-position-labels > span:not([data-cut])').filter({ hasText: /\d/ }).last()).toHaveText('89,639,918');
  }
});

test('the ExPecto Submit variants tab checks its example, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/expression-effects/?tab=submit-variants`);
  await expect(page.getByRole('combobox', { name: 'Model' })).toHaveText(/ExPecto \(tissues\)/);
  await expect(page.getByText('Variants within 20 kb of a gene’s start can be scored.')).toBeVisible();
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await expect(page.getByRole('button', { name: 'Run ExPecto on 12 variants' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('running the ExPecto example opens its result, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/expression-effects/?tab=submit-variants`);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await page.getByRole('button', { name: 'Run ExPecto on 12 variants' }).click();
  await expect(page).toHaveURL(`${web}/deepsea/jobs/e504e3cc-6a9a-4f35-99e3-9185d6f5c4a1/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled ExPecto job' })).toBeVisible();
  await page.getByRole('table', { name: 'Variants in this job' }).getByRole('button', { name: /NEUROG1/ }).click();
  await page.getByRole('tab', { name: 'Strongest effects' }).click();
  await expect(page.getByText('Fallopian Tube')).toBeVisible();
  // ExPecto's paper calls these expression effects; the other models keep Molecular effects.
  await expect(page.getByRole('heading', { name: /^Expression effects of chr5:134,871,851/ })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('ExPecto SC says which tabs it can’t answer yet and switches to ExPecto, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  for (const [tab, title] of [
    ['rsid', 'rsID search isn’t available for ExPecto SC yet'],
    ['submit-variants', 'Submitting variants isn’t available for ExPecto SC yet'],
  ] as const) {
    await page.goto(`${web}/expression-effects/?tab=${tab}&model=expecto-sc`);
    await expect(page.getByText(title)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Run/ })).toHaveCount(0);
    expect(await violationsOf(page)).toEqual([]);
    await page.getByRole('button', { name: 'Switch to ExPecto' }).click();
    await expect(page).toHaveURL(`${web}/expression-effects/?tab=${tab}`);
    await expect(page.getByRole('combobox', { name: 'Model' })).toHaveText(/ExPecto \(tissues\)/);
  }
  await page.goBack();
  await expect(page.getByText('Submitting variants isn’t available for ExPecto SC yet')).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('the old ExPecto and ExPecto SC addresses open the same tab, model and gene', async ({ page }) => {
  await apiOff(page);
  for (const [from, to] of [
    ['expecto/', 'expression-effects/'],
    ['expecto/snps/?q=IRGM', 'expression-effects/?tab=rsid&q=IRGM'],
    ['expecto/variants/', 'expression-effects/?tab=submit-variants'],
    ['expecto/genes/345611/?view=tissues', 'expression-effects/genes/345611/?view=tissues'],
    ['expecto-sc/', 'expression-effects/?model=expecto-sc'],
    ['expecto-sc/genes/5728/?view=cells', 'expression-effects/genes/5728/?model=expecto-sc&view=cells'],
  ]) {
    await page.goto(`${web}/${from}`);
    await expect(page).toHaveURL(`${web}/${to}`);
  }
});

test('the Expression effects pages fit a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['expression-effects/', 'expression-effects/?tab=rsid&q=IRGM', 'expression-effects/?tab=submit-variants', 'expression-effects/?tab=submit-variants&model=expecto-sc', 'expression-effects/genes/345611/', 'expression-effects/?model=expecto-sc', 'expression-effects/genes/5728/?model=expecto-sc']) {
    await page.goto(`${web}/${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth), path).toBeLessThanOrEqual(375);
  }
});
