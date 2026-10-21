// Recaptures the Existing and proposed screens: replays each pair's steps on humanbase.io and the proposed build.
// Usage: node scripts/capture-existing-and-proposed.mjs [slug ...]
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { chromium } from '@playwright/test';

const data = new URL('../apps/docs/src/data/existing-and-proposed/', import.meta.url);
const images = new URL('../apps/docs/src/assets/existing-and-proposed/', import.meta.url);
const only = process.argv.slice(2);

const readOnly = /\/api\/genes\/search\//;

const target = (page, step) => (step.selector ? page.locator(step.selector) : step.role ? page.getByRole(step.role, { name: step.nameIsRegex ? new RegExp(step.name) : (step.name ?? step.text) }) : page.getByText(step.text)).first();

const steps = {
  goto: (page, step) => page.goto(step.url, { waitUntil: 'load' }),
  click: (page, step) => (step.dispatch ? target(page, step).dispatchEvent('click') : target(page, step).click()),
  check: (page, step) => target(page, step).check({ force: true }),
  hover: (page, step) => target(page, step).hover({ force: true }),
  fill: (page, step) => page.getByLabel(step.label).or(page.getByPlaceholder(step.label)).first().fill(step.text),
  type: (page, step) => (step.selector || step.role ? target(page, step).fill(step.text) : page.keyboard.type(step.text)),
  press: (page, step) => page.keyboard.press(step.key),
  wait: (page, step) => page.waitForTimeout(step.ms ?? 1000),
  scroll: async (page, step) => {
    await page.locator(step.selector).first().evaluate((element) => element.scrollIntoView({ block: 'start' }));
    if (step.offset) await page.mouse.wheel(0, step.offset);
  },
};

await mkdir(images, { recursive: true });
const browser = await chromium.launch();
for (const name of (await readdir(data)).filter((file) => file.endsWith('.json'))) {
  const comparison = JSON.parse(await readFile(new URL(name, data), 'utf8'));
  if (only.length && !only.includes(comparison.slug)) continue;
  for (const [index, pair] of comparison.pairs.entries()) {
    for (const side of ['existing', 'proposed']) {
      const capture = pair[side];
      const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
      // Captures only read: any request that could submit a job is blocked, except gene lookups the forms make.
      await page.route('**/*', (route) => {
        const request = route.request();
        return request.method() === 'GET' || readOnly.test(request.url()) ? route.continue() : route.abort();
      });
      try {
        for (const step of capture.steps) await steps[step.do](page, step);
        capture.file = `${comparison.slug}-${index + 1}-${side}.jpg`;
        await page.screenshot({ path: new URL(capture.file, images).pathname, type: 'jpeg', quality: 80 });
        console.log('captured', capture.file);
      } catch (error) {
        console.error(`failed ${comparison.slug} ${index + 1} ${side}: ${error.message.split('\n')[0]}`);
      } finally {
        await page.close();
      }
    }
  }
  comparison.captured = new Date().toISOString().slice(0, 10);
  await writeFile(new URL(name, data), `${JSON.stringify(comparison, null, 2)}\n`);
}
await browser.close();
