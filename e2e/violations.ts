import type { Page } from '@playwright/test';
import { createRequire } from 'node:module';

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
// axe-core comes with @axe-core/playwright; reading it from there keeps one copy and one version.
const axeSource: string = (createRequire(createRequire(import.meta.url).resolve('@axe-core/playwright'))('axe-core') as { source: string }).source;

interface AxeWindow {
  axe?: { run: (context: unknown, options: unknown) => Promise<{ violations: { id: string; help: string; nodes: { target: string[] }[] }[] }> };
}

/** Waits for the page's timed animations to end; a cancelled one counts as ended, and looping or scroll-linked ones never end. */
export async function settleAnimations(page: Page): Promise<void> {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.timeline === document.timeline && a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished.catch(() => undefined))));
}

/** WCAG 2.2 AA problems on the page once its animations settle; decorative illustrations, and any parts named in skip, are skipped. */
export async function violationsOf(page: Page, skip: readonly string[] = []): Promise<string[]> {
  await settleAnimations(page);
  if (!(await page.evaluate(() => Boolean((window as AxeWindow).axe)))) await page.addScriptTag({ content: axeSource });
  // Axe runs in the page and sends back only the violations: on a 23,000-cell heatmap its passing nodes alone exhaust the runner's memory.
  return page.evaluate(async ([tags, skipped]) => {
    const axe = (window as AxeWindow).axe;
    if (!axe) throw new Error('axe-core did not load');
    const result = await axe.run({ exclude: [['[data-illustration]'], ...skipped.map((selector) => [selector])] }, { runOnly: { type: 'tag', values: tags } });
    return result.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
  }, [axeTags, skip] as const);
}
