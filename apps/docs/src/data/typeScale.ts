import { flattenTokens } from '@humanbase/tokens/catalog';
import typography from '@humanbase/tokens/src/typography.tokens.json';

interface TypeValue {
  fontFamily: string[];
  fontSize: { value: number };
  fontWeight: number;
  lineHeight: number;
  letterSpacing?: { value: number };
}

const weightNames: Record<number, string> = { 400: 'Regular', 500: 'Medium', 600: 'SemiBold', 700: 'Bold' };

const names: Record<string, [name: string, use: string]> = {
  display: ['Display', 'Hero title in the green header, once per page'],
  h1: ['Heading 1', 'Page title under the header'],
  h2: ['Heading 2', 'Section titles'],
  h3: ['Heading 3', 'Card and panel titles'],
  h4: ['Heading 4', 'Small headings, table group titles'],
  lead: ['Lead', 'Introductions, the first paragraph of a page'],
  'body-lg': ['Body large', 'Help text, descriptions'],
  body: ['Body', 'Default text, table cells, form inputs'],
  'body-sm': ['Body small', 'Secondary text, dense tables'],
  caption: ['Caption', 'Figure captions, footnotes. Never for essential text'],
  label: ['Label', 'Buttons, form labels, tabs'],
  'label-sm': ['Label small', 'Small buttons, table headers, chips'],
  eyebrow: ['Eyebrow', 'Small uppercase labels above a heading. Two to three words'],
  code: ['Code', 'Code blocks, API examples, IDs and sequences in tables'],
  'code-sm': ['Code small', 'IDs and positions in dense tables and tooltips'],
};

export class TypeStyle {
  readonly key: string;
  readonly cssVar: string;
  readonly token: string;
  readonly family: string;
  readonly weight: number;
  readonly size: number;
  readonly lineHeight: number;
  readonly tracking: number;

  constructor(path: string[], cssVar: string, value: TypeValue) {
    this.key = path.at(-1) ?? '';
    this.cssVar = cssVar;
    this.token = path.join('.');
    this.family = value.fontFamily[0] ?? '';
    this.weight = value.fontWeight;
    this.size = value.fontSize.value;
    this.lineHeight = value.lineHeight;
    this.tracking = value.letterSpacing?.value ?? 0;
  }

  get name() {
    return names[this.key]?.[0] ?? this.key;
  }

  get use() {
    return names[this.key]?.[1] ?? '';
  }

  get weightName() {
    return `${this.weight} ${weightNames[this.weight] ?? ''}`.trim();
  }

  get lineHeightPx() {
    return Math.round(this.size * this.lineHeight);
  }

  get trackingPercent() {
    return this.tracking === 0 ? '0' : `${Math.round(this.tracking * 100)}%`;
  }

  get style() {
    return `font: var(${this.cssVar}); letter-spacing: var(${this.cssVar}-tracking)`;
  }
}

export const typeScale = flattenTokens(typography).map(({ path, cssVar, token }) => new TypeStyle(path, cssVar, token.$value as TypeValue));
