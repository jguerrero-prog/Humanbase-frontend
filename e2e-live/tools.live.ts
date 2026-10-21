import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { checkScreen, watch, web } from './live';

test('the Modules renal panel result shows real modules, a module drawer and the Genes tab', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/modules/?body_tag=2339dc3cd05964ab3f691a8f4851c7a9aab78ad9`);
  await expect(page.getByText(/Showing \d+ enriched modules/)).toBeVisible();
  await checkScreen(page, problems);
  await page.getByRole('table', { name: 'Modules and their top terms' }).getByRole('button', { name: 'M1' }).click();
  await expect(page.getByRole('dialog', { name: /^M1, / })).toBeVisible();
  await checkScreen(page, problems);
  await page.getByRole('button', { name: 'Close' }).click();
  await page.getByRole('tab', { name: 'Genes' }).click();
  await expect(page.getByRole('table', { name: 'Genes in each module' }).getByRole('row').nth(1)).toBeVisible();
  await checkScreen(page, problems);
});

test('the Modules search matches the renal disease panel', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/modules/`);
  await page.getByRole('button', { name: 'renal disease panel' }).click();
  await expect(page.getByText(/^\d+ matched$/)).toBeVisible();
  await checkScreen(page, problems);
});

test('the NetWAS form loads the real example file', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/netwas/`);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await expect(page.getByText('17,692 genes with p-values, VEGAS format, ready to run')).toBeVisible();
  await expect(page.getByRole('combobox', { name: 'Tissue network' })).toHaveText(/Adipose tissue/);
  await checkScreen(page, problems);
});

for (const [path, tool, run] of [
  ['sei', 'Sei', /^Run Sei on \d+ variants$/],
  ['beluga', 'Beluga', /^Run Beluga on \d+ variants$/],
  ['seqweaver', 'Seqweaver', /^Run Seqweaver on \d+ variants$/],
  ['expecto/variants', 'ExPecto', /^Run ExPecto on \d+ variants$/],
  ['ism', 'In silico mutagenesis', /^Run in silico mutagenesis on \d+ sequences$/],
] as const) {
  test(`the ${tool} form checks its example`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(`${web}/${path}/`);
    await expect(page.getByRole('heading', { level: 1, name: tool === 'In silico mutagenesis' ? tool : new RegExp(`^${tool}`) })).toBeVisible();
    await page.getByRole('radio', { name: 'Use the example' }).click();
    await expect(page.getByRole('button', { name: run })).toBeVisible();
    await checkScreen(page, problems);
  });
}

for (const [tool, id, heading] of [
  ['Sei', '2e18fedf-3de7-4d08-a894-9a937a2b860b', /^Molecular effects of chr/],
  ['Seqweaver', '76aea8fe-8ec7-4698-a193-a186c7665edb', 'Molecular effects of chr1:109,817,590 G>T'],
] as const) {
  test(`the real ${tool} result reads each view, moves to the next variant and shows the genome`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(`${web}/deepsea/jobs/${id}/`);
    await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    await expect(page.locator('.genome-engine')).toBeVisible();
    await checkScreen(page, problems);
    for (const tab of ['Heatmap', 'All features']) {
      await page.getByRole('tab', { name: tab }).click();
      await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tabpanel')).not.toBeEmpty();
      await checkScreen(page, problems);
    }
    const before = page.url();
    await page.getByRole('button', { name: 'Next', exact: true }).click();
    await expect(page).not.toHaveURL(before);
    await expect(page.getByRole('heading', { name: /^Molecular effects of chr/ })).toBeVisible();
    await checkScreen(page, problems);
  });
}

test('the real Seqweaver result shows and hides genome tracks from the real files and exports the view', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/`);
  const headers = page.locator('.genome-engine .track-header-name');
  await expect(headers).toHaveText(['Sequence', 'Genes']);
  await expect(page.locator('.genome-engine').getByText('CELSR2 →')).toBeVisible();
  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await drawer.getByRole('checkbox', { name: 'Conservation' }).check();
  await drawer.getByRole('checkbox', { name: 'Sequence' }).uncheck();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['Conservation', 'Genes']);
  await expect(page.locator('.genome-engine .genome-tracks-bar')).not.toHaveCount(0);
  await checkScreen(page, problems);
  await page.getByRole('button', { name: 'Export' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export the view' });
  const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Export' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^chr1_\d+-\d+_hg19\.svg$/);
  const svg = await readFile(await download.path(), 'utf8');
  expect(svg).toContain('Conservation');
  expect(svg).toContain('CELSR2 →');
  expect(svg).toContain('genome-tracks-bar');
  await page.getByRole('button', { name: 'Tracks' }).click();
  await drawer.getByRole('button', { name: 'Reset to default tracks' }).click();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['Sequence', 'Genes']);
});

test('the real Beluga result shows its variants and molecular effects', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/deepsea/jobs/8b26a498-278c-4c73-a6a4-5f2550c30073/`);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr3:12,598,855 G>A' })).toBeVisible();
  await expect(page.getByText(/Raises, \d+ /)).toBeVisible();
  await checkScreen(page, problems);
});

test('the real ExPecto result names each variant by its gene and shows tissue effects', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/deepsea/jobs/e504e3cc-6a9a-4f35-99e3-9185d6f5c4a1/?variant=chr5-134871851-A-G`);
  await expect(page.getByRole('button', { name: /NEUROG1/ })).toBeVisible();
  await expect(page.getByText('Fallopian Tube')).toBeVisible();
  await checkScreen(page, problems);
});

test('the real NetWAS result lists ranked genes with names and links into Networks', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/netwas/c66b3d05-2f49-4522-b910-1605609e4083/`);
  await expect(page.getByRole('link', { name: 'Open in Networks for KRT6B' })).toBeVisible();
  await expect(page.getByText('keratin 6B')).toBeVisible();
  await checkScreen(page, problems);
});

test('the real in silico mutagenesis result draws its substitution map', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/deepsea/jobs/0576e894-a2c5-48bb-9bdf-227962495d5f/`);
  await expect(page.getByRole('grid', { name: /^Substitutions at positions/ })).toBeVisible();
  await checkScreen(page, problems);
  await page.getByRole('combobox', { name: /^Sequence/ }).click();
  await page.getByRole('option', { name: /known_GATA1_binding_increase/ }).click();
  await expect(page.getByRole('grid', { name: /^Substitutions at positions/ })).toBeVisible();
  await checkScreen(page, problems);
});

test('ExPecto shows IRGM by tissue system and by tissue', async ({ page }) => {
  // Each accessibility scan reads every heatmap cell of IRGM's 113 positions.
  test.setTimeout(400_000);
  const problems = watch(page);
  await page.goto(`${web}/expecto/genes/345611/`);
  await expect(page.getByText('Predicted effect on IRGM expression, log fold change')).toBeVisible();
  await expect(page.getByText('hematopoietic system').first()).toBeVisible();
  await checkScreen(page, problems);
  await page.getByRole('radio', { name: 'Tissues' }).click();
  await expect(page.getByText(/of 2\d\d tissues/)).toBeVisible();
  await checkScreen(page, problems);
});

test('the ExPecto SNP rsID tab finds a gene, an rsID and a position', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/expecto/snps/`);
  await page.getByRole('button', { name: 'IRGM' }).click();
  await expect(page.getByRole('heading', { name: '17 variants for IRGM' })).toBeVisible();
  await checkScreen(page, problems);
  await page.getByRole('button', { name: 'rs531708574' }).click();
  await expect(page.getByRole('heading', { name: '1 variant for rs531708574' })).toBeVisible();
  await page.getByRole('button', { name: 'chr1:877047' }).click();
  await expect(page.getByRole('link', { name: 'SAMD11' })).toBeVisible();
  await checkScreen(page, problems);
});

test('ExPecto SC shows PTEN by organ', async ({ page }) => {
  test.setTimeout(400_000);
  const problems = watch(page);
  await page.goto(`${web}/expecto-sc/genes/5728/`);
  await expect(page.getByText('Predicted effect on PTEN expression, z-score')).toBeVisible();
  await expect(page.getByText('retina').first()).toBeVisible();
  await checkScreen(page, problems);
});

test('the ASD Browser draws the real track files, finds SCN2A and pages the table', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/asd/`);
  await expect(page.getByRole('heading', { name: /^Molecular effects of chr1:/ })).toBeVisible();
  const browser = page.locator('.genome-engine');
  await expect(browser.locator('.track-header-name')).toHaveText(['Sequence', 'DNA disease impact score', 'RNA disease impact score', 'Genes']);
  await expect(browser.getByText('← PEX10')).toBeVisible();
  await expect(browser.locator('.genome-tracks-bar.is-selected')).toHaveCount(2);
  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await drawer.getByRole('checkbox', { name: 'Conservation' }).check();
  await drawer.getByRole('checkbox', { name: 'RNA disease impact score' }).uncheck();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(browser.locator('.track-header-name')).toHaveText(['Sequence', 'DNA disease impact score', 'Conservation', 'Genes']);
  await expect(browser.locator('.genome-tracks-bar.is-selected')).toHaveCount(2);
  await page.getByRole('button', { name: 'Tracks' }).click();
  await drawer.getByRole('button', { name: 'Reset to default tracks' }).click();
  await drawer.getByRole('button', { name: 'Done' }).click();
  const coveredBar = await page.evaluate(async () => {
    const bar = document.querySelector('.top-bar');
    const frame = document.querySelector('.genome-engine-frame');
    if (!bar || !frame) return ['missing top bar or genome browser'];
    scrollBy(0, frame.getBoundingClientRect().top - bar.clientHeight + 200);
    await new Promise((settled) => setTimeout(settled, 300));
    const { top, bottom } = bar.getBoundingClientRect();
    const covered: number[][] = [];
    for (let x = 8; x < innerWidth; x += 16) for (let y = top + 2; y < bottom; y += 6) if (!bar.contains(document.elementFromPoint(x, y))) covered.push([x, y]);
    return covered;
  });
  expect(coveredBar, 'the genome browser draws over the top bar').toEqual([]);
  await page.locator('.genome-engine').focus();
  await page.keyboard.press('ArrowRight');
  await expect(page).toHaveURL(/location=chr1/);
  await expect(page.getByText(/Raises, \d+ DNA features/)).toBeVisible();
  await checkScreen(page, problems);
  const find = page.getByLabel('Find a gene, region or position');
  await find.fill('SCN2A');
  await find.press('Enter');
  await expect(page).toHaveURL(/chr2/);
  await expect(browser.getByText('SCN2A →')).toBeVisible();
  await checkScreen(page, problems);
  await page.goto(`${web}/asd/?view=table`);
  await expect(page.getByText('127,133 variants', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Page 2' }).click();
  await expect(page.getByRole('button', { name: 'Page 2' })).toHaveAttribute('aria-current', /page|true/);
  await expect(page.getByRole('table', { name: 'ASD Browser variants' }).getByRole('row').nth(1)).toBeVisible();
  await checkScreen(page, problems);
});
