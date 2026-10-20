export default {
  extends: ['stylelint-config-standard'],
  ignoreFiles: ['**/dist/**', '**/.astro/**', '**/node_modules/**', 'packages/tokens/tokens.css', 'packages/genome/vendor/**', '.claude/**'],
  rules: {
    'color-no-hex': [true, { message: 'Use a token such as var(--text-default) instead of a hex color.' }],
    'color-named': ['never', { message: 'Use a token instead of a named color.' }],
    'declaration-no-important': true,
    'selector-class-pattern': ['^[a-z][a-z0-9]*(-[a-z0-9]+)*$', { message: 'Use kebab-case class names.' }],
    'selector-id-pattern': null,
  },
  overrides: [{ files: ['packages/ui/src/root.css'], rules: { 'declaration-no-important': null } }],
};
