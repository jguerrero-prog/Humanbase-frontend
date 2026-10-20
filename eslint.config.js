import js from '@eslint/js';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const unsafeHtml = 'Build DOM with React or createElement and textContent; raw HTML strings are not allowed.';

export default tseslint.config(
  { ignores: ['**/dist/', '**/.astro/', '**/node_modules/', 'packages/data/src/schema.d.ts', 'playwright-report/'] },
  js.configs.recommended,
  ...tseslint.configs.strict,
  jsxA11y.flatConfigs.strict,
  reactHooks.configs.flat.recommended,
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
    files: ['**/*.test.{ts,tsx}', 'e2e/**', 'e2e-live/**'],
    languageOptions: { globals: globals.vitest },
  },
  {
    files: ['scripts/**', '**/build.mjs'],
    rules: { 'no-console': 'off' },
  },
);
