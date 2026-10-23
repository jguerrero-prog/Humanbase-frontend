import { expect, test, type Page } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

const chooseGiant = async (page: Page) => {
  await page.getByRole('combobox', { name: 'Data version' }).click();
  await page.getByRole('option', { name: 'GIANT' }).click();
};

test('the NetWAS form opens on MAGE-WAS, checks each example and explains a missing file, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/netwas/`);
  await expect(page.getByRole('heading', { level: 1, name: 'NetWAS' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.getByRole('button', { name: 'Run MAGE-WAS' }).click();
  await expect(page.getByText('1 thing to fix before submitting')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.getByRole('radio', { name: 'Use the example' }).click();
  await expect(page.getByText('1,008 genes with p-values, VEGAS format, ready to run')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Tissue network' })).toHaveText(/Global/);
  expect(await violationsOf(page)).toEqual([]);

  await chooseGiant(page);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await expect(page.getByText('17,692 genes with p-values, VEGAS format, ready to run')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Tissue network' })).toHaveText(/Adipose tissue/);
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the NetWAS form fits a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(`${web}/netwas/`);
  await expect(page.getByRole('heading', { level: 1, name: 'NetWAS' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});

test('the GWAS file rules title stays on one line at every width', async ({ page }) => {
  await apiOff(page);
  for (const width of [1440, 1024, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${web}/netwas/`);
    const title = page.locator('#gwas-file-rules .accordion-title');
    await expect(title).toHaveText('GWAS file rules for MAGE-WAS');
    expect((await title.boundingBox())?.height).toBeLessThan(24);
  }
});

const job = (n: number) => `${web}/netwas/00000000-0000-4000-8000-00000000000${n}/`;

test('starting the example opens its job page, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/netwas/`);
  await chooseGiant(page);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await page.getByRole('button', { name: 'Run NetWAS on 17,692 genes' }).click();
  await expect(page).toHaveURL(job(1));
  await expect(page.getByRole('status').filter({ hasText: /Running for/ })).toBeVisible();
  await expect(page.getByRole('button', { name: /^Jobs/ })).toContainText('1 running');
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('each NetWAS job state has no WCAG 2.2 AA violations, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(job(4));
  await expect(page.getByText('Waiting for a worker to start it.')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.goto(job(2));
  await expect(page.getByText('Failed: no p-value column')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'Edit and resubmit' }).click();
  await expect(page).toHaveURL(`${web}/netwas/`);
  await expect(page.getByRole('textbox', { name: 'Job title (optional)' })).toHaveValue('Height GWAS');

  await page.goto(`${web}/netwas/c66b3d05-2f49-4522-b910-1605609e4083/`);
  await expect(page.getByRole('link', { name: 'Open in Networks for KRT6B' })).toHaveAttribute('href', '/networks/?entrez=3854&tissue=adipose-tissue&version=v1');
  await expect(page.getByText('keratin 6B')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('tab', { name: 'Job details' }).click();
  await expect(page.getByText('c66b3d05-2f49-4522-b910-1605609e4083')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.goto(`${web}/netwas/00000000-0000-4000-8000-000000000000/`);
  await expect(page.getByText('This NetWAS job isn’t available')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the NetWAS job and result pages fit a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  await page.goto(job(1));
  await expect(page.getByRole('status').filter({ hasText: /Running for/ })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  await page.goto(`${web}/netwas/c66b3d05-2f49-4522-b910-1605609e4083/`);
  await expect(page.getByRole('link', { name: 'Open in Networks for KRT6B' })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
});
