export interface Token {
  $type: string;
  $value: unknown;
  $description?: string;
}

export interface TokenEntry {
  path: string[];
  cssVar: string;
  token: Token;
}

interface TokenGroup {
  [key: string]: TokenGroup | Token | string;
}

export const toCssVar = (path: string[]): string => `--${path.join('-')}`;

export const aliasPath = (alias: string): string[] => alias.slice(1, -1).split('.');

export function flattenTokens(group: TokenGroup, prefix: string[] = []): TokenEntry[] {
  return Object.entries(group).flatMap(([key, child]) => {
    if (key.startsWith('$') || typeof child === 'string') return [];
    const path = [...prefix, key];
    return '$value' in child ? [{ path, cssVar: toCssVar(path), token: child as Token }] : flattenTokens(child as TokenGroup, path);
  });
}
