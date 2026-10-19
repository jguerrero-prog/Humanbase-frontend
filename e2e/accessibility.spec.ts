import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

const pages = [
  'http://localhost:4173/',
  'http://localhost:4322/',
  'http://localhost:4322/tokens/color/',
  'http://localhost:4322/tokens/typography/',
  'http://localhost:4322/tokens/spacing/',
  'http://localhost:4322/tokens/radius-and-elevation/',
  'http://localhost:4322/tokens/states/',
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
  'http://localhost:4322/foundations/accessibility/',
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
  'http://localhost:4322/ui-library/job-submission/',
  'http://localhost:4322/ui-library/job-status-and-queue/',
  'http://localhost:4322/ui-library/heatmaps-and-score-legends/',
  'http://localhost:4322/components/badges-and-tags/',
  'http://localhost:4322/components/code-block/',
  'http://localhost:4322/guidelines/scientific-notation-and-units/',
  'http://localhost:4322/guidelines/errors-and-validation/',
  'http://localhost:4322/guidelines/voice-and-content/',
  'http://localhost:4322/guidelines/empty-states/',
  'http://localhost:4322/guidelines/loading-and-job-status/',
  'http://localhost:4322/ui-library/gene-search-and-matching/',
  'http://localhost:4322/ui-library/genome-browser/',
  'http://localhost:4322/ui-library/results-layout/',
  'http://localhost:4322/ui-library/netwas-results/',
  'http://localhost:4322/ui-library/variant-effect-results/',
  'http://localhost:4322/ui-library/asd-browser/',
  'http://localhost:4322/resources/figma-library/',
  'http://localhost:4322/resources/changelog/',
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
