import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';

const web = 'http://localhost:4173';
const pages = ['/', '/networks/?entrez=3553&entrez=7124&version=v1', '/not-built-yet/'];

for (const path of pages) {
  test(`web ${path} has no WCAG 2.2 AA violations with the API off`, async ({ page }) => {
    const apiRequests = await apiOff(page);
    await page.goto(web + path);
    await expect(page.locator('h1')).toBeAttached();
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
    const { violations } = await new AxeBuilder({ page }).exclude('[data-illustration]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
    expect(apiRequests).toEqual([]);
  });
}

test('the Networks placeholder reads genes, tissue and version from the URL', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&tissue=blood-vessel&version=v3`);
  await expect(page.getByText('2 genes in the blood-vessel network, MAGE')).toBeVisible();
});

test('Display settings saves reduced motion in this browser', async ({ page }) => {
  await apiOff(page);
  await page.goto(web);
  await page.getByRole('button', { name: 'Display settings' }).click();
  await page.getByRole('radio', { name: /Reduce motion/ }).check();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
});

test('the homepage with genes matched has no WCAG 2.2 AA violations', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(web);
  await page.getByRole('combobox', { name: 'Search genes' }).fill('AUTS12 IL1B TNF');
  await page.getByRole('combobox', { name: 'Search genes' }).press('Enter');
  await expect(page.getByRole('table', { name: 'How your genes matched' })).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  expect(apiRequests).toEqual([]);
});
