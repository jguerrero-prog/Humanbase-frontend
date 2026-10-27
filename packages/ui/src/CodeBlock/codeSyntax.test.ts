import { codeLines } from './codeSyntax';

describe('codeLines', () => {
  it('colors JSON keys, strings, numbers and literals, and path parameters in strings', () => {
    const [line] = codeLines('  "url": "/api/genes/{entrez}/", "entrez": 3553, "ok": true, "none": null', 'json');
    expect(line).toEqual([
      { text: '  ', role: 'text' },
      { text: '"url"', role: 'key' },
      { text: ': ', role: 'text' },
      { text: '"/api/genes/', role: 'string' },
      { text: '{entrez}', role: 'param' },
      { text: '/"', role: 'string' },
      { text: ', ', role: 'text' },
      { text: '"entrez"', role: 'key' },
      { text: ': ', role: 'text' },
      { text: '3553', role: 'type' },
      { text: ', ', role: 'text' },
      { text: '"ok"', role: 'key' },
      { text: ': ', role: 'text' },
      { text: 'true', role: 'type' },
      { text: ', ', role: 'text' },
      { text: '"none"', role: 'key' },
      { text: ': ', role: 'text' },
      { text: 'null', role: 'type' },
    ]);
  });

  it('colors curl, its method and flags, and its quoted arguments, one line at a time', () => {
    const lines = codeLines("curl -X GET 'https://humanbase.io/api/genes/3553/' \\\n  -H 'Accept: application/json'", 'curl');
    expect(lines).toHaveLength(2);
    expect(lines[0]).toEqual([
      { text: 'curl', role: 'command' },
      { text: ' ', role: 'text' },
      { text: '-X', role: 'flag' },
      { text: ' ', role: 'text' },
      { text: 'GET', role: 'command' },
      { text: ' ', role: 'text' },
      { text: "'https://humanbase.io/api/genes/3553/'", role: 'string' },
      { text: ' \\', role: 'text' },
    ]);
    expect(lines[1]).toEqual([
      { text: '  ', role: 'text' },
      { text: '-H', role: 'flag' },
      { text: ' ', role: 'text' },
      { text: "'Accept: application/json'", role: 'string' },
    ]);
  });

  it('keeps every character, so the copied code is the code shown', () => {
    const code = '{\n  "a": [1, 2.5e3, -4],\n  "b": "say \\"hi\\""\n}';
    expect(codeLines(code, 'json').map((line) => line.map((token) => token.text).join('')).join('\n')).toBe(code);
  });
});
