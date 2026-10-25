import { expect, test } from '@playwright/test';
import { downloadFrom } from '../e2e/downloads';
import { checkScreen, watch, web } from './live';

const il1bTnf = `${web}/networks/?entrez=3553&entrez=7124`;

for (const [version, name] of [['v1', 'GIANT'], ['v3', 'MAGE']] as const) {
  test(`the IL1B and TNF network loads on ${name} with related genes and connections`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(`${il1bTnf}&version=${version}`);
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(/IL1B/);
    await expect(page.getByText(/Showing \d+ of \d+ genes, [1-9]\d* connections at \d\.\d\d or more/)).toBeVisible();
    const genes = page.getByRole('table', { name: /Genes functionally related/ });
    await expect(genes.getByRole('row')).not.toHaveCount(1);
    expect(await page.locator('.force-graph-node').count()).toBeGreaterThan(5);
    expect(await page.locator('.force-graph-links line, .force-graph-links path').count()).toBeGreaterThan(5);
    await checkScreen(page, problems);
  });
}

test('ICAM1 scores 0.88 on GIANT, as on the live site', async ({ page }) => {
  watch(page);
  await page.goto(`${il1bTnf}&version=v1`);
  await expect(page.getByRole('table', { name: /Genes functionally related/ }).getByRole('row', { name: /ICAM1/ })).toContainText('0.88');
});

test('the filters change the network: genes shown, minimum confidence, uniqueness and data types', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v1`);
  const summary = page.getByText(/Showing \d+ of \d+ genes/);
  await expect(summary).toBeVisible();
  await page.getByRole('textbox', { name: 'Genes shown, exact value' }).fill('25');
  await page.getByRole('textbox', { name: 'Genes shown, exact value' }).press('Enter');
  await expect(page.getByText(/Showing 25 of \d+ genes/)).toBeVisible();
  await page.getByRole('textbox', { name: /Minimum confidence, exact value/ }).fill('0.7');
  await page.getByRole('textbox', { name: /Minimum confidence, exact value/ }).press('Enter');
  await expect(page.getByText(/connections at 0\.70 or more/)).toBeVisible();
  // The checkbox follows the URL, so it is clicked and then checked once the URL has caught up.
  await page.getByRole('checkbox', { name: /Prioritize by uniqueness/ }).click();
  await expect(page.getByRole('checkbox', { name: /Prioritize by uniqueness/ })).toBeChecked();
  await page.getByRole('button', { name: 'Data types' }).click();
  await page.getByRole('checkbox', { name: 'Co-expression' }).click();
  await expect(page.getByRole('checkbox', { name: 'Co-expression' })).not.toBeChecked();
  await page.keyboard.press('Escape');
  await expect(page).toHaveURL(/datatype/);
  await expect(page.getByText(/Showing \d+ of \d+ genes, \d+ connections/)).toBeVisible();
  await checkScreen(page, problems);
});

test('the Processes and Tissues panels list real terms, and a star rings the right genes', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v1`);
  await page.getByRole('tab', { name: /^Processes/ }).click();
  await expect(page.getByRole('table', { name: /Biological processes and diseases over-represented/ }).getByText(/Gene Ontology \(BP\), \d+ genes/).first()).toBeVisible();
  await page.getByRole('tab', { name: /Tissues/ }).click();
  await page.getByRole('button', { name: 'Highlight peripheral blood genes in the network' }).click();
  const ringed = page.locator('.force-graph-node').filter({ has: page.locator('.force-graph-star') });
  await expect(ringed).toHaveCount(3);
  expect((await ringed.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')?.split(',')[0]))).sort()).toEqual(['CCL20', 'RELB', 'TNFRSF1B']);
  await checkScreen(page, problems);
});

test('the Processes panel matches humanbase.io’s enrichment for IL1B on GIANT', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/networks/?entrez=3553&version=v1`);
  await page.getByRole('tab', { name: /^Processes/ }).click();
  const rows = page.getByRole('table', { name: /Biological processes and diseases over-represented/ }).locator('tbody tr');
  // Gene Ontology terms for every gene in the network arrive in one large response.
  await expect(rows.first()).toContainText('cytokine-mediated signaling pathway', { timeout: 90_000 });
  await expect(rows.first()).toContainText('4.8 × 10⁻⁵');
  await expect(rows.nth(1)).toContainText('cellular response to cytokine stimulus');
  await expect(rows.nth(1)).toContainText('4.2 × 10⁻⁴');
  await checkScreen(page, problems);
});

test('a MAGE page shows the tissue network alone, with no analysis tabs', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v3&tab=process`);
  await expect(page.getByRole('table', { name: /Genes functionally related/ }).getByRole('row')).not.toHaveCount(1);
  await expect(page.getByRole('tab', { name: 'Process network' })).toHaveCount(0);
  await expect(page.getByRole('tab', { name: 'Tissue expression' })).toHaveCount(0);
  await checkScreen(page, problems);
});

test('extended_universe ranks GIANT terms with cross-organism counts, and a MAGE page drops it and says why', async ({ page }) => {
  const problems = watch(page);
  const extended = page.waitForRequest((request) => request.url().includes('/api/terms/annotated/') && request.url().includes('extended_universe=true'));
  await page.goto(`${il1bTnf}&version=v1&extended_universe=true`);
  await expect(page.getByText('Showing legacy extended universe (cross-organism) annotation counts.')).toBeVisible();
  await extended;
  await page.getByRole('tab', { name: /^Processes/ }).click();
  await expect(page.getByRole('table', { name: /Biological processes and diseases over-represented/ }).getByText(/Gene Ontology \(BP\), \d+ genes/).first()).toBeVisible();
  await checkScreen(page, problems);
  await page.goto(`${il1bTnf}&version=v3&extended_universe=true`);
  await expect(page.getByText('Extended universe not applied')).toBeVisible();
  await expect(page).not.toHaveURL(/extended_universe/);
});

test('the gene drawer shows ICAM1 with its annotations', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v1&gene=3383`);
  const drawer = page.getByRole('dialog', { name: 'ICAM1' });
  await expect(drawer.getByText('intercellular adhesion molecule 1')).toBeVisible();
  await expect(drawer.getByRole('region', { name: 'Annotations' }).getByRole('rowheader').first()).toBeVisible();
  await checkScreen(page, problems);
});

test('the connection drawer shows the evidence in this network and the weight in all networks', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v1&connection=6348-7185`);
  const drawer = page.getByRole('dialog', { name: 'CCL3 and TRAF1' });
  await expect(drawer.getByText('MSigDB CGP')).toBeVisible();
  await checkScreen(page, problems);
  await drawer.getByRole('radio', { name: 'All networks' }).click();
  await expect(drawer.getByRole('figure').first()).toBeVisible();
  await expect(drawer.getByRole('table').getByRole('row').nth(1)).toBeVisible();
  await checkScreen(page, problems);
});

test('View as table and Expand show the real connections', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v1`);
  await page.getByRole('button', { name: 'View as table' }).click();
  await page.getByRole('button', { name: 'Expand' }).click();
  const table = page.getByRole('table', { name: /Connections between the genes/ });
  await expect(table.getByRole('row').nth(1)).toBeVisible();
  await expect(table).toContainText(/0\.\d\d/);
  await checkScreen(page, problems);
});

test('the Download menu saves the real network: the visible part and every pair the API sent', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v1`);
  const summary = page.getByText(/Showing \d+ of (\d+) genes, (\d+) connections/);
  await expect(summary).toBeVisible();
  const [, total, shown] = (await summary.textContent())?.match(/of (\d+) genes, (\d+) connections/) ?? [];
  const lines = async (item: string) => {
    const file = await downloadFrom(page, 'Download network', item);
    expect(file.name).toBe('global.txt');
    return file.bytes.toString().trim().split('\n');
  };
  const visible = await lines('Download visible network as text');
  const entire = await lines('Download entire network as text');
  expect(visible[0]).toBe('GENE1,GENE2,WEIGHT');
  expect(visible.length - 1).toBe(Number(shown));
  // The API sends every pair of its genes.
  expect(entire.length - 1).toBe((Number(total) * (Number(total) - 1)) / 2);
  const png = await downloadFrom(page, 'Download network', 'Download as PNG');
  expect([png.name, png.bytes.subarray(1, 4).toString()]).toEqual(['global.png', 'PNG']);
  await checkScreen(page, problems);
});

for (const [tab, ready, data] of [
  ['expression', 'Where IL1B and TNF are expressed', /monocyte|blood/],
  ['processes', 'Biological processes linked to IL1B and TNF', /GO:\d{7}/],
  ['diseases', 'Diseases linked to IL1B and TNF', /DOID:\d+/],
  ['process', 'Choose a biological process to see its network', /Choose a process/],
] as const) {
  test(`the ${tab} tab loads real data`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(`${il1bTnf}&version=v1&tab=${tab}`);
    await expect(page.getByText(ready).first()).toBeVisible();
    await expect(page.getByRole('main').getByText(data).first()).toBeVisible();
    await checkScreen(page, problems);
  });
}

test('a process network draws for the query genes', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v1&tab=process`);
  await page.getByRole('button', { name: 'Choose a process' }).click();
  await page.getByRole('option', { name: 'acute inflammatory response' }).click();
  await expect(page.getByRole('table', { name: /in the acute inflammatory response network/ }).getByRole('row').nth(1)).toBeVisible();
  await checkScreen(page, problems);
});

test('Edit genes adds ICAM1 and reloads the network', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v1`);
  await page.getByRole('button', { name: 'Edit genes' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit genes' });
  await dialog.getByRole('textbox', { name: 'Genes' }).fill('IL1B\nTNF\nICAM1');
  await expect(dialog.getByText('3 matched: IL1B, TNF, ICAM1')).toBeVisible();
  await checkScreen(page, problems);
  await page.getByRole('button', { name: 'Show network for 3 genes' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/ICAM1/);
  await expect(page.getByText(/Showing \d+ of \d+ genes, [1-9]\d* connections/)).toBeVisible();
  await checkScreen(page, problems);
});

test('Compare draws a second network beside the first', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${il1bTnf}&version=v1&compare=mononuclear-phagocyte`);
  await expect(page.getByRole('region', { name: 'mononuclear phagocyte network', exact: true }).getByText(/[1-9]\d* connections at/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'global network', exact: true }).getByText(/[1-9]\d* connections at/)).toBeVisible();
  await checkScreen(page, problems);
});
