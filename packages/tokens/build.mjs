import { readFileSync, writeFileSync } from 'node:fs';
import { aliasPath, flattenTokens, toCssVar } from './catalog.ts';

const sources = [
  ['primitives.tokens.json', []],
  ['semantic.tokens.json', []],
  ['typography.tokens.json', []],
  ['effects.tokens.json', ['shadow']],
];

const toHex = (color) => color.hex + (color.alpha === undefined ? '' : Math.round(color.alpha * 255).toString(16).padStart(2, '0').toUpperCase());
const toLength = ({ value, unit }) => (value === 0 ? '0' : `${value}${unit}`);
const toShadow = (layers) => layers.map((l) => [l.offsetX, l.offsetY, l.blur, l.spread].map(toLength).join(' ') + ` ${toHex(l.color)}`).join(', ');
const toFontFamily = (families) => families.map((f) => (f.includes(' ') ? `"${f}"` : f)).join(', ');

function toDeclarations({ cssVar, token: { $type, $value } }) {
  if (typeof $value === 'string') return [[cssVar, `var(${toCssVar(aliasPath($value))})`]];
  if ($type === 'color') return [[cssVar, toHex($value)]];
  if ($type === 'dimension') return [[cssVar, toLength($value)]];
  if ($type === 'shadow') return [[cssVar, toShadow($value)]];
  if ($type === 'fontFamily') return [[cssVar, toFontFamily($value)]];
  if ($type === 'typography') {
    const font = `${$value.fontWeight} ${toLength($value.fontSize)}/${$value.lineHeight} ${toFontFamily($value.fontFamily)}`;
    return [[cssVar, font], [`${cssVar}-tracking`, toLength($value.letterSpacing)]];
  }
  throw new Error(`Unsupported token type "${$type}" at ${cssVar}`);
}

const declarations = sources.flatMap(([file, prefix]) =>
  flattenTokens(JSON.parse(readFileSync(new URL(`./src/${file}`, import.meta.url), 'utf8')), prefix).flatMap(toDeclarations),
);

const css = [
  '/* Generated from src/*.tokens.json by build.mjs. Edit the token files, then run pnpm tokens. */',
  ':root {',
  ...declarations.map(([name, value]) => `  ${name}: ${value};`),
  '}',
  '',
].join('\n');

writeFileSync(new URL('./tokens.css', import.meta.url), css);
console.log(`Wrote ${declarations.length} custom properties to tokens.css`);
