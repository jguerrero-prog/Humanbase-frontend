import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  'http://localhost:4173/',
  'http://localhost:4322/',
  'http://localhost:4322/tokens/color/',
  'http://localhost:4322/tokens/typography/',
  'http://localhost:4322/components/buttons/',
  'http://localhost:4322/foundations/typography/',
  'http://localhost:4322/foundations/color-palette/',
  'http://localhost:4322/foundations/iconography/',
  'http://localhost:4322/foundations/elevation-and-borders/',
  'http://localhost:4322/components/text-inputs-and-search/',
  'http://localhost:4322/components/dropdowns-and-selects/',
  'http://localhost:4322/components/sliders/',
  'http://localhost:4322/components/tabs-and-segmented-controls/',
  'http://localhost:4322/guidelines/data-visualization/',
  'http://localhost:4322/foundations/corner-radius/',
  'http://localhost:4322/components/alerts-and-toasts/',
  'http://localhost:4322/foundations/spacing-and-layout-grid/',
  'http://localhost:4322/components/accordions/',
  'http://localhost:4322/components/tables/',
  'http://localhost:4322/components/modals-and-drawers/',
  'http://localhost:4322/components/pagination/',
  'http://localhost:4322/foundations/motion/',
  'http://localhost:4322/components/navigation-and-breadcrumbs/',
  'http://localhost:4322/components/tooltips/',
  'http://localhost:4322/ui-library/what-exists-today/',
  'http://localhost:4322/components/badges-and-tags/',
];

for (const url of pages) {
  test(`${url} has no WCAG 2.2 AA violations`, async ({ page }) => {
    await page.goto(url);
    await expect(page.locator('h1')).toBeVisible();
    // Reduced motion keeps fades, so let finite animations settle before measuring contrast.
    await page.evaluate(() => Promise.all(document.getAnimations().filter((a) => a.effect?.getTiming().iterations !== Infinity).map((a) => a.finished)));
    // Illustrations draw text faded on purpose (WCAG 1.4.3 exempts incidental text), so they are skipped.
    const { violations } = await new AxeBuilder({ page }).exclude('[data-illustration]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(" ")).join(", ")})`)).toEqual([]);
  });
}
