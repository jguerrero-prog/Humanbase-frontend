import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const app = 'http://localhost:4173';

test.beforeEach(async ({ page }) => {
  await apiOff(page);
});

test('/docs/ is the user guide, with the sidebar and no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto(`${app}/docs/`);
  await expect(page).toHaveTitle('Humanbase User Guide · Docs · Humanbase');
  await expect(page.getByRole('heading', { level: 1, name: 'Humanbase User Guide' })).toBeVisible();
  const nav = page.getByRole('navigation', { name: 'Docs' });
  await expect(nav.getByRole('link', { name: 'Humanbase user guide' })).toHaveAttribute('aria-current', 'page');
  for (const group of ['Get started', 'Network analysis', 'Sequence analysis']) await expect(nav.getByRole('heading', { name: group })).toBeVisible();
  await expect(page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Licensing' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
});

test('/docs/sei/#output lands on Output, marks it in On this page and shows the sequence class table', async ({ page }) => {
  await page.goto(`${app}/docs/sei/#output`);
  const output = page.getByRole('heading', { level: 2, name: 'Output' });
  await expect(output).toBeInViewport();
  await expect(page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Output' })).toHaveAttribute('aria-current', 'location');
  const table = page.getByRole('table', { name: 'Sequence classes' });
  await expect(table.getByRole('row')).toHaveCount(41);
  await expect(page.locator('main sub', { hasText: 'alt' })).toBeVisible();
  await page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Input' }).click();
  await expect(page).toHaveURL(/\/docs\/sei\/#input$/);
  await expect(page.getByRole('navigation', { name: 'On this page' }).getByRole('link', { name: 'Input' })).toHaveAttribute('aria-current', 'location');
  expect(await violationsOf(page)).toEqual([]);
});

test('a use case shows its screenshots under Docs / Use cases', async ({ page }) => {
  await page.goto(`${app}/docs/use-cases/sei-use-case/`);
  const crumbs = page.getByRole('navigation', { name: 'Breadcrumb' });
  await expect(crumbs.getByRole('link')).toHaveText(['Docs', 'Use cases']);
  await expect(page.getByRole('navigation', { name: 'Docs' }).getByRole('link', { name: 'Use cases', exact: true })).toHaveAttribute('aria-current', 'true');
  await expect(page.getByRole('navigation', { name: 'Docs' }).getByRole('link', { name: 'Sei use case' })).toHaveAttribute('aria-current', 'page');
  const figures = page.getByRole('main').getByRole('figure');
  await expect(figures).toHaveCount(4);
  for (const figure of await figures.all()) {
    await figure.scrollIntoViewIfNeeded();
    await expect.poll(() => figure.locator('img').evaluate((img: HTMLImageElement) => img.complete && img.naturalWidth > 0)).toBe(true);
  }
  expect(await violationsOf(page)).toEqual([]);
});

test('a chevron shows another page’s sections in place, and the open page marks the section being read', async ({ page }) => {
  await page.goto(`${app}/docs/sei/`);
  const nav = page.getByRole('navigation', { name: 'Docs' });
  const seiSections = nav.getByRole('button', { name: 'Show sections of Sei', exact: true });
  await expect(seiSections).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('link', { name: 'Introduction' })).toHaveAttribute('aria-current', 'location');

  const beluga = nav.getByRole('button', { name: 'Show sections of Beluga (DeepSEA)' });
  await beluga.focus();
  await page.keyboard.press('Enter');
  await expect(beluga).toHaveAttribute('aria-expanded', 'true');
  await expect(nav.getByRole('link', { name: 'Output' })).toHaveCount(2);
  await expect(page).toHaveURL(`${app}/docs/sei/`);
  await page.keyboard.press('Space');
  await expect(beluga).toHaveAttribute('aria-expanded', 'false');

  await page.getByRole('heading', { level: 3, name: 'Sequence classes' }).evaluate((heading) => heading.scrollIntoView());
  await expect(nav.getByRole('link', { name: 'Output' })).toHaveAttribute('aria-current', 'location');
  await expect(nav.getByRole('link', { name: 'Introduction' })).not.toHaveAttribute('aria-current');
  expect(await violationsOf(page)).toEqual([]);
});

test('sidebar links move between pages without reloading the app', async ({ page }) => {
  await page.goto(`${app}/docs/`);
  await page.evaluate(() => Object.assign(window, { stayed: true }));
  await page.getByRole('navigation', { name: 'Docs' }).getByRole('link', { name: 'Seqweaver' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Seqweaver' })).toBeVisible();
  expect(await page.evaluate(() => (window as unknown as { stayed?: boolean }).stayed)).toBe(true);
});

test('Search the docs finds a section and opens it with the keyboard', async ({ page }) => {
  await page.goto(`${app}/docs/`);
  const search = page.getByRole('combobox', { name: 'Search the docs' });
  await search.fill('sequence classes');
  await expect(page.getByRole('option').first()).toContainText('Sequence classes');
  await search.press('ArrowDown');
  await search.press('Enter');
  await expect(page).toHaveURL(/\/docs\/sei\/#sequence-classes$/);
  await expect(page.getByRole('heading', { level: 3, name: 'Sequence classes' })).toBeInViewport();
  await search.fill('zzqx');
  await expect(page.locator('.search-suggestions-empty-title')).toHaveText('No pages match “zzqx”');
});

test('on a phone the sidebar opens from the Docs menu button', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto(`${app}/docs/sei/`);
  await expect(page.getByRole('navigation', { name: 'Docs' })).toBeHidden();
  await expect(page.getByRole('navigation', { name: 'On this page' })).toBeVisible();
  await page.getByRole('button', { name: 'Docs menu' }).click();
  const menu = page.getByRole('dialog', { name: 'Docs' });
  await expect(menu.getByRole('navigation', { name: 'Docs' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await menu.getByRole('link', { name: 'ExPecto', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'ExPecto' })).toBeVisible();
  await expect(menu).toBeHidden();
});

test('readthedocs addresses redirect to the clean routes, keeping the anchor', async ({ page }) => {
  await page.goto(`${app}/docs/sei.html#output`);
  await expect(page).toHaveURL(`${app}/docs/sei/#output`);
  await page.goto(`${app}/docs/use-cases/sei-use-case.html`);
  await expect(page).toHaveURL(`${app}/docs/use-cases/sei-use-case/`);
});

test('an unknown docs page shows Not found', async ({ page }) => {
  await page.goto(`${app}/docs/not-a-page/`);
  await expect(page.getByText('This page isn’t here yet')).toBeVisible();
});
