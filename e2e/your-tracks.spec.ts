import { expect, test, type Page } from '@playwright/test';
import { bbiTestFile } from '../packages/data/src/genome/bbiTestFile.ts';
import chromosomeSizes from '../packages/data/src/genome/chromosomeSizes.json' with { type: 'json' };
import { sampleApi } from './apiOff';
import { violationsOf } from './violations';

const example = 'http://localhost:4173/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/';
const sizes = (assembly: 'hg19' | 'hg38'): Record<string, number> => chromosomeSizes[assembly];
// A score over the whole stretch the example result opens on, so its bars show wherever the view sits.
const signal = (assembly: 'hg19' | 'hg38') =>
  Buffer.from(
    bbiTestFile({
      kind: 'bigWig',
      chromosomes: ['chr1', 'chr2'].map((name) => ({ name, length: sizes(assembly)[name] ?? 0 })),
      items: Array.from({ length: 200 }, (_, step) => ({ chrom: 'chr1', start: 109_700_000 + step * 1_000, end: 109_701_000 + step * 1_000, value: (step % 10) + 1 })),
    }),
  );
const yourTrack = { name: 'H3K27ac.bw', mimeType: 'application/octet-stream', buffer: signal('hg19') };

async function openTracks(page: Page) {
  await page.getByRole('button', { name: 'Tracks', exact: true }).click();
  return page.getByRole('dialog', { name: 'Tracks' });
}

test('a track from the person’s own file shows, stays after a reload, exports and can be removed', async ({ page }) => {
  await sampleApi(page);
  await page.goto(example);
  const headers = page.locator('.genome-engine .track-header-name');
  await expect(headers.first()).toBeVisible();
  let drawer = await openTracks(page);
  await drawer.getByRole('radio', { name: 'Your file' }).check();
  await expect(drawer.getByText('On GRCh37/hg19. It’s read in this browser and never uploaded.')).toBeVisible();

  await drawer.getByLabel('bigWig or bigBed file').setInputFiles({ ...yourTrack, name: 'H3K27ac.hg38.bw', buffer: signal('hg38') });
  await expect(drawer.getByText('“H3K27ac.hg38.bw” is on GRCh38/hg38, and this browser shows GRCh37/hg19. Add a GRCh37/hg19 copy of the file.')).toBeVisible();
  await drawer.getByLabel('bigWig or bigBed file').setInputFiles({ name: 'peaks.bedGraph', mimeType: 'text/plain', buffer: Buffer.from('chr1\t0\t10\t1\n') });
  await expect(drawer.getByText(/“peaks.bedGraph” is a text file\./)).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);

  await drawer.getByLabel('bigWig or bigBed file').setInputFiles(yourTrack);
  await expect(drawer.getByRole('status')).toHaveText('H3K27ac is added and shown.');
  await expect(drawer.getByRole('checkbox', { name: 'H3K27ac' })).toBeChecked();
  await expect(drawer.getByText('Your file, 0 to 10')).toBeVisible();
  expect(await violationsOf(page)).toEqual([]);
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).toContainText(['H3K27ac']);
  const bars = page.locator('.genome-engine .genome-tracks-bar');
  await expect(bars).not.toHaveCount(0);

  await page.reload();
  await expect(headers).toContainText(['H3K27ac']);
  await expect(bars).not.toHaveCount(0);

  await page.getByRole('button', { name: 'Export', exact: true }).click();
  const dialog = page.getByRole('dialog', { name: 'Export the view' });
  const download = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Export' }).click();
  const svg = await (await download).createReadStream().then(async (stream) => {
    const chunks: Buffer[] = [];
    for await (const chunk of stream) chunks.push(chunk as Buffer);
    return Buffer.concat(chunks).toString('utf8');
  });
  expect(svg).toContain('H3K27ac');

  drawer = await openTracks(page);
  await drawer.getByRole('button', { name: 'Remove H3K27ac' }).click();
  await expect(drawer.getByRole('status')).toHaveText('H3K27ac is removed.');
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(headers).not.toContainText(['H3K27ac']);
  await page.reload();
  await expect(headers.first()).toBeVisible();
  await expect(headers).not.toContainText(['H3K27ac']);
});

test('a track by URL reads the file in byte ranges, and says when the server won’t share it', async ({ page }) => {
  await sampleApi(page);
  const file = signal('hg19');
  await page.route('https://tracks.example.org/**', (route) => {
    if (route.request().url().endsWith('/blocked.bw')) return route.abort();
    const [, from = '0', to = String(file.length - 1)] = /bytes=(\d+)-(\d+)/.exec(route.request().headers().range ?? '') ?? [];
    const end = Math.min(Number(to), file.length - 1);
    return route.fulfill({
      status: 206,
      headers: { 'content-range': `bytes ${from}-${end}/${file.length}`, 'access-control-allow-origin': '*', 'access-control-expose-headers': 'content-range' },
      body: file.subarray(Number(from), end + 1),
    });
  });
  await page.goto(example);
  const drawer = await openTracks(page);
  await drawer.getByRole('radio', { name: 'By URL' }).check();
  const address = drawer.getByRole('textbox', { name: 'Address of a bigWig or bigBed file' });
  await address.fill('https://tracks.example.org/blocked.bw');
  await drawer.getByRole('button', { name: 'Add track' }).click();
  await expect(address).toHaveAccessibleDescription(/Humanbase couldn’t read the file at tracks.example.org\. Its server has to let other sites read it \(CORS\)/);

  await address.fill('https://tracks.example.org/hub/ChIP%20signal.bw');
  await drawer.getByRole('button', { name: 'Add track' }).click();
  await expect(drawer.getByRole('status')).toHaveText('ChIP signal is added and shown.');
  await expect(drawer.getByText('tracks.example.org, 0 to 10')).toBeVisible();
  await drawer.getByRole('button', { name: 'Done' }).click();
  await expect(page.locator('.genome-engine .track-header-name')).toContainText(['ChIP signal']);
  await expect(page.locator('.genome-engine .genome-tracks-bar')).not.toHaveCount(0);
});
