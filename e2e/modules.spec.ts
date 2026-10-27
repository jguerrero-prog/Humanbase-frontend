import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { downloadFrom } from './downloads';
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

  await expect(page.getByRole('combobox', { name: 'Data version' })).toHaveText('MAGE');
  await page.getByRole('button', { name: 'Find modules in 504 genes' }).click();
  await expect(page).toHaveURL(/\/modules\/\?body_tag=5906cd20e9242a9c20125f8a660e7fd7be4f11ee/);
  await expect(page.getByRole('heading', { level: 1, name: 'Renal disease panel' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the gene selection bar floats at the bottom of the screen, and rests under the last gene at the end, with the API off', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/modules/`);
  await page.getByRole('button', { name: 'renal disease panel' }).click();
  await expect(page.getByText('468 matched', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^Show all \d+/ }).click();
  const boxes = page.getByRole('checkbox', { name: /^Select / });
  const middle = Math.floor((await boxes.count()) / 2);
  await boxes.nth(middle).check();
  await boxes.nth(middle + 1).check();
  const bar = page.locator('.table-selection-bar');
  await expect(bar).toContainText('2 genes selected');
  await expect(bar.getByRole('button', { name: 'Clear selection' })).toBeInViewport();
  const viewport = page.viewportSize()?.height ?? 0;
  const floating = await bar.boundingBox();
  expect((floating?.y ?? 0) + (floating?.height ?? 0)).toBeLessThanOrEqual(viewport);

  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  const resting = await bar.boundingBox();
  const lastRow = await page.locator('.gene-match tbody tr').last().boundingBox();
  expect(resting?.y ?? 0, 'below the last gene').toBeGreaterThanOrEqual((lastRow?.y ?? 0) + (lastRow?.height ?? 0));
  await bar.getByRole('button', { name: 'Clear selection' }).click();
  await expect(bar).toHaveCount(0);
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

test('a gene opens in the module drawer, chains to its neighbors and goes back, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${renal}&module=1`);
  const module = page.getByRole('dialog', { name: 'M1, renal system development' });
  await module.getByRole('radio', { name: 'Genes' }).click();
  await expect(module.getByRole('button', { name: 'Show all 64 genes' })).toBeVisible();
  await module.getByRole('searchbox', { name: 'Filter M1 genes' }).fill('HNF1B');
  await module.getByRole('row', { name: /HNF1B/ }).hover();
  await expect(page.locator('.force-graph-node.is-hovered')).toHaveAttribute('aria-label', 'HNF1B, M1');
  await module.getByRole('button', { name: 'HNF1B' }).click();

  const gene = page.getByRole('dialog', { name: 'HNF1B' });
  await expect(page).toHaveURL(/module=1&gene=6928/);
  await expect(gene.getByRole('heading', { level: 2, name: 'HNF1B' })).toBeFocused();
  await expect(gene.getByRole('table', { name: 'Enriched terms of M1 that include HNF1B' }).getByRole('row')).toHaveCount(10);
  await expect(page.locator('.force-graph-node.is-selected')).toHaveAttribute('aria-label', 'HNF1B, M1');
  await expect(page.locator('.force-graph-focus-links line')).toHaveCount(2);
  expect(await violationsOf(page)).toEqual([]);

  await gene.getByRole('radio', { name: 'Gene neighbors' }).click();
  const neighbors = gene.getByRole('table', { name: 'Genes connected to HNF1B' });
  await expect(neighbors.getByRole('row')).toHaveText([/Gene/, /^HNF4A.*0\.13$/, /^KCNJ1.*0\.10$/]);
  expect(await violationsOf(page)).toEqual([]);

  await page.locator('.force-graph-node[aria-label="KCNJ1, M1"]').hover({ force: true });
  await expect(page.getByRole('tooltip')).toContainText('KCNJ1');

  await neighbors.getByRole('button', { name: 'HNF4A' }).click();
  await expect(page.getByRole('dialog', { name: 'HNF4A' })).toBeVisible();
  await expect(page).toHaveURL(/module=1&gene=3172/);
  await page.reload();
  await page.getByRole('button', { name: 'Back to M1' }).click();
  await expect(page.getByRole('dialog', { name: 'M1, renal system development' })).toBeVisible();
  await expect(page).not.toHaveURL(/gene=/);
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
  expect(apiRequests).toEqual([]);
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

test('the module Download menu saves the live site’s TSV, PNG, SVG, PDF and ZIP, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(renal);
  await expect(page.getByText('Showing 14 enriched modules of 2 genes or more. Edges hidden.')).toBeVisible();
  const name = /^kidney_gene-ontology-bp_\d+\.(tsv|png|svg|pdf|zip)$/;
  const tsv = await downloadFrom(page, 'Download', 'Download as TSV');
  expect(tsv.name).toMatch(name);
  const rows = tsv.bytes.toString().split('\n');
  expect(rows.slice(0, 3)).toEqual(['GO_VERSION\treleases/2018-05-14\t\t\t\t', 'NETWORK_NAME\tkidney\t\t\t\t', 'NETWORK_VERSION\t1\t\t\t\t']);
  expect(rows).toEqual(expect.arrayContaining(['RESULTING GENE COUNT\t351\t\t\t\t', 'CLUSTER_NAME\tTERM_NAME\tGO_ID\tTERM_Q_VALUE\tGENE_COUNT\tTERM_GENES', 'SOURCE\tTARGET\tWEIGHT\t\t\t']));
  for (const [format, magic] of [['PNG', '\x89PNG'], ['SVG', '<svg'], ['PDF', '%PDF']] as const) {
    const file = await downloadFrom(page, 'Download', `Download as ${format}`);
    expect(file.name).toMatch(name);
    expect(file.bytes.subarray(0, magic.length).toString('latin1')).toBe(magic);
  }
  const zip = await downloadFrom(page, 'Download', 'Download as ZIP');
  const base = zip.name.replace(/\.zip$/, '');
  for (const extension of ['tsv', 'png', 'svg', 'pdf']) expect(zip.bytes.toString('latin1')).toContain(`${base}.${extension}`);
  expect(apiRequests).toEqual([]);
});
