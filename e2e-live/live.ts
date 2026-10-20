import { expect, type Page } from '@playwright/test';
import { violationsOf } from '../e2e/violations';

export const web = 'http://localhost:4190';

/** Records console errors, page errors and failed Humanbase API responses. Responses matching expected, such as a gene that doesn't exist, are allowed. */
export function watch(page: Page, expected: readonly RegExp[] = []): string[] {
  const problems: string[] = [];
  const allowed = (url: string) => expected.some((pattern) => pattern.test(url));
  page.on('pageerror', (error) => problems.push(`page error: ${error.message}`));
  page.on('console', (message) => {
    if (message.type() !== 'error' || allowed(message.location().url)) return;
    problems.push(`console: ${message.text()} (${message.location().url})`);
  });
  page.on('response', (response) => {
    const url = response.url();
    if (url.includes('/api/') && response.status() >= 400 && !allowed(url)) problems.push(`API ${response.status()}: ${url}`);
  });
  page.on('requestfailed', (request) => {
    const error = request.failure()?.errorText ?? '';
    if (request.url().includes('/api/') && !error.includes('ERR_ABORTED') && !allowed(request.url())) problems.push(`API request failed (${error}): ${request.url()}`);
  });
  return problems;
}

async function settle(page: Page) {
  await page.waitForLoadState('networkidle', { timeout: 30_000 }).catch(() => undefined);
}

/** The production checks every screen gets: no WCAG 2.2 AA violations, no sideways scroll at desktop or phone width, and nothing recorded by watch. */
export async function checkScreen(page: Page, problems: readonly string[]) {
  await settle(page);
  expect.soft(await violationsOf(page), 'WCAG 2.2 AA violations').toEqual([]);
  for (const width of [1440, 390]) {
    await page.setViewportSize({ width, height: 900 });
    await settle(page);
    expect.soft(await page.evaluate(() => document.documentElement.scrollWidth), `page width at ${width}px`).toBeLessThanOrEqual(width);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  expect.soft(problems, 'console errors and failed API responses').toEqual([]);
}

/** A number shown in a table cell or text, read as a float. */
export function numberIn(text: string): number {
  return Number(text.replace(/[^0-9.\-−]/g, '').replace('−', '-'));
}
