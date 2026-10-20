import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test('Modules on the homepage checks an example list and starts a job, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/modules/`);
  await expect(page).toHaveURL(/\/\?analysis=modules$/);
  await expect(page.getByRole('heading', { name: 'How module detection works' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.getByRole('button', { name: 'renal disease panel' }).click();
  await expect(page.getByText('468 matched', { exact: true })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.getByRole('button', { name: 'Find modules in 504 genes' }).click();
  await expect(page).toHaveURL(/\/modules\/\?body_tag=2339dc3cd05964ab3f691a8f4851c7a9aab78ad9/);
  await expect(page.getByRole('heading', { level: 1, name: 'Renal disease panel' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('a module result that no longer exists says so', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/modules/?body_tag=0000`);
  await expect(page.getByText('This module result isn’t available')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

const renal = `${web}/modules/?body_tag=2339dc3cd05964ab3f691a8f4851c7a9aab78ad9`;

test('the module result has no WCAG 2.2 AA violations in each view, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(renal);
  await expect(page.getByText('Showing 14 enriched modules of 2 genes or more. Edges hidden.')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await page.getByRole('table', { name: 'Modules and their top terms' }).getByRole('button', { name: 'M1' }).click();
  await expect(page.getByRole('dialog', { name: 'M1, renal system development' })).toBeVisible();
  await expect(page).toHaveURL(/module=1/);
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'Close' }).click();

  await page.getByRole('tab', { name: 'Genes' }).click();
  await expect(page.getByRole('table', { name: 'Genes in each module' }).getByText('ABCB11')).toBeVisible();
  await page.getByRole('button', { name: 'View as table' }).click();
  // Opened directly, the result has no name in this browser, and examples are sent without a title.
  await expect(page.getByRole('table', { name: 'Genes in the modules of Untitled module search' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the module result keeps its view in the URL, so a refresh shows the same thing', async ({ page }) => {
  await apiOff(page);
  await page.goto(renal);
  // The checkboxes follow the URL, so each is clicked and then checked once the URL has caught up.
  await page.getByRole('checkbox', { name: 'Show edges' }).click();
  await expect(page.getByRole('checkbox', { name: 'Show edges' })).toBeChecked();
  await page.getByRole('checkbox', { name: 'Hide modules with no enriched terms' }).click();
  await expect(page.getByRole('checkbox', { name: 'Hide modules with no enriched terms' })).not.toBeChecked();
  await expect(page).toHaveURL(/edges=1&all=1/);
  await page.reload();
  await expect(page.getByText('Showing 20 modules of 2 genes or more. Edges shown.')).toBeVisible();
  await expect(page.locator('.force-graph-links line').first()).toBeAttached();
});

test('Edit genes takes the result’s list back to the search', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(renal);
  await page.getByRole('button', { name: 'Edit genes' }).click();
  await expect(page).toHaveURL(/\/\?analysis=modules$/);
  await expect(page.getByRole('textbox', { name: 'Title' })).toHaveValue('');
  await expect(page.getByRole('button', { name: 'Find modules in 504 genes' })).toBeVisible();
  expect(apiRequests).toEqual([]);
});
