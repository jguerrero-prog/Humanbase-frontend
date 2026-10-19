import AxeBuilder from '@axe-core/playwright';
import type { Page } from '@playwright/test';

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

/** WCAG 2.2 AA problems on the page once its animations settle; decorative illustrations are skipped. */
export async function violationsOf(page: Page): Promise<string[]> {
  await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
  return (await new AxeBuilder({ page }).exclude('[data-illustration]').withTags(axeTags).analyze()).violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`);
}
