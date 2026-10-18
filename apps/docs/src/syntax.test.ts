import { describe, expect, it } from 'vitest';
import { highlighter } from './syntax';

const roles = (lines: Awaited<ReturnType<typeof highlighter.lines>>) => lines.flat().filter((token) => token.text.trim()).map((token) => `${token.role}:${token.text.trim()}`);

describe('SyntaxHighlighter', () => {
  it('marks commands, methods, flags, strings and path parameters in a request', async () => {
    const tokens = roles(await highlighter.lines('curl -X GET "https://humanbase.io/api/networks/{slug}/"', 'bash'));
    expect(tokens).toEqual(['command:curl', 'flag:-X', 'command:GET', 'string:"https://humanbase.io/api/networks/', 'param:{slug}', 'string:/"']);
  });

  it('marks keys and schema types in a response shape', async () => {
    const tokens = roles(await highlighter.lines('{\n  "job_id": string (uuid)\n}', 'json'));
    expect(tokens).toContain('key:"job_id"');
    expect(tokens).toContain('type:string');
    expect(tokens).toContain('type:uuid');
  });

  it('leaves plain text formats as text', async () => {
    const lines = await highlighter.lines('gene\tp\nIL1B\t0.00012', 'text');
    expect(lines.flat().every((token) => token.role === 'text')).toBe(true);
  });
});
