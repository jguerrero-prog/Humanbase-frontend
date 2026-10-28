import { ColorCatalog } from '@humanbase/tokens/color';
import primitives from '@humanbase/tokens/src/primitives.tokens.json';
import semantic from '@humanbase/tokens/src/semantic.tokens.json';

/** Theme 1 colors, which the design system site shows, so docs prose quotes the tokens instead of typed values. */
export const colors = new ColorCatalog(primitives, semantic);

export const hex = (path: string): string => colors.hex(path);

/** The WCAG contrast ratio of two tokens, written as "4.50:1". */
export const ratio = (foreground: string, background: string, digits = 2): string => `${colors.contrast(foreground, background).toFixed(digits)}:1`;
