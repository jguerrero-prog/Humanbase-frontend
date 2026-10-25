import { expect, test } from '@playwright/test';
import { apiOff, sampleApi } from './apiOff';
import { downloadFrom } from './downloads';
import { violationsOf } from './violations';

const web = 'http://localhost:4173';

for (const [path, tool] of [['/variant-effects/', 'Sei'], ['/variant-effects/?model=beluga', 'Beluga'], ['/seqweaver/', 'Seqweaver']]) {
  test(`the ${tool} form checks its example, with the API off`, async ({ page }) => {
    const apiRequests = await apiOff(page);
    await page.goto(`${web}${path}`);
    await expect(page.getByRole('heading', { level: 2, name: `About ${tool}` })).toBeVisible();
    expect(await violationsOf(page)).toEqual([]);
    await page.getByRole('radio', { name: 'Use the example' }).click();
    await expect(page.getByRole('button', { name: new RegExp(`^Run ${tool} on \\d+ variants$`) })).toBeVisible();
    expect(await violationsOf(page)).toEqual([]);
    expect(apiRequests).toEqual([]);
  });
}

test('Variant effects opens on Sei with a variant list, and the model and tab live in the URL', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/variant-effects/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Variant effects' })).toBeVisible();
  await expect(page.getByRole('tab', { name: 'Variant list' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('radiogroup', { name: 'What are you submitting?' }).getByRole('radio')).toHaveCount(2);
  await expect(page.getByText('Variants anywhere in the genome can be scored.')).toBeVisible();
  await page.getByRole('combobox', { name: 'Model' }).click();
  await page.getByRole('option', { name: /^Beluga \(DNA, 2019\)/ }).click();
  await expect(page).toHaveURL(`${web}/variant-effects/?model=beluga`);
  await expect(page.getByRole('heading', { name: 'About Beluga' })).toBeVisible();
  await page.getByRole('tab', { name: 'Region scan' }).click();
  await expect(page).toHaveURL(`${web}/variant-effects/?model=beluga&tab=region-scan`);
  await expect(page.getByRole('combobox', { name: 'Model' })).toHaveText(/Beluga \(DNA, 2019\)/);
  await expect(page.getByText('Region scan mutates every base of each sequence. It runs on Beluga.')).toBeVisible();
  await page.goBack();
  await expect(page.getByRole('tab', { name: 'Variant list' })).toHaveAttribute('aria-selected', 'true');
  await expect(page.getByRole('heading', { name: 'About Beluga' })).toBeVisible();
});

for (const [old, moved] of [['/sei/', '/variant-effects/?model=sei'], ['/beluga/', '/variant-effects/?model=beluga'], ['/ism/', '/variant-effects/?tab=region-scan']]) {
  test(`${old} still opens its form on Variant effects`, async ({ page }) => {
    await apiOff(page);
    await page.goto(`${web}${old}`);
    await expect(page).toHaveURL(`${web}${moved}`);
    await expect(page.getByRole('heading', { level: 1, name: 'Variant effects' })).toBeVisible();
  });
}

test('Seqweaver offers only its own model and links to Variant effects for DNA effects', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/seqweaver/`);
  await page.getByRole('combobox', { name: 'Model' }).click();
  await expect(page.getByRole('option')).toHaveText(['Seqweaver (RNA)']);
  await page.keyboard.press('Escape');
  await page.getByRole('main').getByRole('link', { name: 'Variant effects', exact: true }).click();
  await expect(page).toHaveURL(`${web}/variant-effects/`);
  await expect(page.getByRole('heading', { name: 'About Sei' })).toBeVisible();
});

test('starting the Seqweaver example opens its job page, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/seqweaver/`);
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await page.getByRole('button', { name: 'Run Seqweaver on 10 variants' }).click();
  await expect(page).toHaveURL(`${web}/deepsea/jobs/00000000-0000-4000-8000-000000000113/`);
  expect(apiRequests).toEqual([]);
});

test('the Seqweaver FASTA example, which has no recorded submit, says jobs need the API, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/seqweaver/`);
  await page.getByRole('radio', { name: 'Sequences (FASTA)' }).click();
  await page.getByRole('radio', { name: 'Use the example' }).click();
  await page.getByRole('button', { name: 'Run Seqweaver on 4 sequences' }).click();
  await expect(page.getByText('Jobs can’t start while the API is off')).toBeVisible();
  await expect(page).toHaveURL(`${web}/seqweaver/`);
  expect(apiRequests).toEqual([]);
});

test('the recorded Seqweaver FASTA job’s results are files, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/deepsea/jobs/dbebecbe-f58a-4ce4-b4ba-04af819a9ad7/`);
  await expect(page.getByRole('link', { name: 'Download everything (tar.gz)' })).toBeVisible();
  await expect(page.getByText('Seqweaver predicted 232 RNA-binding protein profiles for each of your 4 sequences. The results are files to download, one probability per profile and sequence.')).toBeVisible();
  const files = page.getByRole('table', { name: 'Result files' });
  await expect(files.getByRole('row')).toHaveText([/File/, /^Probability.*Every feature for every sequence.*TSV, gzipped.*Download/, /^Your query.*FASTA.*Download/]);
  await expect(page.getByRole('combobox', { name: 'Score' })).toHaveCount(0);
  expect(await violationsOf(page)).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(apiRequests).toEqual([]);
});

test('the recorded Sei BED job’s results are files, as humanbase.io shows them, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  const id = '90e896a5-a950-4180-a4fb-c5bcc8cefd1d';
  await page.goto(`${web}/deepsea/jobs/${id}/`);
  await expect(page.getByRole('heading', { level: 1, name: 'Untitled Sei job' })).toBeVisible();
  await expect(page.getByText('Sei predicted 21,907 chromatin profiles for each of your 10 regions. The results are files to download, one probability per profile and region.')).toBeVisible();
  const files = page.getByRole('table', { name: 'Result files' });
  await expect(files.getByRole('row')).toHaveText([/File/, /^Probability.*Every feature for every region.*TSV, gzipped, with tabix index.*Download/, /^Your query.*BED.*Download/]);
  await expect(page.getByRole('combobox', { name: 'Score' })).toHaveCount(0);
  expect(await violationsOf(page)).toEqual([]);
  await page.setViewportSize({ width: 375, height: 812 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  expect(apiRequests).toEqual([]);
});

test('each FASTA example job shows its files with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  for (const [tool, id] of [['Sei', '5154ea8d-3203-4c81-acc8-757faeb44e0c'], ['Beluga', '27d030ee-02d9-43ca-adec-e5d76265591a']]) {
    await page.goto(`${web}/deepsea/jobs/${id}/`);
    await expect(page.getByRole('heading', { level: 1, name: `Untitled ${tool} job` })).toBeVisible();
    await expect(page.getByText(new RegExp(`^${tool} predicted .*for each of your 4 sequences\\.`))).toBeVisible();
    await expect(page.getByRole('table', { name: 'Result files' }).getByRole('link', { name: 'Download Probability' })).toHaveAttribute('href', `https://s3-us-west-2.amazonaws.com/humanbase/deepsea/jobs/${id}/${id}_feature_predictions.tsv.gz`);
  }
  expect(apiRequests).toEqual([]);
});

test('the DeepSEA forms fit a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const path of ['/variant-effects/', '/variant-effects/?model=beluga', '/seqweaver/']) {
    await page.goto(`${web}${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});

const job = (n: number) => `${web}/deepsea/jobs/00000000-0000-4000-8000-${String(n).padStart(12, '0')}/`;
const example = `${web}/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/`;

test('the Seqweaver example result has no WCAG 2.2 AA violations in each view, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(example);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr1:109,817,590 G>T' })).toBeVisible();
  await expect(page.getByText('LIN28A').first()).toBeVisible();
  // As on humanbase.io, the effects card opens on Heatmap, even with one variant in range.
  await expect(page.getByRole('tab', { name: 'Heatmap' })).toHaveAttribute('aria-selected', 'true');
  expect(await violationsOf(page)).toEqual([]);
  for (const tab of ['Strongest effects', 'All features']) {
    await page.getByRole('tab', { name: tab }).click();
    await expect(page.getByRole('tab', { name: tab })).toHaveAttribute('aria-selected', 'true');
    expect(await violationsOf(page)).toEqual([]);
  }
  await page.getByRole('button', { name: 'Next', exact: true }).click();
  await expect(page).toHaveURL(/variant=chr10-23508363-A-G/);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr10:23,508,363 A>G' })).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('the Seqweaver example result draws the job’s own score tracks, on by default and in the Tracks drawer, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(example);
  const browser = page.locator('.genome-engine');
  await expect(browser.locator('.track-header-name')).toHaveText(['Sequence', 'Disease impact score', 'Mean −log e-value', 'Genes']);
  await expect(browser.locator('.track-header').filter({ hasText: 'Disease impact score' })).toContainText('This job, 0 to 3');
  // The job's files hold one score per variant: 1.0026 and 0.9013 at chr1:109,817,590, as its variant scores say.
  await expect(browser.getByRole('button', { name: '1.00 at 109,817,590' })).toBeVisible();
  await expect(browser.getByRole('button', { name: '0.90 at 109,817,590' })).toBeVisible();
  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await expect(drawer.getByRole('checkbox', { name: 'Disease impact score' })).toBeChecked();
  await drawer.getByRole('checkbox', { name: 'Mean −log e-value' }).uncheck();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(browser.locator('.track-header-name')).toHaveText(['Sequence', 'Disease impact score', 'Genes']);
  await page.getByRole('button', { name: 'Next variant' }).click();
  await expect(browser.getByRole('button', { name: '0.59 at 23,508,363' })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('a data track’s menu downloads the data in view as bedGraph or BED, read from the samples, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(example);
  const browser = page.locator('.genome-engine');
  await expect(browser.getByRole('button', { name: '1.00 at 109,817,590' })).toBeVisible();
  await page.getByRole('button', { name: 'Disease impact score track options' }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Track settings…', 'Move up', 'Move down', /^Download data in view/, /^Download full file/, 'Hide track']);
  await expect(page.getByRole('menuitem', { name: /Download data in view/ })).toContainText('bedGraph, chr1:109,767,590-109,867,590');
  expect(await violationsOf(page)).toEqual([]);
  await page.keyboard.press('Escape');
  const scores = await downloadFrom(page, 'Disease impact score track options', 'Download data in view');
  expect(scores.name).toBe('Disease-impact-score_hg19_chr1-109767590-109867590.bedgraph');
  expect(scores.bytes.toString('utf8')).toMatch(/^chr1\t109817589\t109817590\t1\.00\d*\n/m);
  await expect(page.getByRole('region', { name: 'Notifications' }).getByRole('listitem')).toHaveText('Disease impact score data downloaded');

  await page.getByRole('button', { name: 'Genes track options' }).click();
  await expect(page.getByRole('menuitem')).toHaveText(['Move up', 'Move down', 'Hide track']);
  await page.keyboard.press('Escape');
  await page.getByRole('button', { name: 'Tracks' }).click();
  const drawer = page.getByRole('dialog', { name: 'Tracks' });
  await drawer.getByRole('checkbox', { name: 'GM12878 ChromHMM' }).check();
  await drawer.getByRole('button', { name: 'Done' }).click();
  const segments = await downloadFrom(page, 'GM12878 ChromHMM track options', 'Download data in view');
  expect(segments.name).toBe('GM12878-ChromHMM_hg19_chr1-109767590-109867590.bed');
  const lines = segments.bytes.toString('utf8').trim().split('\n');
  expect(lines.length).toBeGreaterThan(1);
  for (const line of lines) expect(line).toMatch(/^chr1\t\d+\t\d+\t\S+\t\d+\t\.\t\d+\t\d+\t(\d+,\d+,\d+|0)$/);
  // Away from the example variant the samples hold no data, so there is nothing to save.
  const field = page.getByRole('searchbox', { name: 'Location or gene' });
  await field.fill('chr1:2,600,000-2,700,000');
  await field.press('Enter');
  await expect(page.getByText('Sample data covers only the area around each example variant')).toBeVisible();
  await page.getByRole('button', { name: 'Disease impact score track options' }).click();
  const away = page.getByRole('menuitem', { name: /Download data in view/ });
  await expect(away).toHaveAttribute('aria-disabled', 'true');
  await expect(away).toContainText('The sample data doesn’t cover this view. Turn the API on to download it.');
  await page.keyboard.press('Escape');
  expect(apiRequests).toEqual([]);
});

test('on a phone the zoom stops, the location and the effects legend show in full on a Seqweaver result, from the samples', async ({ page }) => {
  await sampleApi(page);
  for (const width of [360, 390]) {
    await page.setViewportSize({ width, height: 812 });
    await page.goto(example);
    await expect(page.locator('.genome-zoom .segmented-track')).toBeVisible();
    const legend = page.locator('.molecular-effects .legend-stepped');
    await expect(legend).toBeVisible();
    const clipped = await page.evaluate(() => {
      const overflows = (selector: string) => {
        const element = document.querySelector(selector);
        return element ? element.scrollWidth > element.clientWidth : true;
      };
      const card = document.querySelector('.molecular-effects')?.getBoundingClientRect().right ?? 0;
      const legendEnd = document.querySelector('.molecular-effects .legend-words')?.getBoundingClientRect().right ?? Infinity;
      return { stops: overflows('.genome-zoom .segmented-track'), location: overflows('.genome-location input'), legend: legendEnd > card };
    });
    expect(clipped).toEqual({ stops: false, location: false, legend: false });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
  }
});

test('heatmap row labels take at most 40% of the plot, one line each, cut with an ellipsis but named in full, with the API off', async ({ page }) => {
  await apiOff(page);
  for (const width of [1440, 375]) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(example);
    await page.getByRole('tab', { name: 'Heatmap' }).click();
    await expect(page.locator('.heatmap-row').first()).toBeVisible();
    const layout = await page.locator('.heatmap-plot').evaluate((plot) => {
      const labels = [...plot.querySelectorAll<HTMLElement>('.heatmap-row-label')];
      const cut = labels.filter((label) => {
        const name = label.querySelector('.heatmap-row-name');
        return name && name.scrollWidth > name.clientWidth;
      });
      return {
        share: (labels[0]?.getBoundingClientRect().width ?? 0) / plot.clientWidth,
        heights: [...new Set([...plot.querySelectorAll('.heatmap-row')].map((row) => Math.round(row.getBoundingClientRect().height)))],
        cutNamedInFull: cut.every((label) => label.title === label.textContent),
        cut: cut.length,
      };
    });
    expect(layout.share).toBeLessThanOrEqual(0.401);
    expect(layout.heights).toEqual([26]);
    expect(layout.cutNamedInFull).toBe(true);
    if (width === 375) expect(layout.cut, 'a long label is cut on a phone').toBeGreaterThan(0);
  }
});

test('Sei and Beluga results read their own scales, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/deepsea/jobs/2e18fedf-3de7-4d08-a894-9a937a2b860b/?variant=chr7-49813589-G-C`);
  await page.getByRole('tab', { name: 'Strongest effects' }).click();
  await expect(page.getByText('Raises, 13 sequence classes')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.goto(`${web}/deepsea/jobs/8b26a498-278c-4c73-a6a4-5f2550c30073/`);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr3:12,598,855 G>A' })).toBeVisible();
  await page.getByRole('tab', { name: 'Strongest effects' }).click();
  await expect(page.getByText('UBF', { exact: true })).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('each waiting job state has no WCAG 2.2 AA violations, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  for (const [n, text] of [[131, 'Queued'], [111, /Running for/], [121, 'Failed: chr23 is not a chromosome on GRCh37/hg19']] as const) {
    await page.goto(job(n));
    await expect(page.getByRole('status').filter({ hasText: text })).toBeVisible();
    expect(await violationsOf(page)).toEqual([]);
  }
  await page.goto(job(0));
  await expect(page.getByText('This job isn’t available')).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('the DeepSEA job and result pages fit a phone without scrolling sideways', async ({ page }) => {
  await apiOff(page);
  await page.setViewportSize({ width: 375, height: 812 });
  for (const url of [job(111), example]) {
    await page.goto(url);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(375);
  }
});

test('the Sei score plot switches plot style, zooms with the brush, the wheel and keys, and selects, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/deepsea/jobs/2e18fedf-3de7-4d08-a894-9a937a2b860b/`);
  const plot = page.getByRole('figure', { name: /^12 variants/ });
  const ticks = plot.locator('.variant-plot-tick');
  const windowWidth = async () => Number(await plot.locator('.variant-plot-window').getAttribute('width'));
  await expect(plot.getByText('Genome', { exact: true })).toBeVisible();
  await expect(ticks.filter({ hasText: 'chr3:12598855' })).toHaveCount(1);
  await expect(plot.getByRole('button', { name: /^chr3:12,598,855 G>A/ })).toHaveAttribute('aria-pressed', 'true');
  const whole = await windowWidth();
  const wholeTicks = await ticks.allTextContents();

  await plot.scrollIntoViewIfNeeded();
  const brush = await plot.locator('.variant-plot-brush').boundingBox();
  if (!brush) throw new Error('no brush');
  // The window starts on the whole axis, so zooming starts from a handle.
  await page.mouse.move(brush.x + brush.width - 1, brush.y + brush.height / 2);
  await page.mouse.down();
  await page.mouse.move(brush.x + brush.width * 0.4, brush.y + brush.height / 2, { steps: 5 });
  await page.mouse.up();
  expect(await windowWidth()).toBeLessThan(whole * 0.5);
  expect(await ticks.allTextContents()).not.toEqual(wholeTicks);

  await page.getByRole('combobox', { name: 'Plot style' }).click();
  await page.getByRole('option', { name: 'Score Rank' }).click();
  await expect(plot.getByText('Rank', { exact: true })).toBeVisible();
  expect(await windowWidth()).toBeCloseTo(whole);
  await plot.getByRole('button', { name: /^chr7:49,813,589 G>C/ }).click();
  await expect(page).toHaveURL(/variant=chr7-49813589-G-C/);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr7:49,813,589 G>C' })).toBeVisible();

  await plot.scrollIntoViewIfNeeded();
  const box = await plot.locator('svg').boundingBox();
  if (!box) throw new Error('no plot');
  await page.mouse.move(box.x + box.width / 2, box.y + 120);
  await page.mouse.wheel(0, -100);
  await expect.poll(windowWidth).toBeLessThan(whole);

  await plot.getByRole('button', { name: /^chr7:49,813,589 G>C/ }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(plot.getByRole('button', { name: /^chr17:76,352,731/ })).toBeFocused();
  await expect(page.getByRole('tooltip')).toContainText('chr17:76,352,731');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/variant=chr17-76352731-/);
  const zoomed = await windowWidth();
  await page.keyboard.press('-');
  await expect.poll(windowWidth).toBeGreaterThan(zoomed);
  expect(await violationsOf(page)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('Seqweaver links its gnomAD browser, which opens on the recorded sample range with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/seqweaver/`);
  await page.getByRole('link', { name: 'Explore gnomAD variant effects' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Seqweaver gnomAD browser' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr1:2,334,919 C>T' })).toBeVisible();
  await expect(page.getByText(/^78 variants in view/)).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await page.getByRole('button', { name: 'Next variant' }).click();
  await expect(page).toHaveURL(/variant=chr1-2335285-G-A/);
  await expect(page.getByRole('heading', { name: 'Molecular effects of chr1:2,335,285 G>A' })).toBeVisible();
  expect(apiRequests).toEqual([]);
});
