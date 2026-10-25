import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { downloadFrom } from '../e2e/downloads';
import { asdBrowserRetired } from '../packages/hb/src/content/asdBrowser.ts';
import { violationsOf } from '../e2e/violations';
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

test('extended_universe reruns the GIANT renal panel with extended annotations, which can run again with human-only ones', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/modules/?body_tag=2339dc3cd05964ab3f691a8f4851c7a9aab78ad9&extended_universe=true`);
  await expect(page).toHaveURL(/body_tag=af5b37885800bae6803f59e071fdcfdf84cb405c&extended_universe=true/);
  const notice = page.getByRole('status').filter({ hasText: 'Extended annotations' });
  await expect(notice).toContainText('This module was computed with extended (cross-organism) annotations.');
  await checkScreen(page, problems);
  await notice.getByRole('button', { name: 'Run with human-only annotations' }).click();
  await expect(page).toHaveURL(/body_tag=2339dc3cd05964ab3f691a8f4851c7a9aab78ad9$/);
  await expect(page.getByText(/Showing \d+ enriched modules/)).toBeVisible();
  await expect(page.getByText('Human-only annotations')).toHaveCount(0);
});

test('a Modules gene shows its live terms and neighbors, and chains to a neighbor', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/modules/?body_tag=2339dc3cd05964ab3f691a8f4851c7a9aab78ad9&module=1&gene=6928`);
  const gene = page.getByRole('dialog', { name: 'HNF1B' });
  await expect(gene.getByText('HNF1 homeobox B, in M1 renal system development')).toBeVisible();
  await expect(gene.getByRole('table', { name: 'Enriched terms of M1 that include HNF1B' }).getByRole('row')).toHaveCount(10);
  await checkScreen(page, problems);
  await gene.getByRole('radio', { name: 'Gene neighbors' }).click();
  const neighbors = gene.getByRole('table', { name: 'Genes connected to HNF1B' });
  await expect(neighbors.getByRole('row')).toHaveText([/Gene/, /^HNF4A.*M1.*0\.13$/, /^KCNJ1.*M1.*0\.10$/]);
  await checkScreen(page, problems);
  await neighbors.getByRole('button', { name: 'HNF4A' }).click();
  await expect(page.getByRole('dialog', { name: 'HNF4A' }).getByRole('table', { name: 'Genes connected to HNF4A' })).toContainText('HNF1B');
  await page.getByRole('button', { name: 'Back to M1' }).click();
  await expect(page.getByRole('dialog', { name: /^M1, / })).toBeVisible();
  await checkScreen(page, problems);
});

test('the Modules search matches the renal disease panel', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/modules/`);
  await page.getByRole('button', { name: 'renal disease panel' }).click();
  await expect(page.getByText(/^\d+ matched$/)).toBeVisible();
  await checkScreen(page, problems);
});

test('the Modules Download menu saves the real result as TSV, PDF and ZIP', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/modules/?body_tag=2339dc3cd05964ab3f691a8f4851c7a9aab78ad9`);
  await expect(page.getByText(/Showing \d+ enriched modules/)).toBeVisible();
  const tsv = await downloadFrom(page, 'Download', 'Download as TSV');
  expect(tsv.name).toMatch(/^kidney_gene-ontology-bp_\d+\.tsv$/);
  const rows = tsv.bytes.toString().split('\n');
  expect(rows[0]).toMatch(/^GO_VERSION\t\S+/);
  const terms = rows.indexOf('CLUSTER_NAME\tTERM_NAME\tGO_ID\tTERM_Q_VALUE\tGENE_COUNT\tTERM_GENES');
  expect(rows[terms + 1]).toMatch(/^M\d+\t.+\tGO:\d{7}\t[\d.e-]+\t\d+\t[\w-]+(,[\w-]+)*$/);
  expect(rows).toContain('SOURCE\tTARGET\tWEIGHT\t\t\t');
  const pdf = await downloadFrom(page, 'Download', 'Download as PDF');
  expect(pdf.bytes.subarray(0, 4).toString()).toBe('%PDF');
  const zip = await downloadFrom(page, 'Download', 'Download as ZIP');
  expect(zip.bytes.subarray(0, 2).toString()).toBe('PK');
  await checkScreen(page, problems);
});

for (const [version, example, genes, tissue, run] of [
  ['MAGE', 'Alzheimer’s', '1,008', 'Global', 'MAGE-WAS'],
  ['GIANT', 'BMI', '17,692', 'Adipose tissue', 'NetWAS'],
] as const) {
  test(`the NetWAS form loads the real ${version} ${example} example file`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(`${web}/netwas/`);
    const dataVersion = page.getByRole('combobox', { name: 'Data version' });
    if (version === 'GIANT') {
      await dataVersion.click();
      await page.getByRole('option', { name: 'GIANT' }).click();
    }
    await expect(dataVersion).toHaveText(version);
    await page.getByRole('radio', { name: 'Use the example' }).click();
    await expect(page.getByText(`${genes} genes with p-values, VEGAS format, ready to run`)).toBeVisible();
    await expect(page.getByRole('combobox', { name: 'Tissue network' })).toHaveText(tissue);
    await expect(page.getByRole('button', { name: `Run ${run} on ${genes} genes` })).toBeVisible();
    await checkScreen(page, problems);
  });
}

for (const [path, tool, run] of [
  ['/variant-effects/', 'Sei', /^Run Sei on \d+ variants$/],
  ['/variant-effects/?model=beluga', 'Beluga', /^Run Beluga on \d+ variants$/],
  ['/seqweaver/', 'Seqweaver', /^Run Seqweaver on \d+ variants$/],
  ['/expression-effects/?tab=submit-variants', 'ExPecto', /^Run ExPecto on \d+ variants$/],
  ['/variant-effects/?tab=region-scan', 'region scan', /^Run region scan on \d+ sequences$/],
] as const) {
  test(`the ${tool} form checks its example`, async ({ page }) => {
    const problems = watch(page);
    await page.goto(`${web}${path}`);
    await expect(page.getByRole('heading', { name: `About ${tool}` })).toBeVisible();
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
    await expect(page.getByRole('tab', { name: 'Heatmap' })).toHaveAttribute('aria-selected', 'true');
    await checkScreen(page, problems);
    for (const tab of ['Strongest effects', 'All features']) {
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

test('the real Seqweaver result shows its own score tracks, shows and hides genome tracks from the real files and exports the view', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/`);
  const headers = page.locator('.genome-engine .track-header-name');
  await expect(headers).toHaveText(['Sequence', 'Disease impact score', 'Mean −log e-value', 'Genes']);
  await expect(page.locator('.genome-engine').getByText('CELSR2 →')).toBeVisible();
  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await drawer.getByRole('checkbox', { name: 'Conservation' }).check();
  await drawer.getByRole('checkbox', { name: 'GM12878 ChromHMM' }).check();
  await drawer.getByRole('checkbox', { name: 'Sequence' }).uncheck();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['Disease impact score', 'Mean −log e-value', 'Conservation', 'GM12878 ChromHMM', 'Genes']);
  // The job's own files, read from S3: one score per variant, 1.0026 and 0.9013 at chr1:109,817,590.
  await expect(page.locator('.genome-engine').getByRole('button', { name: '1.00 at 109,817,590' })).toBeVisible();
  await expect(page.locator('.genome-engine').getByRole('button', { name: '0.90 at 109,817,590' })).toBeVisible();
  // Results open at 100 kb; the counts below are for the 50 kb view around the variant.
  await page.getByRole('radio', { name: '50 kb' }).check();
  await expect(page.locator('.genome-engine .genome-tracks-bar')).not.toHaveCount(0);
  // chr1:109,792,590-109,842,590 holds 39 segments in gm12878.ChromHMM.bb, the first PromP and the one under the variant ReprW.
  const segments = page.locator('.genome-engine .genome-tracks-segment');
  await expect(segments).toHaveCount(39);
  await expect(segments.first()).toHaveAttribute('fill', '#CF0BC6');
  await segments.nth(11).hover();
  await expect(page.getByRole('tooltip')).toHaveText(/^QuiesGM12878 ChromHMMStart109,806,801Length9,600 bp$/);
  await page.getByRole('region', { name: /^Genome around / }).getByText('View as table').click();
  const table = page.getByRole('table', { name: 'GM12878 ChromHMM segments in chr1:109,792,590-109,842,590, GRCh37/hg19' });
  await expect(table.getByRole('row')).toHaveCount(40);
  await expect(table.getByRole('row').filter({ hasText: '109,816,601' })).toHaveText(/^ReprW\s*109,816,601\s*109,818,400\s*1,800 bp$/);
  await checkScreen(page, problems);
  // The item details list what humanbase.io lists for each track, read from the real files.
  await page.locator('.genome-engine').getByText('CELSR2 →').click();
  const gene = page.getByRole('dialog', { name: 'Genes' });
  await expect(gene).toHaveText(/^GenesMethodprotein_codingLocationchr1:109,792,641-109,818,372Score1000$/);
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'ReprW, 109,816,601 to 109,818,400' }).focus();
  await page.keyboard.press('Enter');
  const segment = page.getByRole('dialog', { name: 'GM12878 ChromHMM' });
  await expect(segment).toHaveText(/^GM12878 ChromHMMLocationchr1:109,816,601-109,818,400Score1000$/);
  expect(await violationsOf(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(segment).toBeHidden();
  await expect(page.getByRole('button', { name: 'ReprW, 109,816,601 to 109,818,400' })).toBeFocused();
  await page.getByRole('button', { name: 'Export' }).click();
  const dialog = page.getByRole('dialog', { name: 'Export the view' });
  const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Export' }).click()]);
  expect(download.suggestedFilename()).toMatch(/^chr1_\d+-\d+_hg19\.svg$/);
  const svg = await readFile(await download.path(), 'utf8');
  expect(svg).toContain('Conservation');
  expect(svg).toContain('Disease impact score');
  expect(svg).toContain('CELSR2 →');
  expect(svg).toContain('genome-tracks-bar');
  expect(svg.match(/class="genome-tracks-segment"/g)).toHaveLength(39);
  await page.getByRole('button', { name: 'Tracks' }).click();
  await drawer.getByRole('button', { name: 'Reset to default tracks' }).click();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['Sequence', 'Disease impact score', 'Mean −log e-value', 'Genes']);
});

test('the real Seqweaver result’s track menus move, hide, download and set up tracks, and remember it', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/`);
  const headers = page.locator('.genome-engine .track-header-name');
  await expect(page.locator('.genome-engine').getByText('CELSR2 →')).toBeVisible();
  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await drawer.getByRole('checkbox', { name: 'Conservation' }).check();
  // The job's own score tracks are left out here, so the moves below are easy to follow.
  await drawer.getByRole('checkbox', { name: 'Disease impact score' }).uncheck();
  await drawer.getByRole('checkbox', { name: 'Mean −log e-value' }).uncheck();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['Sequence', 'Conservation', 'Genes']);
  // Only a score track has settings; the genes track can only move or go.
  await page.getByRole('button', { name: 'Genes track options' }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Move up', 'Move down', 'Hide track']);
  await expect(page.getByRole('menuitem', { name: 'Move down' })).toHaveAttribute('aria-disabled', 'true');
  await page.keyboard.press('Escape');
  const conservation = page.getByRole('button', { name: 'Conservation track options' });
  // The data in view comes from the real phastCons file, one value per base, as bedGraph.
  const data = await downloadFrom(page, 'Conservation track options', 'Download data in view');
  expect(data.name).toBe('Conservation_hg19_chr1-109767590-109867590.bedgraph');
  expect(data.bytes.toString('utf8').split('\n')[0]).toMatch(/^chr1\t\d+\t\d+\t[\d.e-]+$/);
  await conservation.click();
  await expect(page.getByRole('menuitem', { name: /Download full file/ })).toContainText('bigWig');
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('menuitem', { name: 'Move up' }).click();
  await expect(headers).toHaveText(['Conservation', 'Sequence', 'Genes']);
  await expect(conservation).toBeFocused();
  await conservation.click();
  await page.getByRole('menuitem', { name: 'Track settings…' }).click();
  const dialog = page.getByRole('dialog', { name: 'Track settings: Conservation' });
  await expect(dialog.getByRole('textbox', { name: 'Lowest value shown' })).toHaveValue('0');
  await expect(dialog.getByRole('textbox', { name: 'Highest value shown' })).toHaveValue('1');
  await dialog.getByRole('textbox', { name: 'Height' }).fill('20');
  await dialog.getByRole('button', { name: 'Apply' }).click();
  await expect(dialog.getByText('Enter a height from 50 to 300 pixels.')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await dialog.getByRole('textbox', { name: 'Height' }).fill('120');
  await dialog.getByRole('textbox', { name: 'Highest value shown' }).fill('0.5');
  await dialog.getByRole('button', { name: 'Apply' }).click();
  await expect(dialog).toBeHidden();
  const rows = page.locator('.genome-engine .score-tracks-column');
  await expect(rows).toHaveAttribute('style', /30px 120px 60px/);
  await page.reload();
  await expect(headers).toHaveText(['Conservation', 'Sequence', 'Genes']);
  await expect(rows).toHaveAttribute('style', /30px 120px 60px/);
  await page.getByRole('button', { name: 'Genes track options' }).click();
  await page.getByRole('menuitem', { name: 'Hide track' }).click();
  await expect(headers).toHaveText(['Conservation', 'Sequence']);
  await expect(page.locator('.genome-engine')).toBeFocused();
  await checkScreen(page, problems);
  await page.getByRole('button', { name: 'Tracks' }).click();
  await drawer.getByRole('button', { name: 'Reset to default tracks' }).click();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['Sequence', 'Disease impact score', 'Mean −log e-value', 'Genes']);
});

test('the real Seqweaver result’s genome browser stops at the end of chr1 and says so', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/`);
  await expect(page.locator('.genome-engine').getByText('CELSR2 →')).toBeVisible();
  const field = page.getByRole('searchbox', { name: 'Location or gene' });
  await field.fill('chr1:249,300,000-249,310,000');
  await field.press('Enter');
  await expect(page.getByText('chr1 ends at 249,250,621 on GRCh37/hg19. Showing up to the end.')).toBeVisible();
  await expect(field).toHaveValue('chr1:249,240,621-249,250,621');
  await page.locator('.genome-engine').focus();
  await page.keyboard.press('ArrowRight');
  await expect(field).toHaveValue('chr1:249,240,621-249,250,621');
  await expect(page.locator('.genome-engine .track-header-name')).toHaveText(['Sequence', 'Disease impact score', 'Mean −log e-value', 'Genes']);
  await checkScreen(page, problems);
});

test('the real Seqweaver result’s genome browser finds genes in each assembly’s own GENCODE index', async ({ page }) => {
  const problems = watch(page);
  const job = `${web}/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/`;
  const field = page.getByRole('searchbox', { name: 'Location or gene' });
  const find = async (gene: string) => {
    await expect(page.locator('.genome-engine .track-header-name').first()).toBeVisible();
    await field.fill(gene);
    await field.press('Enter');
  };
  await page.goto(job);
  await find('CHD8');
  await expect(field).toHaveValue('chr14:21,853,352-21,905,457');
  // No hg38 job is on record, so the same real job is read as hg38; the gene still comes from the real GENCODE 21 files.
  await page.route('**/api/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/', async (route) => {
    const response = await route.fetch();
    await route.fulfill({ response, json: { ...(await response.json()), genome_assembly: 'hg38' } });
  });
  await page.goto(job);
  await find('CHD8');
  await expect(field).toHaveValue('chr14:21,385,193-21,437,298');
  await expect(page.locator('.genome-location-help')).toContainText('A gene name works too.');
  await find('NOTAGENE9');
  await expect(page.getByText('No gene named “NOTAGENE9” on GRCh38/hg38.', { exact: false })).toBeVisible();
  await checkScreen(page, problems);
});

test('the Seqweaver gnomAD browser reads the real precomputed variants and track, as humanbase.io’s /seqweaver does', async ({ page }) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  await page.goto(`${web}/seqweaver/gnomad/`);
  // humanbase.io centers chr1:2,230,000-2,440,000 on this variant, ranks HepG2 / DDX6 first and shows 232 features (checked October 24, 2026).
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr1:2,334,919 C>T' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/^[\d,]+ variants in view/)).toBeVisible();
  await expect(page.getByText(/Showing the top 20 of 232 proteins/)).toBeVisible();
  await expect(page.locator('.genome-engine .track-header-name')).toHaveText(['Sequence', 'Seqweaver gnomAD', 'Genes']);
  await expect(page.getByRole('rowheader').first()).toHaveText(/^HepG2 \/ DDX6/);
  await checkScreen(page, problems);
  await page.getByRole('button', { name: 'Next variant' }).click();
  await expect(page).toHaveURL(/variant=chr1-/);
  await expect(page.getByRole('heading', { name: /^Molecular effects of chr1:2,33/ })).toBeVisible();
  await checkScreen(page, problems);
});

test('Sei HGMD variants reads all 853 real variants, and a heatmap row opens its real predictions in the genome browser', async ({ page }) => {
  test.setTimeout(120_000);
  const problems = watch(page);
  await page.goto(`${web}/variant-effects/hgmd/`);
  const heatmap = page.getByRole('grid', { name: 'Sequence class score of 853 HGMD variants' });
  await expect(heatmap).toHaveAttribute('aria-rowcount', '853', { timeout: 60_000 });
  // humanbase.io's default order starts here, and its Agammaglobulinaemia variant ranks E7, P and CTCF first (checked October 24, 2026).
  await expect(heatmap.getByRole('row').first().getByRole('button')).toHaveText('Haemophagocytic lymphohistiocytosis type 3 (chr17:73839907)');
  await heatmap.getByRole('button', { name: 'Agammaglobulinaemia (chrX:100641212)' }).click();
  await expect(page.getByRole('heading', { name: 'Molecular effects of chrX:100,641,212 T>C' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/^2 variants in view/)).toBeVisible();
  await expect(page.getByRole('rowheader').first()).toHaveText(/E7 Monocyte \/ Macrophage/);
  await checkScreen(page, problems);
});

test('the real Beluga result shows its variants and molecular effects', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/deepsea/jobs/8b26a498-278c-4c73-a6a4-5f2550c30073/`);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr3:12,598,855 G>A' })).toBeVisible();
  await page.getByRole('tab', { name: 'Strongest effects' }).click();
  await expect(page.getByText(/Raises, \d+ /)).toBeVisible();
  await checkScreen(page, problems);
});

test('the real ExPecto result names each variant by its gene and shows tissue effects', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/deepsea/jobs/e504e3cc-6a9a-4f35-99e3-9185d6f5c4a1/?variant=chr5-134871851-A-G`);
  await expect(page.getByRole('table', { name: 'Variants in this job' }).getByRole('button', { name: /NEUROG1/ })).toBeVisible();
  await page.getByRole('tab', { name: 'Strongest effects' }).click();
  await expect(page.getByText('Fallopian Tube')).toBeVisible();
  await expect(page.getByRole('heading', { name: /^Expression effects of chr5:134,871,851/ })).toBeVisible();
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
  await page.goto(`${web}/expression-effects/genes/345611/`);
  await expect(page.getByText('Predicted effect on IRGM expression, log fold change')).toBeVisible();
  await expect(page.getByText('hematopoietic system').first()).toBeVisible();
  await checkScreen(page, problems);
  await page.getByRole('radio', { name: 'Tissues' }).click();
  await expect(page.getByText(/of 2\d\d tissues/)).toBeVisible();
  await checkScreen(page, problems);
});

test('the ExPecto rsID tab finds a gene, an rsID and a position', async ({ page }) => {
  const problems = watch(page);
  await page.goto(`${web}/expression-effects/?tab=rsid`);
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
  await page.goto(`${web}/expression-effects/genes/5728/?model=expecto-sc`);
  await expect(page.getByText('Predicted effect on PTEN expression, z-score')).toBeVisible();
  await expect(page.getByText('retina').first()).toBeVisible();
  await checkScreen(page, problems);
});

test('the ASD Browser draws the real track files, finds SCN2A and pages the table', async ({ page }) => {
  test.skip(asdBrowserRetired, 'The ASD Browser is retired.');
  const problems = watch(page);
  await page.goto(`${web}/asd/`);
  await expect(page.getByRole('heading', { name: /^Molecular effects of chr1:/ })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Heatmap' })).toHaveAttribute('aria-selected', 'true');
  const browser = page.locator('.genome-engine');
  await expect(browser.locator('.track-header-name')).toHaveText(['Sequence', 'DNA disease impact score', 'RNA disease impact score', 'Genes']);
  await expect(browser.getByText('← PEX10')).toBeVisible();
  await expect(browser.locator('.genome-tracks-bar.is-selected')).toHaveCount(2);
  await browser.getByText('← MORN1').click();
  await expect(page.getByRole('dialog', { name: 'Genes' })).toHaveText(/^GenesMethodprotein_codingLocationchr1:2,252,692-2,323,146Score1000$/);
  expect(await violationsOf(page)).toEqual([]);
  await page.keyboard.press('Escape');
  // humanbase.io shows this bar as chr1:2346202-2346202, 3.6189358234405518 (checked October 22, 2026).
  await browser.locator('[data-item="DNA disease impact score 2346202"]').click();
  await expect(page.getByRole('dialog', { name: 'DNA disease impact score' })).toHaveText(/^DNA disease impact scoreLocationchr1:2,346,202-2,346,202Score3\.6189358234405518$/);
  expect(await violationsOf(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await drawer.getByRole('checkbox', { name: 'Conservation' }).check();
  await drawer.getByRole('checkbox', { name: 'GM12878 ChromHMM' }).check();
  await drawer.getByRole('checkbox', { name: 'RNA disease impact score' }).uncheck();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(browser.locator('.track-header-name')).toHaveText(['Sequence', 'DNA disease impact score', 'Conservation', 'GM12878 ChromHMM', 'Genes']);
  await expect(browser.locator('.genome-tracks-segment')).toHaveCount(108);
  await expect(browser.locator('.genome-tracks-bar.is-selected')).toHaveCount(2);
  await page.getByRole('group', { name: 'Conservation, items' }).getByRole('button').first().focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('dialog', { name: 'Conservation' })).toHaveText(/^ConservationLocationchr1:[\d,]+-[\d,]+Score[\d.]+$/);
  await page.keyboard.press('Escape');
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
  await page.getByRole('tab', { name: 'Strongest effects' }).click();
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
