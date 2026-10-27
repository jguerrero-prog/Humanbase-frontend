import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { docsRoutes } from '../apps/docs/src/pageRoutes.ts';
import { settleAnimations } from './violations';

const pages = docsRoutes().map((path) => `http://localhost:4322${path}`);

for (const url of pages) {
  test(`${url} has no WCAG 2.2 AA violations`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('h1')).toBeVisible();
    // Reduced motion keeps fades, so let finite animations settle before measuring contrast.
    await settleAnimations(page);
    // Illustrations draw text faded on purpose (WCAG 1.4.3 exempts incidental text), so they are skipped.
    const { violations } = await new AxeBuilder({ page }).exclude('[data-illustration]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
  });
}
