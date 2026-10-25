import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const cite = 'http://localhost:4173/cite/';
const citation =
  'Sealfon, R.S.G., Theesfeld, C.L., Funk, J., Sauerwald, N., Wong, A.K. & Troyanskaya, O.G. HumanBase: an interactive AI platform for human biology. Nat Methods (2026). https://doi.org/10.1038/s41592-025-02994-8';

const methodDois = ['10.1038/ng.3259', '10.1038/nn.4353', '10.1038/s41588-022-01102-2', '10.1038/s41588-018-0160-6', '10.1038/s41588-018-0160-6', '10.1016/j.crmeth.2023.100580', '10.1038/s41588-020-00761-3', '10.1038/nmeth.3547'];

test.beforeEach(async ({ page }) => {
  await apiOff(page);
});

test('the How to cite page renders both sections with no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto(cite);
  await expect(page).toHaveTitle('How to cite Humanbase');
  const article = page.getByRole('article', { name: 'How to cite Humanbase' });
  await expect(article.getByRole('heading', { level: 1 })).toBeVisible();
  for (const heading of ['Citing Humanbase', 'Additional references']) {
    await expect(article.getByRole('heading', { level: 2, name: heading })).toBeVisible();
  }
  await expect(article.getByText(citation)).toBeVisible();
  await expect(article.locator('i')).toHaveText('Nat Methods');
  expect(await violationsOf(page)).toEqual([]);
});

test('every DOI links to doi.org, the method papers as live has them', async ({ page }) => {
  await page.goto(cite);
  await expect(page.getByRole('link', { name: 'https://doi.org/10.1038/s41592-025-02994-8' })).toHaveAttribute('href', 'https://doi.org/10.1038/s41592-025-02994-8');
  const methods = page.locator('.cite-methods');
  await expect(methods.locator('dt')).toHaveText(['Functional Networks (GIANT)', 'Functional Module Detection', 'Sei', 'Beluga', 'ExPecto', 'ExPectoSC', 'Seqweaver', 'DeepSEA']);
  const links = methods.getByRole('link');
  await expect(links).toHaveText(methodDois.map((doi) => `doi:${doi}`));
  for (const [index, doi] of methodDois.entries()) {
    await expect(links.nth(index)).toHaveAttribute('href', `https://doi.org/${doi}`);
  }
});

test('Copy citation copies the plain-text citation and announces it', async ({ page, context }) => {
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.goto(cite);
  // Chromium refuses clipboard writes from a page without focus, which parallel workers can cause.
  await page.bringToFront();
  await page.getByRole('button', { name: 'Copy citation' }).click();
  await expect(page.getByRole('status').filter({ hasText: /copied|copy/ })).toHaveText('Citation copied');
  await expect(page.getByRole('button', { name: 'Copied' })).toBeVisible();
  expect(await page.evaluate(() => navigator.clipboard.readText())).toBe(citation);
  await expect(page.getByRole('button', { name: 'Copy citation' })).toBeVisible();
});
