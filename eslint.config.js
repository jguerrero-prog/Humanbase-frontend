import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// In .astro files the Astro versions of the jsx-a11y rules run; the React ones misread attributes such as `for`.
const astroA11y = {
  ...Object.fromEntries(Object.keys(jsxA11y.flatConfigs.strict.rules).map((rule) => [rule, 'off'])),
  ...astro.configs['jsx-a11y-strict'].at(-1).rules,
};
const unsafeHtml = 'Build DOM with React or createElement and textContent; raw HTML strings are not allowed.';

export default tseslint.config(
  { ignores: ['**/dist/', '**/.astro/', '**/node_modules/', 'packages/data/src/schema.d.ts', 'playwright-report/', 'packages/genome/vendor/', '.claude/', '.wrangler/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  jsxA11y.flatConfigs.strict,
  reactHooks.configs.flat.recommended,
  ...astro.configs.recommended,
  {
    languageOptions: { globals: { ...globals.browser, ...globals.node } },
    rules: {
      'no-restricted-syntax': [
        'error',
        { selector: "JSXAttribute[name.name='dangerouslySetInnerHTML']", message: unsafeHtml },
        { selector: "AssignmentExpression[left.property.name=/^(innerHTML|outerHTML)$/]", message: unsafeHtml },
        { selector: "CallExpression[callee.property.name='insertAdjacentHTML']", message: unsafeHtml },
        { selector: "CallExpression[callee.object.name='document'][callee.property.name=/^(write|writeln)$/]", message: unsafeHtml },
      ],
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['**/*.astro'],
    rules: {
      ...astroA11y,
      // Scrollable regions take focus so keyboard users can scroll them.
      'astro/jsx-a11y/no-noninteractive-tabindex': ['error', { roles: ['region'] }],
      'astro/no-set-html-directive': 'error',
      '@typescript-eslint/no-unused-vars': ['error', { ignoreRestSiblings: true }],
    },
  },
  {
    files: ['**/*.test.{ts,tsx}', 'e2e/**', 'e2e-live/**'],
    languageOptions: { globals: globals.vitest },
  },
  {
    files: ['scripts/**', '**/build.mjs'],
    rules: { 'no-console': 'off' },
  },
);
