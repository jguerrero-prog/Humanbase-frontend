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

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test('the Networks result has no WCAG 2.2 AA violations once loaded, with the data types open', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&entrez=100188314&version=v1`);
  await expect(page.getByText(/Showing 15 of 50 genes, \d+ connections at 0\.48 or more/)).toBeVisible();
  await expect(page.getByText('AUTS12 was left out because it isn’t in any Humanbase network. This network uses IL1B and TNF.')).toBeVisible();
  await page.getByRole('button', { name: 'Data types' }).click();
  await expect(page.getByRole('checkbox', { name: 'Co-expression' })).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('Networks keeps filters and the selected gene in the URL, so a refresh shows the same view', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  const genes = page.getByRole('table', { name: /Genes functionally related/ });
  await genes.getByRole('button', { name: /^ICAM1/ }).click();
  await expect(page).toHaveURL(/gene=3383/);
  await page.getByRole('textbox', { name: 'Genes shown, exact value' }).fill('20');
  await page.getByRole('textbox', { name: 'Genes shown, exact value' }).press('Enter');
  await expect(page).toHaveURL(/shown=20/);
  await page.reload();
  await expect(page.getByText(/Showing 20 of 50 genes/)).toBeVisible();
  await expect(page.locator('.force-graph-node.is-selected')).toHaveAttribute('aria-label', 'ICAM1, related gene');
});

test('Networks explains a gene that is in no network', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/networks/?entrez=100188314&version=v1`);
  await expect(page.getByText('AUTS12 is not in this network')).toBeVisible();
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

test('the Processes panel and both drawers have no WCAG 2.2 AA violations with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  const scan = async () => {
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
    const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  };
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await page.getByRole('tab', { name: /^Processes/ }).click();
  await expect(page.getByRole('table', { name: /Biological processes over-represented/ }).getByText(/Gene Ontology \(BP\), \d+ genes/).first()).toBeVisible();
  await scan();
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1&gene=3383`);
  await expect(page.getByRole('dialog', { name: 'ICAM1' }).getByRole('region', { name: 'Annotations' }).getByRole('listitem').first()).toBeVisible();
  await scan();
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1&connection=6348-7185`);
  await expect(page.getByRole('dialog', { name: 'CCL3 and TRAF1' }).getByText('MSigDB CGP')).toBeVisible();
  await scan();
  expect(apiRequests).toEqual([]);
});

test('View as table and Expand have no WCAG 2.2 AA violations and survive a refresh', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await page.getByRole('button', { name: 'View as table' }).click();
  await page.getByRole('button', { name: 'Expand' }).click();
  await expect(page).toHaveURL(/display=table.*expand=1/);
  await page.reload();
  await expect(page.getByRole('table', { name: /Connections between the genes/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-pressed', 'true');
  const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

for (const [tab, ready] of [
  ['expression', 'Where IL1B and TNF are expressed'],
  ['processes', 'Biological processes linked to IL1B and TNF'],
  ['diseases', 'Diseases linked to IL1B and TNF'],
  ['process', 'Choose a biological process to see its network'],
] as const) {
  test(`the ${tab} tab has no WCAG 2.2 AA violations or horizontal scroll with the API off`, async ({ page }) => {
    const apiRequests = await apiOff(page);
    await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1&tab=${tab}`);
    await expect(page.getByText(ready).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
    const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(apiRequests).toEqual([]);
  });
}

test('choosing a process keeps the Process network tab and draws that network', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1&tab=process`);
  await page.getByRole('button', { name: 'Choose a process' }).click();
  await page.getByRole('option', { name: 'acute inflammatory response' }).click();
  await expect(page).toHaveURL(/process=acute-inflammatory-response/);
  await expect(page).toHaveURL(/tab=process/);
  await expect(page.getByRole('table', { name: /in the acute inflammatory response network/ })).toBeVisible();
});

test('Edit genes adds a gene without starting over and has no WCAG 2.2 AA violations', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await page.getByRole('button', { name: 'Edit genes' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit genes' });
  await expect(dialog.getByText('2 matched: IL1B, TNF')).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  await dialog.getByRole('textbox', { name: 'Genes' }).fill('IL1B\nTNF\nICAM1');
  await expect(dialog.getByText('3 matched: IL1B, TNF, ICAM1')).toBeVisible();
  await page.getByRole('button', { name: 'Show network for 3 genes' }).click();
  await expect(page).toHaveURL(/entrez=3383/);
  await expect(page).toHaveURL(/version=v1/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/ICAM1/);
  expect(apiRequests).toEqual([]);
});

test('Compare adds a second network side by side, keeps it in the URL and has no WCAG 2.2 AA violations', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await page.getByRole('button', { name: 'Compare' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a network to compare' });
  await dialog.getByRole('combobox', { name: 'Tissue' }).click();
  await dialog.getByRole('option', { name: 'mononuclear phagocyte' }).click();
  let scan = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(scan.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  await dialog.getByRole('button', { name: 'Add network' }).click();
  await expect(page).toHaveURL(/compare=mononuclear-phagocyte/);
  const compared = page.getByRole('region', { name: 'mononuclear phagocyte network', exact: true });
  await expect(compared.getByText(/connections at 0\.51 or more/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'global network', exact: true }).getByText(/connections at 0\.48 or more/)).toBeVisible();
  scan = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(scan.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  await compared.getByRole('slider', { name: 'Genes shown', exact: true }).press('ArrowRight');
  await expect(page).toHaveURL(/compare_shown=16/);
  await page.reload();
  await expect(page.getByRole('region', { name: 'mononuclear phagocyte network', exact: true }).getByText(/Showing 16 of 50 genes/)).toBeVisible();
  await page.getByRole('button', { name: 'Remove the global network' }).click();
  await expect(page).toHaveURL(/tissue=mononuclear-phagocyte/);
  await expect(page).not.toHaveURL(/compare=/);
  expect(apiRequests).toEqual([]);
});
