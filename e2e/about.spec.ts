import { expect, test, type Page } from '@playwright/test';
import { apiOff } from './apiOff';
import { violationsOf } from './violations';

const about = 'http://localhost:4173/about/';

/** Counts play() calls and stands in for playback, so tests never make sound or need the AAC codec. */
async function stubPlayback(page: Page) {
  await page.addInitScript(() => {
    const calls = { play: 0 };
    Object.assign(window, { playback: calls });
    HTMLMediaElement.prototype.play = function (this: HTMLMediaElement) {
      calls.play += 1;
      this.dispatchEvent(new Event('play'));
      return Promise.resolve();
    };
    HTMLMediaElement.prototype.pause = function (this: HTMLMediaElement) {
      this.dispatchEvent(new Event('pause'));
    };
  });
}

const playCount = (page: Page) => page.evaluate(() => (window as unknown as { playback: { play: number } }).playback.play);

test.beforeEach(async ({ page }) => {
  await apiOff(page);
  await stubPlayback(page);
});

test('the About page renders the article with no WCAG 2.2 AA violations', async ({ page }) => {
  await page.goto(about);
  await expect(page).toHaveTitle('About · Humanbase');
  const article = page.getByRole('article', { name: 'An Interactive AI Platform for Human Biology' });
  await expect(article.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(article.getByRole('link', { name: 'https://doi.org/10.1038/s41592-025-02994-8' }).first()).toBeVisible();
  for (const heading of ['The pipeline', 'Analysis', 'Data availability', 'Authors', 'References', 'Additional information']) {
    await expect(article.getByRole('heading', { level: 2, name: heading })).toBeVisible();
  }
  expect(await violationsOf(page)).toEqual([]);
});

test('the drop cap keeps its word whole', async ({ page }) => {
  await page.goto(about);
  const opening = page.locator('.article-drop-cap');
  await expect(opening).toHaveText(/^Increasing quantities of genomic data/);
  const firstLetter = await opening.evaluate((p) => getComputedStyle(p, '::first-letter').float);
  expect(firstLetter).toBe('left');
});

test('Fig. 1 has alt text, a caption and the credit', async ({ page }) => {
  await page.goto(about);
  await expect(page.getByRole('img', { name: /^The Humanbase pipeline in four steps\. Standardized input/ })).toBeVisible();
  const analysis = page.getByRole('figure').filter({ has: page.getByRole('img', { name: /^The seven Humanbase tools\. Networks/ }) });
  await expect(analysis).toContainText('Fig. 1 | Overview of the Humanbase framework.');
  await expect(analysis).toContainText('Graphics by Lucy Reading-Ikkanda/Simons Foundation');
});

test('reference marks jump to the References list', async ({ page }) => {
  await page.goto(about);
  await page.getByRole('link', { name: 'References 1–5' }).click();
  await expect(page).toHaveURL(/#ref-1$/);
  await expect(page.locator('#ref-1')).toBeInViewport();
  await expect(page.locator('#ref-1')).toHaveText('Zhou, J. et al. Nat. Genet. 50, 1171–1179 (2018).');
  await page.getByRole('link', { name: 'Reference 10' }).click();
  await expect(page.locator('#ref-10')).toBeInViewport();
});

test('the narration waits for a press, docks while playing and closes back to Idle', async ({ page }) => {
  await page.goto(about);
  const audio = page.locator('audio');
  await expect(audio).toHaveAttribute('preload', 'none');
  await expect(audio).not.toHaveAttribute('autoplay');
  expect(await playCount(page)).toBe(0);
  const player = page.getByRole('group', { name: 'Audio player' });
  await expect(player).toHaveCount(0);

  await page.getByRole('button', { name: 'Listen to this story' }).click();
  expect(await playCount(page)).toBe(1);
  await expect(player).toBeVisible();
  await expect(player.getByRole('button', { name: 'Pause' })).toBeFocused();
  await expect(player.getByRole('slider', { name: 'Position' })).toHaveAttribute('aria-valuetext', '0 seconds of 8 minutes 7 seconds');
  await page.keyboard.press('Tab');
  await expect(player.getByRole('slider', { name: 'Position' })).toBeFocused();
  await page.keyboard.press('ArrowRight');
  await expect(player.getByRole('slider', { name: 'Position' })).toHaveAttribute('aria-valuetext', '5 seconds of 8 minutes 7 seconds');
  await page.keyboard.press('Tab');
  await expect(player.getByRole('button', { name: 'Close the player' })).toBeFocused();

  await page.mouse.wheel(0, 3000);
  await expect(player).toBeInViewport();
  expect(await violationsOf(page)).toEqual([]);

  await player.getByRole('button', { name: 'Pause' }).click();
  await expect(player.getByRole('button', { name: 'Play the story' })).toBeVisible();
  await player.getByRole('button', { name: 'Close the player' }).click();
  await expect(player).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Listen to this story' })).toBeFocused();
});
