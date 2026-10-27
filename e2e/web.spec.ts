import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';
import { apiOff } from './apiOff';
import { downloadFrom } from './downloads';
import { settleAnimations } from './violations';

const web = 'http://localhost:4173';
const pages = ['/', '/networks/?entrez=3553&entrez=7124&version=v1', '/jobs/', '/not-built-yet/'];

for (const path of pages) {
  test(`web ${path} has no WCAG 2.2 AA violations with the API off`, async ({ page }) => {
    const apiRequests = await apiOff(page);
    await page.goto(web + path);
    await expect(page.locator('h1')).toBeAttached();
    await settleAnimations(page);
    const { violations } = await new AxeBuilder({ page }).exclude('[data-illustration]').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
    expect(apiRequests).toEqual([]);
  });
}

const axeTags = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

test('a running job that finishes is announced on any page and listed on the Jobs page, with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', 'yes');
    localStorage.setItem('humanbase:jobs', JSON.stringify([{ id: '76aea8fe-8ec7-4698-a193-a186c7665edb', tool: 'Seqweaver', status: 'running', startedAt: '2026-10-20T21:02:00.000Z', link: '/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/', title: 'IL1B region variants', detail: 'Seqweaver, example.vcf' }]));
  });
  await page.goto(`${web}/jobs/`);
  const toast = page.getByRole('region', { name: 'Notifications' }).getByRole('listitem');
  await expect(toast).toHaveText(/Seqweaver finished: IL1B region variants/);
  await expect(page.getByRole('link', { name: 'View results: IL1B region variants' })).toBeVisible();
  // The toast fades in; axe reads colors mid-fade otherwise.
  await settleAnimations(page);
  const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('toasts from different screens stack in the one app region instead of overlapping, with the API off', async ({ page, context }) => {
  const apiRequests = await apiOff(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.addInitScript(() => {
    if (sessionStorage.getItem('seeded')) return;
    sessionStorage.setItem('seeded', 'yes');
    localStorage.setItem('humanbase:jobs', JSON.stringify([{ id: '76aea8fe-8ec7-4698-a193-a186c7665edb', tool: 'Seqweaver', status: 'running', startedAt: '2026-10-20T21:02:00.000Z', link: '/deepsea/jobs/76aea8fe-8ec7-4698-a193-a186c7665edb/', title: 'IL1B region variants', detail: 'Seqweaver, example.vcf' }]));
  });
  await page.goto(`${web}/jobs/`);
  const region = page.getByRole('region', { name: 'Notifications' });
  await expect(region.getByRole('listitem')).toHaveText([/Seqweaver finished: IL1B region variants/]);
  await page.getByRole('button', { name: 'More actions for IL1B region variants' }).click();
  await page.getByRole('menuitem', { name: 'Copy link' }).click();
  const toasts = region.getByRole('listitem');
  await expect(toasts).toHaveText([/Seqweaver finished: IL1B region variants/, /Link copied/]);
  // Just under the top bar, lined up with the Jobs link, and still there once the page scrolls under the bar.
  const placement = () =>
    page.evaluate(() => {
      const bar = document.querySelector('.top-bar')?.getBoundingClientRect();
      const jobs = document.querySelector('.jobs-menu')?.getBoundingClientRect();
      const toast = document.querySelector('.toast-list li')?.getBoundingClientRect();
      return bar && jobs && toast ? { gap: toast.top - bar.bottom, rightEdges: Math.abs(toast.right - jobs.right) } : null;
    });
  for (const scroll of [0, 400]) {
    await page.evaluate(async (y) => {
      window.scrollTo(0, y);
      await new Promise((done) => requestAnimationFrame(() => requestAnimationFrame(done)));
    }, scroll);
    const at = await placement();
    expect(at?.gap, `toast below the bar, scrolled ${scroll}px`).toBeGreaterThanOrEqual(0);
    expect(at?.gap, `toast close to the bar, scrolled ${scroll}px`).toBeLessThanOrEqual(16);
    expect(at?.rightEdges).toBeLessThanOrEqual(1);
  }
  await expect(page.locator('.toast-region')).toHaveCount(1);
  await settleAnimations(page);
  const [first, second] = await Promise.all([toasts.nth(0).boundingBox(), toasts.nth(1).boundingBox()]);
  expect(first && second && first.y + first.height <= second.y).toBe(true);
  expect(apiRequests).toEqual([]);
});

test('a toast posted from an open sheet on a phone shows above the sheet, clear of its actions, without taking focus, with the API off', async ({ page, context }) => {
  const apiRequests = await apiOff(page);
  await context.grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${web}/netwas/c66b3d05-2f49-4522-b910-1605609e4083/`);
  await page.getByRole('button', { name: 'Job actions' }).click();
  const sheet = page.getByRole('dialog', { name: 'Job actions' });
  const copy = sheet.getByRole('button', { name: 'Copy link' });
  await copy.click();
  const toast = sheet.getByRole('region', { name: 'Notifications' }).getByRole('listitem');
  await expect(toast).toHaveText('Link copied');
  await expect(copy).toBeFocused();
  await settleAnimations(page);
  const onTop = (element: Element) => {
    const box = element.getBoundingClientRect();
    return element.contains(document.elementFromPoint(box.x + box.width / 2, box.y + box.height / 2));
  };
  expect(await toast.evaluate(onTop)).toBe(true);
  // At the top of the screen, so the sheet's own actions stay uncovered.
  for (const name of ['Rename', 'Copy link', 'Download result file']) expect(await sheet.getByRole('button', { name }).evaluate(onTop)).toBe(true);
  await toast.getByRole('button', { name: 'Dismiss' }).click();
  await expect(toast).toHaveCount(0);
  await expect(sheet).toBeVisible();
  expect(apiRequests).toEqual([]);
});

test('the Networks result has no WCAG 2.2 AA violations once loaded, with the data types open', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&entrez=100188314&version=v1`);
  await expect(page.getByText(/Showing 15 of 52 genes: 2 query genes and 13 related genes, \d+ connections above 0\.48\./)).toBeVisible();
  await expect(page.getByText('AUTS12 was left out because it isn’t in any Humanbase network. This network uses IL1B and TNF.')).toBeVisible();
  await page.getByRole('button', { name: 'Data types' }).click();
  await expect(page.getByRole('checkbox', { name: 'Co-expression' })).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('Networks keeps filters and the selected gene in the URL, so a refresh shows the same view', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  const genes = page.getByRole('table', { name: /Genes functionally related/ });
  await genes.getByRole('button', { name: /^ICAM1/ }).click();
  await expect(page).toHaveURL(/gene=3383/);
  await page.getByRole('textbox', { name: 'Genes shown, exact value' }).fill('20');
  await page.getByRole('textbox', { name: 'Genes shown, exact value' }).press('Enter');
  await expect(page).toHaveURL(/shown=20/);
  await page.reload();
  await expect(page.getByText(/Showing 20 of 52 genes/)).toBeVisible();
  await expect(page.locator('.force-graph-node.is-selected')).toHaveAttribute('aria-label', 'ICAM1, related gene');
});

test('clicking a line in the Networks graph opens that connection, as on humanbase.io', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  const graph = page.locator('.force-graph');
  await expect(graph.locator('.force-graph-hit')).not.toHaveCount(0);
  await graph.scrollIntoViewIfNeeded();
  await settleAnimations(page);
  // The middle of a line, where nothing else is drawn, so the mouse lands on the line itself.
  const point = await graph.evaluate((svg) => {
    for (const hit of svg.querySelectorAll<SVGLineElement>('.force-graph-hit')) {
      const middle = new DOMPoint((hit.x1.baseVal.value + hit.x2.baseVal.value) / 2, (hit.y1.baseVal.value + hit.y2.baseVal.value) / 2).matrixTransform(hit.getScreenCTM() ?? undefined);
      if (document.elementFromPoint(middle.x, middle.y) === hit) return { x: middle.x, y: middle.y };
    }
    return null;
  });
  expect(point, 'a line whose middle can be clicked').not.toBeNull();
  const widthOfLine = () => graph.evaluate((svg, at) => {
    const hit = document.elementFromPoint(at.x, at.y);
    const line = hit?.previousElementSibling ?? svg.querySelector('line.is-selected');
    return line ? parseFloat(getComputedStyle(line).strokeWidth) : 0;
  }, point ?? { x: 0, y: 0 });
  const resting = await widthOfLine();
  await page.mouse.move(point?.x ?? 0, point?.y ?? 0);
  expect(await widthOfLine(), 'thicker under the pointer').toBeGreaterThan(resting);
  await page.mouse.click(point?.x ?? 0, point?.y ?? 0);
  await expect(page.getByRole('dialog', { name: / and / })).toContainText(/Connection in the .+ network/);
  await expect(page.getByRole('radio', { name: 'All networks' })).toBeVisible();
  // The clicked line stays thick once the pointer has moved on.
  await page.mouse.move(0, 0);
  const selected = graph.locator('.force-graph-links line.is-selected');
  await expect(selected).toHaveCount(1);
  expect(await selected.evaluate((line) => parseFloat(getComputedStyle(line).strokeWidth))).toBeGreaterThan(resting);
});

test('Networks explains a gene that is in no network', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/networks/?entrez=100188314&version=v1`);
  await expect(page.getByText('AUTS12 is not in this network')).toBeVisible();
});

test('Display settings open from a gear floating at the bottom left, not the footer', async ({ page }) => {
  await apiOff(page);
  await page.goto(web);
  const gear = page.getByRole('button', { name: 'Display settings' });
  await expect(gear).toHaveCount(1);
  await expect(page.locator('footer').getByRole('button', { name: 'Display settings' })).toHaveCount(0);
  const fromCorner = await gear.evaluate((button) => {
    const box = button.getBoundingClientRect();
    return { left: box.left, bottom: window.innerHeight - box.bottom };
  });
  expect(fromCorner.left).toBeLessThan(40);
  expect(fromCorner.bottom).toBeLessThan(40);
  await page.keyboard.press('End');
  await expect(gear).toBeInViewport();
  await gear.click();
  await expect(page.getByRole('dialog', { name: 'Display settings' })).toBeVisible();
});

test('Display settings saves reduced motion in this browser', async ({ page }) => {
  await apiOff(page);
  await page.goto(web);
  await page.getByRole('button', { name: 'Display settings' }).click();
  await page.getByRole('radio', { name: /Reduce motion/ }).check();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'reduce');
});

test('Theme 2 is the default; Display settings switches to Theme 1, keeps it in this browser, and passes WCAG 2.2 AA in it', async ({ page }) => {
  await apiOff(page);
  await page.goto(web);
  await expect(page.locator('html')).toHaveAttribute('data-theme', '2');
  const brand = () => page.locator('header').first().evaluate((bar) => getComputedStyle(bar).backgroundColor);
  const themeTwo = await brand();
  await page.getByRole('button', { name: 'Display settings' }).click();
  await expect(page.getByRole('radio', { name: /Theme 2/ })).toBeChecked();
  await page.getByRole('radio', { name: /Theme 1/ }).check();
  await page.getByRole('button', { name: 'Save' }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  expect(await brand()).not.toBe(themeTwo);
  await page.reload();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme');
  for (const path of ['/', '/networks/?entrez=3553&entrez=7124&version=v1']) {
    await page.goto(`${web}${path}`);
    await settleAnimations(page);
    const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    expect(violations.map((v) => `${path} ${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  }
});

test('the app shows no illustrations while the library is revised', async ({ page }) => {
  await apiOff(page);
  await page.goto(web);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  await expect(page.locator('.home-hero-art, [data-illustration]')).toHaveCount(0);
  for (const path of ['/about/', '/cite/', '/data-sources/']) {
    await page.goto(`${web}${path}`);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.locator('.article-band')).toHaveCount(0);
  }
  await page.goto(`${web}/about/`);
  await expect(page.locator('.article-drop-cap-plain')).toHaveCount(1);
});

test('the homepage with genes matched has no WCAG 2.2 AA violations', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(web);
  await page.getByRole('combobox', { name: 'Search genes' }).fill('AUTS12 IL1B TNF');
  await page.getByRole('combobox', { name: 'Search genes' }).press('Enter');
  await expect(page.getByRole('table', { name: 'How your genes matched' })).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

test('the Processes panel and both drawers have no WCAG 2.2 AA violations with the API off', async ({ page }) => {
  const apiRequests = await apiOff(page);
  const scan = async () => {
    await settleAnimations(page);
    const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  };
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await page.getByRole('tab', { name: /^Processes/ }).click();
  await expect(page.getByRole('table', { name: /Biological processes and diseases over-represented/ }).getByText(/Gene Ontology \(BP\), \d+ genes/).first()).toBeVisible();
  await scan();
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1&gene=3383`);
  await expect(page.getByRole('dialog', { name: 'ICAM1' }).getByRole('region', { name: 'Annotations' }).getByRole('rowheader').first()).toBeVisible();
  await scan();
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1&connection=6348-7185`);
  await expect(page.getByRole('dialog', { name: 'CCL3 and TRAF1' }).getByText('MSigDB CGP')).toBeVisible();
  await scan();
  expect(apiRequests).toEqual([]);
});

test('View as table and Expand have no WCAG 2.2 AA violations and survive a refresh', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await page.getByRole('button', { name: 'View as table' }).click();
  await page.getByRole('button', { name: 'Expand' }).click();
  await expect(page).toHaveURL(/display=table.*expand=1/);
  await page.reload();
  await expect(page.getByRole('table', { name: /Connections between the genes/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Expand' })).toHaveAttribute('aria-pressed', 'true');
  const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  expect(apiRequests).toEqual([]);
});

for (const [tab, ready] of [
  ['expression', 'Where IL1B and TNF are expressed'],
  ['processes', 'Biological processes linked to IL1B and TNF'],
  ['diseases', 'Diseases linked to IL1B and TNF'],
  ['process', 'Choose a biological process to see its network'],
] as const) {
  test(`the ${tab} tab has no WCAG 2.2 AA violations or horizontal scroll with the API off`, async ({ page }) => {
    const apiRequests = await apiOff(page);
    await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1&tab=${tab}`);
    await expect(page.getByText(ready).first()).toBeVisible();
    await page.waitForLoadState('networkidle');
    await settleAnimations(page);
    const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
    await page.setViewportSize({ width: 390, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);
    expect(apiRequests).toEqual([]);
  });
}

test('choosing a process keeps the Process network tab and draws that network', async ({ page }) => {
  await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1&tab=process`);
  await page.getByRole('button', { name: 'Choose a process' }).click();
  await page.getByRole('option', { name: 'acute inflammatory response' }).click();
  await expect(page).toHaveURL(/process=acute-inflammatory-response/);
  await expect(page).toHaveURL(/tab=process/);
  await expect(page.getByRole('table', { name: /in the acute inflammatory response network/ })).toBeVisible();
});

test('Edit genes adds a gene without starting over and has no WCAG 2.2 AA violations', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await page.getByRole('button', { name: 'Edit genes' }).click();
  const dialog = page.getByRole('dialog', { name: 'Edit genes' });
  await expect(dialog.getByText('2 matched: IL1B, TNF')).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  await dialog.getByRole('textbox', { name: 'Genes' }).fill('IL1B\nTNF\nICAM1');
  await expect(dialog.getByText('3 matched: IL1B, TNF, ICAM1')).toBeVisible();
  await page.getByRole('button', { name: 'Show network for 3 genes' }).click();
  await expect(page).toHaveURL(/entrez=3383/);
  await expect(page).toHaveURL(/version=v1/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(/ICAM1/);
  expect(apiRequests).toEqual([]);
});

test('Compare adds a second network side by side, keeps it in the URL and has no WCAG 2.2 AA violations', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await page.getByRole('button', { name: 'Compare' }).click();
  const dialog = page.getByRole('dialog', { name: 'Add a network to compare' });
  await dialog.getByRole('combobox', { name: 'Tissue' }).click();
  await dialog.getByRole('option', { name: 'Mononuclear phagocyte' }).click();
  let scan = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(scan.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  await dialog.getByRole('button', { name: 'Add network' }).click();
  await expect(page).toHaveURL(/compare=mononuclear-phagocyte/);
  const compared = page.getByRole('region', { name: 'mononuclear phagocyte network', exact: true });
  await expect(compared.getByText(/connections above 0\.51/)).toBeVisible();
  await expect(page.getByRole('region', { name: 'global network', exact: true }).getByText(/connections above 0\.48/)).toBeVisible();
  scan = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(scan.violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  await compared.getByRole('slider', { name: 'Genes shown', exact: true }).press('ArrowRight');
  await expect(page).toHaveURL(/compare_shown=16/);
  await page.reload();
  await expect(page.getByRole('region', { name: 'mononuclear phagocyte network', exact: true }).getByText(/Showing 16 of 52 genes/)).toBeVisible();
  await page.getByRole('button', { name: 'Remove the global network' }).click();
  await expect(page).toHaveURL(/tissue=mononuclear-phagocyte/);
  await expect(page).not.toHaveURL(/compare=/);
  expect(apiRequests).toEqual([]);
});

test('starring a tissue rings its genes, keeps the star in the URL and has no WCAG 2.2 AA violations', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await page.getByRole('tab', { name: /Tissues/ }).click();
  await page.getByRole('button', { name: 'Highlight peripheral blood genes in the network' }).click();
  await expect(page).toHaveURL(/star=BTO%3A0000553|star=BTO:0000553/);
  const ringed = page.locator('.force-graph-node').filter({ has: page.locator('.force-graph-star') });
  await expect(ringed).toHaveCount(3);
  expect((await ringed.evaluateAll((nodes) => nodes.map((node) => node.getAttribute('aria-label')?.split(',')[0]))).sort()).toEqual(['CCL20', 'RELB', 'TNFRSF1B']);
  await page.getByRole('button', { name: 'Starred sets, 1' }).click();
  await expect(page.getByRole('menuitem', { name: /Remove peripheral blood/ })).toBeVisible();
  await settleAnimations(page);
  const { violations } = await new AxeBuilder({ page }).withTags(axeTags).analyze();
  expect(violations.map((v) => `${v.id}: ${v.help} (${v.nodes.map((n) => n.target.join(' ')).join(', ')})`)).toEqual([]);
  await page.keyboard.press('Escape');
  await page.reload();
  await expect(page.locator('.force-graph-node').filter({ has: page.locator('.force-graph-star') })).toHaveCount(3);
  expect(apiRequests).toEqual([]);
});

test('the network Download menu saves the graph and the visible or entire network, named as the live site names them', async ({ page }) => {
  const apiRequests = await apiOff(page);
  await page.goto(`${web}/networks/?entrez=3553&entrez=7124&version=v1`);
  await expect(page.getByText(/Showing \d+ of \d+ genes/)).toBeVisible();
  const png = await downloadFrom(page, 'Download network', 'Download as PNG');
  expect([png.name, png.bytes.subarray(1, 4).toString()]).toEqual(['global.png', 'PNG']);
  const svg = await downloadFrom(page, 'Download network', 'Download as SVG');
  expect(svg.name).toBe('global.svg');
  expect(svg.bytes.toString()).toContain('<svg');
  const lines = async (item: string) => {
    const file = await downloadFrom(page, 'Download network', item);
    expect(file.name).toBe('global.txt');
    return file.bytes.toString().split('\n');
  };
  const visible = await lines('Download visible network as text');
  const entire = await lines('Download entire network as text');
  expect([visible[0], visible[1]]).toEqual(['GENE1,GENE2,WEIGHT', 'CCL3,CCL4,0.9924881536514399']);
  expect([visible.length, entire.length]).toEqual([91, 1328]);
  expect(apiRequests).toEqual([]);
});
