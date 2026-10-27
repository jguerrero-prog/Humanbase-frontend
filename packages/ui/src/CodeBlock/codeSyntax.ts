import type { CodeLine, CodeToken, SyntaxRole } from './CodeBlock';

/** The languages the app colors itself; the docs site colors every other language with Shiki at build time. */
export type CodeLanguage = 'json' | 'curl';

const pathParameter = /(\{\w+\})/;
const httpMethods = new Set(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']);
const jsonPart = /("(?:[^"\\]|\\.)*")(\s*:)?|(-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?)|\b(true|false|null)\b/g;
const curlPart = /'(?:[^'\\]|\\.)*'|"(?:[^"\\]|\\.)*"|\s+|[^\s'"]+/g;

/** A string's text, with each path parameter such as {entrez} in its own color. */
function stringTokens(text: string): CodeToken[] {
  return text
    .split(new RegExp(pathParameter.source, 'g'))
    .filter(Boolean)
    .map((part) => ({ text: part, role: /^\{\w+\}$/.test(part) ? 'param' : 'string' }));
}

function jsonLine(line: string): CodeToken[] {
  const tokens: CodeToken[] = [];
  let at = 0;
  for (const match of line.matchAll(jsonPart)) {
    if (match.index > at) tokens.push({ text: line.slice(at, match.index), role: 'text' });
    const [whole, string, colon, number, literal] = match;
    if (string && colon) tokens.push({ text: string, role: 'key' }, { text: colon, role: 'text' });
    else if (string) tokens.push(...stringTokens(string));
    else tokens.push({ text: number ?? literal ?? whole, role: 'type' });
    at = match.index + whole.length;
  }
  if (at < line.length) tokens.push({ text: line.slice(at), role: 'text' });
  return tokens;
}

function curlRole(part: string): SyntaxRole {
  if (part === 'curl' || httpMethods.has(part)) return 'command';
  if (/^-{1,2}[A-Za-z]/.test(part)) return 'flag';
  return 'text';
}

function curlLine(line: string): CodeToken[] {
  return [...line.matchAll(curlPart)].flatMap(([part]) => (part.startsWith("'") || part.startsWith('"') ? stringTokens(part) : [{ text: part, role: curlRole(part) }]));
}

/** Neighbouring tokens of one color become one, so the markup stays small. */
function merged(tokens: CodeToken[]): CodeLine {
  return tokens.reduce<CodeToken[]>((line, token) => {
    const last = line.at(-1);
    if (last && last.role === token.role) line[line.length - 1] = { text: last.text + token.text, role: token.role };
    else line.push(token);
    return line;
  }, []);
}

/** Colors JSON and curl commands with the Code block page's roles: keys, strings, values, commands, flags and path parameters. */
export function codeLines(code: string, language: CodeLanguage): CodeLine[] {
  const line = language === 'json' ? jsonLine : curlLine;
  return code.split('\n').map((text) => merged(line(text)));
}
