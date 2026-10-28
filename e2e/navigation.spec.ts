import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';
const sections = ['Genes & gene sets', 'Variants & sequences', 'Resources', 'About'];

test.beforeEach(async ({ page }) => {
  await apiOff(page);
});

test('the top bar names its menus for what people bring, and Docs sits under Resources', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${web}/`);
  const main = page.getByRole('navigation', { name: 'Main' });
  await expect(main.getByRole('button')).toHaveText(sections);
  await expect(main.getByRole('link', { name: 'Docs' })).toHaveCount(0);
  await main.getByRole('button', { name: 'Variants & sequences' }).click();
  await expect(main.getByRole('link', { name: /^(Variant effects|Seqweaver|Expression effects)/ })).toHaveText([/^Variant effects/, /^Seqweaver/, /^Expression effects/]);
  await main.getByRole('button', { name: 'Resources' }).click();
  await expect(main.getByRole('link', { name: /^Docs/ })).toHaveAttribute('href', '/docs/');
  const footer = page.getByRole('navigation', { name: 'Footer' });
  for (const section of sections) await expect(footer.getByRole('heading', { name: section })).toBeVisible();
});

test('the top bar marks the section of the open page', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  for (const [path, section] of [['/docs/', 'Resources'], ['/docs/sei/', 'Resources'], ['/netwas/', 'Genes & gene sets'], ['/seqweaver/', 'Variants & sequences'], ['/cite/', 'About']] as const) {
    await page.goto(`${web}${path}`);
    await expect(page.getByRole('navigation', { name: 'Main' }).locator('[aria-current="true"]')).toHaveText(section);
  }
});

test('Compare them opens the sequence tools comparison, marked as Variants & sequences, with no WCAG 2.2 AA violations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${web}/`);
  const main = page.getByRole('navigation', { name: 'Main' });
  await main.getByRole('button', { name: 'Variants & sequences' }).click();
  await main.getByRole('link', { name: 'Compare them' }).click();
  await expect(page).toHaveURL(`${web}/sequence-tools/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Variants & sequences' })).toBeVisible();
  await expect(main.locator('[aria-current="true"]')).toHaveText('Variants & sequences');
  const table = page.getByRole('table', { name: 'Variant and sequence tools compared' });
  await expect(table.getByRole('rowheader')).toHaveText(['Sei', 'Beluga', 'Region scan', 'Seqweaver', 'ExPecto', 'ExPecto SC']);
  await table.getByRole('link', { name: 'ExPecto SC' }).click();
  await expect(page).toHaveURL(`${web}/expression-effects/?model=expecto-sc`);
  await page.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Variants & sequences' }).click();
  await expect(page).toHaveURL(`${web}/sequence-tools/`);
  expect(await violationsOf(page)).toEqual([]);
});

test('Mailing list moves focus to the footer’s email field, on desktop and phone', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${web}/about/`);
  const about = page.getByRole('navigation', { name: 'Main' }).getByRole('button', { name: 'About' });
  await about.focus();
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('End');
  const main = page.getByRole('navigation', { name: 'Main' });
  await expect(main.getByRole('link', { name: /^Mailing list/ })).toBeFocused();
  await page.keyboard.press('Enter');
  const email = page.getByRole('textbox', { name: 'Release notes by email' });
  await expect(email).toBeFocused();
  await expect(email).toBeInViewport();
  await expect(about).toHaveAttribute('aria-expanded', 'false');

  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${web}/`);
  await page.getByRole('button', { name: 'Menu' }).click();
  await main.getByRole('button', { name: 'About' }).click();
  await main.getByRole('link', { name: /^Mailing list/ }).click();
  await expect(email).toBeFocused();
  await expect(email).toBeInViewport();
  await expect(page.getByRole('button', { name: 'Menu' })).toHaveAttribute('aria-expanded', 'false');
});

test('the top bar search lists genes with where each opens, and opens only the destination chosen, with no WCAG 2.2 AA violations', async ({ page }) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${web}/cite/`);
  const box = page.getByRole('combobox', { name: 'Search genes' });
  await expect(box).toHaveAttribute('placeholder', 'Search genes');
  await box.fill('autism');
  const genes = page.getByRole('grid', { name: 'Genes' });
  await expect(genes.getByRole('row')).toHaveCount(5);
  await expect(page.getByText('5 of 21')).toBeVisible();
  await box.press('Enter');
  await expect(page).toHaveURL(`${web}/cite/`);
  await box.press('ArrowDown');
  await box.press('ArrowRight');
  const active = page.locator(`[id="${await box.getAttribute('aria-activedescendant')}"]`);
  await expect(active).toHaveAccessibleName('SHANK2 in Expression effects');
  expect(await violationsOf(page)).toEqual([]);
  await box.press('Enter');
  await expect(page).toHaveURL(`${web}/expression-effects/genes/22941/`);
});

test('old /search links land on the homepage, not the not-found page', async ({ page }) => {
  await page.goto(`${web}/search?q=IL1B`);
  await expect(page).toHaveURL(`${web}/`);
  await expect(page.getByRole('heading', { name: 'Page not found' })).toHaveCount(0);
});

test('the top bar search fits a phone and opens a destination with a tap, with no WCAG 2.2 AA violations', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${web}/cite/`);
  await page.getByRole('button', { name: 'Search', exact: true }).click();
  const box = page.getByRole('combobox', { name: 'Search genes' });
  await expect(box).toBeFocused();
  await box.fill('SHANK3');
  const genes = page.getByRole('grid', { name: 'Genes' });
  await expect(genes.getByRole('row')).toHaveCount(1);
  const panel = await genes.boundingBox();
  expect(panel && panel.x >= 0 && panel.x + panel.width <= 390).toBe(true);
  expect(await violationsOf(page)).toEqual([]);
  await genes.getByRole('link', { name: 'SHANK3 in Networks' }).click();
  await expect(page).toHaveURL(`${web}/networks/?entrez=85358&version=v3`);
});
