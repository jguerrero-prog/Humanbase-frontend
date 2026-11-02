// The color themes Display settings offers. Theme 1 is the base in primitives.tokens.json; every other theme names a file in src/
// holding only the primitives it changes. Add a theme here and run pnpm tokens; see "Adding a theme" in README.md.
export interface Theme {
  value: string;
  label: string;
  description: string;
  file?: string;
}

export const themes: readonly Theme[] = [
  { value: '1', label: 'Theme 1', description: 'Emerald and yellow' },
  { value: '2', label: 'Theme 2', description: 'Blue and gold', file: 'theme-2.tokens.json' },
];

/** The theme people see until they choose another. */
export const defaultTheme = '2';
