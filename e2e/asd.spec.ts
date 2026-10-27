// The ASD Browser is retired (DECISIONS.md, "Retire, don't delete"), so this suite is skipped and kept.
// Set asdBrowserRetired to false in packages/hb/src/content/asdBrowser.ts to bring the browser and this suite back.
import { expect, test, type Page } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { sampleKey } from '../packages/data/src/sample/sampleKey.ts';
import { asdBrowserRetired } from '../packages/hb/src/content/asdBrowser.ts';
import { apiOff, externalFiles, recorded as sample } from './apiOff';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

test.skip(asdBrowserRetired, 'The ASD Browser is retired; asd-retired.spec.ts tests /asd/ instead.');
const chr1Variants = (page: number) => `variants@chromosome=chr1&labels__name=asd&page=${page}&position__gte=2230000&position__lte=2440000`;

/** Turns the API on but answers it from the samples, slowly; any range on chr1 gets the recorded variants that fall in it, so the view can move. */
async function slowSampleApi(page: Page, delay = 400) {
  const pages = await Promise.all([1, 2].map(async (number) => ((await sample(chr1Variants(number))).body as { results: { position: number }[] }).results));
  const variants = pages.flat();
  const predictions = (await sample('deepsea/DNA_Binding/feature_predictions@chr_and_variant_range=1%3A2230000%3A2440000')).body as { position: string }[];
  await page.route('**/config.json', (route) => route.fulfill({ json: { api: true, apiBase: '/api' } }));
  for (const pattern of externalFiles) await page.route(pattern, (route) => route.abort());
  await page.route('**/api/**', async (route) => {
    const url = new URL(route.request().url());
    const query = Object.fromEntries(url.searchParams);
    const inRange = (position: number, start: number, end: number) => position >= start && position <= end;
    await new Promise((resolve) => setTimeout(resolve, delay));
    if (url.pathname === '/api/variants/' && query.position__gte) {
      const results = variants.filter((variant) => inRange(variant.position, Number(query.position__gte), Number(query.position__lte)));
      return route.fulfill({ json: { count: results.length, next: null, previous: null, results } });
    }
    if (url.pathname.endsWith('/feature_predictions/') && query.chr_and_variant_range) {
      const [, start, end] = query.chr_and_variant_range.split(':').map(Number);
      return route.fulfill({ json: predictions.filter((record) => inRange(Number(record.position), start ?? 0, end ?? 0)) });
    }
    const recorded = await sample(sampleKey('GET', url.pathname, query)).catch(() => ({ status: 404, body: { detail: 'Not found.' } }));
    return route.fulfill({ status: recorded.status, json: recorded.body });
  });
}

test('the ASD Browser opens on the default range with each effects view, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/`);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr1:2,337,101 A>C' })).toBeVisible();
  // As on humanbase.io, the effects card opens on Heatmap: here, the 34 variants in view.
  await expect(page.getByText(/^34 variants in view/)).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Heatmap' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('grid').first()).toBeVisible();
  // With the API off the genome browser draws from the recorded track windows, with no request.
  const browser = page.getByRole('application', { name: /^Genome browser, chr1:2,230,000-2,440,000/ });
  await expect(browser.getByText('← PEX10')).toBeVisible();
  await expect(browser.getByText('chr1:2,337,101', { exact: true })).toBeVisible();
  await expect(browser.locator('.genome-tracks-bar')).not.toHaveCount(0);
  expect(await violationsOf(page)).toEqual([]);
  for (const tab of ['Strongest effects', 'All features']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
    if (tab === 'Strongest effects') await expect(page.getByText('Raises, 39 DNA features')).toBeVisible();
    expect(await violationsOf(page)).toEqual([]);
  }
  await page.getByRole('combobox', { name: 'Features' }).click();
  await page.getByRole('option', { name: 'RNA features' }).click();
  await expect(page).toHaveURL(/features=rna/);
  expect(apiRequests).toEqual([]);
});

test('the ASD table finds a gene and opens a row in the browser, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/?view=table`);
  await expect(page.getByRole('table', { name: 'ASD Browser variants' })).toBeVisible();
  await expect(page.getByText('127,133 variants', { exact: true })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'CHD8' }).click();
  await expect(page.getByText('2 variants', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: /^chr14:/ }).first().click();
  await expect(page.getByRole('heading', { name: /^Molecular effects of chr14:/ })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the ASD Browser shows and hides its tracks and exports the view as SVG, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/`);
  const browser = page.getByRole('application', { name: /^Genome browser, chr1:2,230,000-2,440,000/ });
  const headers = page.locator('.genome-engine .track-header-name');
  await expect(browser.getByText('← PEX10')).toBeVisible();
  await expect(headers).toHaveText(['Sequence', 'DNA disease impact score', 'RNA disease impact score', 'Genes']);
  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await drawer.getByRole('checkbox', { name: 'Conservation' }).check();
  await drawer.getByRole('checkbox', { name: 'GM12878 ChromHMM' }).check();
  await drawer.getByRole('checkbox', { name: 'Genes' }).uncheck();
  await drawer.getByRole('checkbox', { name: 'Sequence' }).uncheck();
  expect(await violationsOf(page)).toEqual([]);
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['DNA disease impact score', 'RNA disease impact score', 'Conservation', 'GM12878 ChromHMM']);
  await expect(page.locator('.genome-engine').getByText('← PEX10')).toHaveCount(0);
  await page.reload();
  await expect(headers).toHaveText(['DNA disease impact score', 'RNA disease impact score', 'Conservation', 'GM12878 ChromHMM']);
  await expect(page.locator('.genome-engine .genome-tracks-bar')).not.toHaveCount(0);

  const segments = page.locator('.genome-engine .genome-tracks-segment');
  await expect(segments).toHaveCount(108);
  await expect(segments.first()).toHaveAttribute('fill', '#C2D69A');
  await segments.nth(23).hover();
  await expect(page.getByRole('tooltip')).toHaveText(/^QuiesGM12878 ChromHMMStart2,249,001Length17,400 bp$/);
  await page.getByRole('group').filter({ hasText: 'View as tableGM12878 ChromHMM' }).getByText('View as table').click();
  const table = page.getByRole('table', { name: 'GM12878 ChromHMM segments in chr1:2,230,000-2,440,000, GRCh37/hg19' });
  await expect(table.getByRole('row')).toHaveCount(109);
  await expect(table.getByRole('row').nth(1)).toHaveText(/^Low\s*2,229,601\s*2,230,400\s*800 bp$/);
  expect(await violationsOf(page)).toEqual([]);

  await page.locator('.genome-engine').focus();
  await page.keyboard.press('x');
  const dialog = page.getByRole('dialog', { name: 'Export the view' });
  await dialog.getByRole('textbox', { name: 'Width' }).fill('900 px');
  await dialog.getByRole('checkbox', { name: 'Include the vertical guideline' }).uncheck();
  expect(await violationsOf(page)).toEqual([]);
  const [download] = await Promise.all([page.waitForEvent('download'), dialog.getByRole('button', { name: 'Export' }).click()]);
  expect(download.suggestedFilename()).toBe('chr1_2230000-2440000_hg19.svg');
  const svg = await readFile(await download.path(), 'utf8');
  expect(svg).toMatch(/^<svg[^>]+width="1120"/);
  expect(svg).toContain('chr1:2,230,000-2,440,000, GRCh37/hg19');
  expect(svg).toContain('Conservation');
  expect(svg).toContain('GM12878 ChromHMM');
  expect(svg.match(/class="genome-tracks-segment"/g)).toHaveLength(108);
  expect(svg).toContain('chr1:2,337,101');
  expect(svg).not.toContain('genome-tracks-guide');
  await expect(dialog).toBeHidden();

  await page.getByRole('button', { name: 'Tracks' }).click();
  await drawer.getByRole('button', { name: 'Reset to default tracks' }).click();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toHaveText(['Sequence', 'DNA disease impact score', 'RNA disease impact score', 'Genes']);
  expect(apiRequests).toEqual([]);
});

test('the ASD Browser stops at the end of a chromosome and says when a typed position is past it, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/?location=chr1:249,200,000-249,250,000`);
  const field = page.getByRole('searchbox', { name: 'Location or gene' });
  await expect(field).toHaveValue('chr1:249,200,000-249,250,000');
  for (const press of [1, 2]) {
    await page.locator('.genome-engine').focus();
    await page.keyboard.press('ArrowRight');
    await expect(field, `press ${press}`).toHaveValue('chr1:249,200,621-249,250,621');
  }
  await page.locator('.genome-engine').focus();
  await page.keyboard.press('-');
  await expect(field).toHaveValue('chr1:248,750,621-249,250,621');
  await field.fill('chr1:300,000,000-300,010,000');
  await field.press('Enter');
  await expect(page.getByText('chr1 ends at 249,250,621 on GRCh37/hg19. Showing up to the end.')).toBeVisible();
  await expect(field).toHaveValue('chr1:249,240,621-249,250,621');
  await expect(field).toHaveAttribute('aria-invalid', 'true');
  await field.fill('chr23:1,000-2,000');
  await field.press('Enter');
  await expect(page.getByText('There is no chr23 on GRCh37/hg19. Enter chr1 to chr22, chrX, chrY or chrM.')).toBeVisible();
  await expect(page).toHaveURL(/location=chr1/);
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the ASD Browser opens a gene’s and a segment’s details on click and from the keyboard, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/`);
  const browser = page.getByRole('application', { name: /^Genome browser, chr1:2,230,000-2,440,000/ });
  await browser.getByText('← MORN1').click();
  const gene = page.getByRole('dialog', { name: 'Genes' });
  await expect(gene).toHaveText(/^GenesMethodprotein_codingLocationchr1:2,252,692-2,323,146Score1000$/);
  await expect(gene.getByRole('button', { name: 'Close' })).toBeFocused();
  expect(await violationsOf(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(gene).toBeHidden();
  await expect(page.getByRole('button', { name: 'MORN1' })).toBeFocused();

  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await drawer.getByRole('checkbox', { name: 'GM12878 ChromHMM' }).check();
  await drawer.getByRole('button', { name: 'Done' }).click();
  const segment = page.getByRole('dialog', { name: 'GM12878 ChromHMM' });
  const pol2Box = page.locator('.genome-tracks-segment[data-item="GM12878 ChromHMM 2303401"]');
  await pol2Box.hover();
  await expect(page.getByRole('tooltip')).toHaveText(/^Pol2GM12878 ChromHMM/);
  await pol2Box.click();
  await expect(segment).toBeVisible();
  await expect(page.getByRole('tooltip')).toBeHidden();
  await page.keyboard.press('Escape');
  await page.mouse.move(0, 0);

  const pol2 = page.getByRole('button', { name: 'Pol2, 2,303,401 to 2,313,000' });
  await pol2.focus();
  await page.keyboard.press('Enter');
  await expect(segment).toHaveText(/^GM12878 ChromHMMLocationchr1:2,303,401-2,313,000Score1000$/);
  const [frame, popover] = await Promise.all([page.locator('.genome-tracks').boundingBox(), segment.boundingBox()]);
  expect(popover && frame && popover.x >= frame.x && popover.x + popover.width <= frame.x + frame.width && popover.y + popover.height <= frame.y + frame.height).toBe(true);
  expect(await violationsOf(page)).toEqual([]);
  await segment.getByRole('button', { name: 'Close' }).click();
  await expect(segment).toBeHidden();
  await expect(pol2).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(segment).toBeVisible();
  await page.getByRole('heading', { name: /^Molecular effects of/ }).click();
  await expect(segment).toBeHidden();
  await pol2.focus();
  await page.keyboard.press('Enter');
  const area = await page.locator('.genome-tracks-area').boundingBox();
  if (!area) throw new Error('no tracks');
  await page.mouse.move(area.x + 600, area.y + 100);
  await page.mouse.down();
  await page.mouse.move(area.x + 500, area.y + 100, { steps: 5 });
  await page.mouse.up();
  await expect(segment).toBeHidden();
  await expect(page).toHaveURL(/location=chr1/);

  await page.getByRole('button', { name: 'Tracks' }).click();
  await drawer.getByRole('button', { name: 'Reset to default tracks' }).click();
  await drawer.getByRole('button', { name: 'Done' }).click();
  expect(apiRequests).toEqual([]);
});

test('the ASD Browser opens a disease impact score’s details on click and from the keyboard, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/asd/`);
  const browser = page.getByRole('application', { name: /^Genome browser, chr1:2,230,000-2,440,000/ });
  await browser.locator('[data-item="DNA disease impact score 2346202"]').click();
  const dna = page.getByRole('dialog', { name: 'DNA disease impact score' });
  // humanbase.io lists Location and Score for its score tracks; the sample is rounded to 3 decimals.
  await expect(dna).toHaveText(/^DNA disease impact scoreLocationchr1:2,346,202-2,346,202Score3\.619$/);
  await expect(dna.getByRole('button', { name: 'Close' })).toBeFocused();
  expect(await violationsOf(page)).toEqual([]);
  await page.keyboard.press('Escape');
  await expect(dna).toBeHidden();
  const bar = page.getByRole('button', { name: '3.62 at 2,346,202' });
  await expect(bar).toBeFocused();

  const rna = page.getByRole('group', { name: 'RNA disease impact score, items' }).getByRole('button', { name: '5.58 at 2,377,039' });
  await rna.focus();
  await page.keyboard.press('Enter');
  const popover = page.getByRole('dialog', { name: 'RNA disease impact score' });
  await expect(popover).toHaveText(/^RNA disease impact scoreLocationchr1:2,377,039-2,377,039Score5\.584$/);
  expect(await violationsOf(page)).toEqual([]);
  await popover.getByRole('button', { name: 'Close' }).click();
  await expect(rna).toBeFocused();
  expect(apiRequests).toEqual([]);
});

test('the ASD Browser fits a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['/asd/', '/asd/?view=table']) {
    await page.goto(`${web}${path}`);
    await expect(page.getByRole('heading', { level: 1, name: 'ASD Browser' })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});

test('the ASD Browser toolbar centers its controls on one line and wraps Next variant with Tracks and Export', async ({ page }) => {
  await apiOff(page);
  const toolbar = page.getByRole('toolbar', { name: 'Genome browser' });
  // Read every control in one pass, measured from the toolbar, so the page can't move between readings.
  const middles = () =>
    toolbar.evaluate((bar) => {
      const top = bar.getBoundingClientRect().top;
      const centers = [...bar.querySelectorAll('button')].map((button) => {
        const box = button.getBoundingClientRect();
        return [button.getAttribute('aria-label') ?? button.textContent?.trim(), Math.round(box.top - top + box.height / 2)] as const;
      });
      return Object.fromEntries(centers);
    });
  for (const width of [1440, 1200, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(`${web}/asd/`);
    await expect(page.locator('.genome-tracks-bar').first()).toBeVisible();
    const middle = await middles();
    if (width > 375) expect(middle['Previous variant']).toBe(middle['Zoom out']);
    expect(middle['Next variant']).toBe(middle['Tracks']);
    expect(middle['Export']).toBe(middle['Tracks']);
  }
});

test('a drag on the ASD heatmap moves the view on every step and keeps the heatmap while each range loads', async ({ page }) => {
  await slowSampleApi(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.goto(`${web}/asd/`);
  await page.getByRole('tab', { name: 'Heatmap' }).click();
  const grid = page.locator('.effects-heatmap [role="grid"]');
  await expect(grid).toBeVisible();
  const mounted = await grid.elementHandle();
  const location = page.getByRole('searchbox', { name: 'Location or gene' });
  await grid.scrollIntoViewIfNeeded();
  const card = await page.locator('.effects-heatmap').boundingBox();
  const cells = await grid.boundingBox();
  if (!mounted || !card || !cells) throw new Error('The heatmap didn’t draw.');
  const y = cells.y + 40;
  let x = card.x + card.width / 2;
  let shown = await location.inputValue();
  await page.mouse.move(x, y);
  await page.mouse.down();
  for (let step = 0; step < 20; step += 1) {
    x -= 10;
    await page.mouse.move(x, y);
    await expect(location).not.toHaveValue(shown);
    expect(await mounted.evaluate((node) => node.isConnected)).toBe(true);
    shown = await location.inputValue();
    await page.waitForTimeout(120);
  }
  await page.mouse.up();
  expect(await mounted.evaluate((node) => node.isConnected)).toBe(true);
});
