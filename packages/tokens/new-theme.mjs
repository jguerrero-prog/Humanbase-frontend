// Creates a theme from four brand colors: draws each scale around its color, shaped like Theme 2's, writes
// src/theme-N.tokens.json, adds it to themes.ts and rebuilds tokens.css. See "Adding a theme" in README.md.
// Usage: pnpm theme:new --description "Teal and coral" --primary #0F766E --secondary #F97362 --accent #A7D8DE --ink #18181B
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { parseArgs } from 'node:util';
import { contrastRatio } from './color.ts';
import { drawScale } from './scale.ts';
import { themes } from './themes.ts';

/** Where each brand color sits on its scale, as in Theme 2; ink is the darkest grey. */
const anchors = { primary: '600', secondary: '500', accent: '300', grey: '900' };

const { values } = parseArgs({ options: { description: { type: 'string' }, primary: { type: 'string' }, secondary: { type: 'string' }, accent: { type: 'string' }, ink: { type: 'string' } } });
const brand = { primary: values.primary, secondary: values.secondary, accent: values.accent, grey: values.ink };
const missing = Object.entries({ description: values.description, ...brand }).filter(([, value]) => !value).map(([name]) => (name === 'grey' ? 'ink' : name));
const invalid = Object.values(brand).filter((hex) => hex && !/^#[0-9a-f]{6}$/i.test(hex));
if (missing.length || invalid.length) {
  console.error(missing.length ? `Missing --${missing.join(', --')}.` : `Colors must be six-digit hex, such as #0F766E: ${invalid.join(', ')}.`);
  process.exit(1);
}

const src = new URL('./src/', import.meta.url);
const themeTwo = JSON.parse(readFileSync(new URL('theme-2.tokens.json', src), 'utf8'));
const hexes = (group) => Object.fromEntries(Object.entries(group).map(([step, token]) => [step, token.$value.hex]));
const color = (hex, alpha) => {
  const components = [1, 3, 5].map((start) => Math.round((parseInt(hex.slice(start, start + 2), 16) / 255) * 1e4) / 1e4);
  return { $type: 'color', $value: { colorSpace: 'srgb', components, hex, ...(alpha === undefined ? {} : { alpha }) } };
};
const tokens = (scale) => Object.fromEntries(Object.entries(scale).map(([step, hex]) => [step, color(hex)]));

const scales = Object.fromEntries(Object.entries(anchors).map(([name, anchor]) => [name, drawScale(brand[name], anchor, hexes(themeTwo.color[name]))]));
const value = String(Math.max(...themes.map((theme) => Number(theme.value) || 0)) + 1);
const file = `theme-${value}.tokens.json`;
const primary600 = scales.primary['600'];
const ghost = (name) => color(primary600, themeTwo.action[name].$value.alpha);

const theme = {
  $description: `Theme ${value}: ${values.description}. Drawn by new-theme.ts from four brand colors, primary ${brand.primary}, secondary ${brand.secondary}, accent ${brand.accent} and ink ${brand.grey}, each placed at its Theme 2 step with the scale shaped like Theme 2's. Status colors follow Theme 2; info follows primary.`,
  color: {
    primary: tokens(scales.primary),
    secondary: tokens(scales.secondary),
    accent: tokens(scales.accent),
    grey: tokens(scales.grey),
    error: themeTwo.color.error,
    warning: themeTwo.color.warning,
    success: themeTwo.color.success,
    info: Object.fromEntries(Object.keys(themeTwo.color.info).map((step) => [step, { $type: 'color', $value: `{color.primary.${step}}` }])),
  },
  surface: themeTwo.surface,
  text: themeTwo.text,
  action: { 'ghost-hover': ghost('ghost-hover'), 'ghost-pressed': ghost('ghost-pressed'), 'ghost-selected': ghost('ghost-selected') },
  button: themeTwo.button,
  syntax: themeTwo.syntax,
};
writeFileSync(new URL(file, src), JSON.stringify(theme, null, 2) + '\n');

const list = new URL('./themes.ts', import.meta.url);
const entry = `  { value: '${value}', label: 'Theme ${value}', description: '${values.description.replace(/'/g, "\\'")}', file: '${file}' },\n];`;
writeFileSync(list, readFileSync(list, 'utf8').replace(/\n\];/, `\n${entry}`));
execFileSync('node', ['build.mjs'], { cwd: new URL('.', import.meta.url), stdio: 'inherit' });

// The pairs the interface leans on most; pnpm test:e2e checks the rendered pages in full.
const white = '#FFFFFF', cream = '#FFFBF9';
const checks = [
  ['White text on primary buttons (primary 600)', white, primary600, 4.5],
  ['Links on white (primary 700)', scales.primary['700'], white, 4.5],
  ['Links on cream (primary 700)', scales.primary['700'], cream, 4.5],
  ['White text on the top bar (primary 700)', white, scales.primary['700'], 4.5],
  ['Secondary current-page mark on the top bar', scales.secondary['500'], scales.primary['700'], 3],
  ['Ink text on white', scales.grey['900'], white, 4.5],
];
console.log(`\nWrote src/${file} and added Theme ${value} to themes.ts. Contrast:`);
for (const [label, fg, bg, needs] of checks) {
  const ratio = contrastRatio(fg, bg);
  console.log(`  ${ratio >= needs ? 'pass' : 'FAIL'}  ${ratio.toFixed(2)}:1 (needs ${needs}:1)  ${label}`);
}
console.log('\nNext: pnpm dev:web to see it in Display settings, and pnpm test:e2e to scan it.');
