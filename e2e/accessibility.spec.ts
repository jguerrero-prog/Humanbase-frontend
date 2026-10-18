import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  'http://localhost:4173/',
  'http://localhost:4322/',
  'http://localhost:4322/tokens/color/',
  'http://localhost:4322/tokens/typography/',
  'http://localhost:4322/components/buttons/',
  'http://localhost:4322/foundations/iconography/',
];

for (const url of pages) {
  test(`${url} has no WCAG 2.2 AA violations`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('h1')).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
  });
}
