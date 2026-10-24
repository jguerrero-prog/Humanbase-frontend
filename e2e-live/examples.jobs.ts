import { expect, test, type Page } from '@playwright/test';
import { checkScreen, watch, web } from './live';

// Each test submits one real job. Jobs can take most of an hour; none is ever resubmitted.
test.describe.configure({ mode: 'parallel', retries: 0 });

const fiftyMinutes = 50 * 60_000;

async function waitForOutcome(page: Page, result: ReturnType<Page['locator']>) {
  const failed = page.getByRole('status').filter({ hasText: /^Failed/ });
  await expect(result.or(failed).first()).toBeVisible({ timeout: fiftyMinutes });
  if (await failed.isVisible()) throw new Error(`The job failed: ${await failed.innerText()} (${page.url()})`);
}

for (const [tool, path, run] of [
  ['Beluga', '/variant-effects/?model=beluga', /^Run Beluga on \d+ variants$/],
  ['Seqweaver', '/seqweaver/', /^Run Seqweaver on \d+ variants$/],
  ['ExPecto', '/expression-effects/?tab=submit-variants', /^Run ExPecto on \d+ variants$/],
] as const) {
  test(`a ${tool} example job runs and its result renders`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(`${web}${path}`);
    await page.getByRole('radio', { name: 'Use the example' }).click();
    await page.getByRole('button', { name: run }).click();
    await expect(page).toHaveURL(/\/deepsea\/jobs\/[0-9a-f-]{36}\//);
    test.info().annotations.push({ type: 'job', description: `${tool} ${page.url()}` });
    console.warn(`${tool} job: ${page.url()}`);
    await waitForOutcome(page, page.getByRole('heading', { name: /effects of chr/ }));
    await expect(page.locator('.genome-engine')).toBeVisible();
    await checkScreen(page, problems);
  });
}

test('a NetWAS example job runs and its result renders', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/netwas/`);
  await page.getByRole('combobox', { name: 'Data version' }).click();
  await page.getByRole('option', { name: 'GIANT' }).click();
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await expect(page.getByText('17,692 genes with p-values, VEGAS format, ready to run')).toBeVisible();
  await page.getByRole('button', { name: /^Run NetWAS on 17,692 genes$/ }).click();
  await expect(page).toHaveURL(/\/netwas\/[0-9a-f-]{36}\//);
  test.info().annotations.push({ type: 'job', description: `NetWAS ${page.url()}` });
  console.warn(`NetWAS job: ${page.url()}`);
  await waitForOutcome(page, page.getByRole('link', { name: /^Open in Networks for / }).first());
  await checkScreen(page, problems);
});

test('a region scan example job runs and its substitution map renders', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/variant-effects/?tab=region-scan`);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await page.getByRole('button', { name: /^Run region scan on \d+ sequences$/ }).click();
  await expect(page).toHaveURL(/\/deepsea\/jobs\/[0-9a-f-]{36}\//);
  test.info().annotations.push({ type: 'job', description: `Region scan ${page.url()}` });
  console.warn(`Region scan job: ${page.url()}`);
  await waitForOutcome(page, page.getByRole('grid', { name: /^Substitutions at positions/ }));
  await checkScreen(page, problems);
});

test('a fresh Modules job runs and its modules render', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/modules/`);
  await page.getByRole('button', { name: 'renal disease panel' }).click();
  await expect(page.getByText(/^\d+ matched$/)).toBeVisible();
  // A title of its own makes the API start a new task instead of returning the cached example.
  await page.getByRole('textbox', { name: 'Title' }).fill(`Live suite renal panel ${new Date().toISOString().slice(0, 16)}`);
  await page.getByRole('button', { name: /^Find modules in / }).click();
  await expect(page).toHaveURL(/\/modules\/\?body_tag=[0-9a-f]+/);
  test.info().annotations.push({ type: 'job', description: `Modules ${page.url()}` });
  console.warn(`Modules job: ${page.url()}`);
  const unavailable = page.getByRole('heading', { name: 'This module result isn’t available' });
  await expect(page.getByText(/Showing \d+ enriched modules/).or(unavailable).first()).toBeVisible({ timeout: fiftyMinutes });
  if (await unavailable.isVisible()) throw new Error(`The Modules job failed (${page.url()})`);
  await checkScreen(page, problems);
});
