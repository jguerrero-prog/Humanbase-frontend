import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';
const example = `${web}/deepsea/jobs/0576e894-a2c5-48bb-9bdf-227962495d5f/`;

test('the in silico mutagenesis form runs its example into the job page, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/ism/`);
  await expect(page.getByRole('heading', { level: 1, name: 'In silico mutagenesis' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await page.getByRole('button', { name: 'Run in silico mutagenesis on 4 sequences' }).click();
  await expect(page).toHaveURL(`${web}/deepsea/jobs/00000000-0000-4000-8000-000000000151/`);
  await expect(page.getByText('4 sequences, FASTA')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the in silico mutagenesis result moves its window and explains choices the samples lack, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(example);
  await expect(page.getByRole('grid', { name: 'Substitutions at positions 984 to 1,013' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('row', { name: /^1,005 .*A>T/ }).getByRole('button', { name: 'Show position 1,005 in the map' }).click();
  await expect(page.getByRole('grid', { name: 'Substitutions at positions 990 to 1,019' })).toBeVisible();
  await page.getByRole('combobox', { name: /^Sequence/ }).click();
  await page.getByRole('option', { name: /known_GATA1_binding_increase/ }).click();
  await expect(page.getByText('The sample data doesn’t include this choice')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the in silico mutagenesis pages fit a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of [`${web}/ism/`, example]) {
    await page.goto(path);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});
