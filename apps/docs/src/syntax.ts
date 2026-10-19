import type { CodeLine, CodeToken, SyntaxRole } from '@humanbase/ui';
import { codeToTokens, createCssVariablesTheme, type BundledLanguage } from 'shiki';

const prefix = '--shiki-';
const theme = createCssVariablesTheme({ name: 'humanbase-syntax', variablePrefix: prefix, variableDefaults: {} });

const roleByVariable: Record<string, SyntaxRole> = {
  'token-function': 'command',
  'token-keyword': 'command',
  'token-string': 'string',
  'token-string-expression': 'string',
  'token-link': 'string',
  'token-constant': 'type',
  'token-parameter': 'type',
  'token-comment': 'comment',
};

const httpMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const pathParameter = /(\{\w+\})/;
const schemaTypes = /\b(string|integer|number|boolean|null|uuid|uri)\b/;

// Turns Shiki's grammar scopes into the five-color roles from the Code block page.
export class SyntaxHighlighter {
  async lines(code: string, lang: BundledLanguage | 'text'): Promise<CodeLine[]> {
    const { tokens } = await codeToTokens(code, { lang, theme });
    return tokens.map((line) => this.merge(line.flatMap(({ content, color }) => this.refine(content, this.role(color), lang))));
  }

  private role(color: string | undefined): SyntaxRole {
    const variable = color?.match(/var\(--shiki-([\w-]+)\)/)?.[1];
    return (variable && roleByVariable[variable]) || 'text';
  }

  private refine(text: string, role: SyntaxRole, lang: string): CodeToken[] {
    if (role === 'command' && !/\w/.test(text)) return [{ text, role: 'text' }];
    if (role === 'command' && text.startsWith('"')) return [{ text, role: 'key' }];
    if (lang === 'bash' && /^-{1,2}\w/.test(text)) return [{ text, role: 'flag' }];
    if (lang === 'bash' && httpMethods.has(text)) return [{ text, role: 'command' }];
    if (role === 'string') return this.split(text, pathParameter, 'string', 'param');
    if (role === 'text' && lang === 'json') return this.split(text, schemaTypes, 'text', 'type');
    return [{ text, role }];
  }

  private split(text: string, pattern: RegExp, base: SyntaxRole, match: SyntaxRole): CodeToken[] {
    const global = new RegExp(pattern.source, 'g');
    return text
      .split(global)
      .filter(Boolean)
      .map((part) => ({ text: part, role: new RegExp(`^${pattern.source}$`).test(part) ? match : base }));
  }

  private merge(tokens: CodeToken[]): CodeToken[] {
    return tokens.reduce<CodeToken[]>((merged, token) => {
      const last = merged.at(-1);
      if (last && last.role === token.role) merged[merged.length - 1] = { text: last.text + token.text, role: token.role };
      else merged.push(token);
      return merged;
    }, []);
  }
}

export const highlighter = new SyntaxHighlighter();
