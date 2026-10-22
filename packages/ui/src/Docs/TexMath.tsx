import { createElement, Fragment, useRef, type ReactNode } from 'react';
import { useOverflow } from '../hooks/useOverflow';

/** A parsed piece of a formula: plain text, a command such as \frac, a {group}, or a base with a subscript or superscript. */
type TexNode =
  | { kind: 'text'; text: string }
  | { kind: 'command'; name: string; args: TexNode[][] }
  | { kind: 'group'; children: TexNode[] }
  | { kind: 'script'; base: TexNode | undefined; sub?: TexNode; sup?: TexNode };

const commandArgs: Record<string, number> = { frac: 2 };
const operators: Record<string, string> = { sum: '∑', cdot: '·', times: '×', pm: '±', leq: '≤', geq: '≥' };
const functions = new Set(['log', 'ln', 'exp', 'min', 'max']);

/** Reads the small part of LaTeX the docs use: letters, numbers, groups, _ and ^, \frac, \log, \sum, and \left … \right. */
export class TexParser {
  private index = 0;
  private readonly tex: string;

  constructor(tex: string) {
    this.tex = tex;
  }

  parse(): TexNode[] {
    const nodes = this.sequence();
    if (this.index < this.tex.length) throw new Error(`Unexpected “${this.tex[this.index]}” in ${this.tex}`);
    return nodes;
  }

  private sequence(): TexNode[] {
    const nodes: TexNode[] = [];
    while (this.index < this.tex.length && this.tex[this.index] !== '}' && !this.tex.startsWith('\\right', this.index)) {
      const char = this.tex[this.index];
      if (char === '_' || char === '^') {
        this.index += 1;
        const previous = nodes.at(-1);
        const script = previous?.kind === 'script' ? previous : { kind: 'script' as const, base: nodes.pop() };
        if (previous?.kind !== 'script') nodes.push(script);
        script[char === '_' ? 'sub' : 'sup'] = this.atom();
      } else {
        nodes.push(this.atom());
      }
    }
    return nodes;
  }

  /** \left( … \right) as one group, so MathML stretches the brackets to fit what they enclose. */
  private fenced(): TexNode {
    const open = this.tex[this.index++] ?? '';
    const children = this.sequence();
    if (!this.tex.startsWith('\\right', this.index)) throw new Error(`Missing \\right in ${this.tex}`);
    this.index += '\\right'.length;
    const close = this.tex[this.index++] ?? '';
    return { kind: 'group', children: [{ kind: 'text', text: open }, ...children, { kind: 'text', text: close }] };
  }

  private atom(): TexNode {
    const char = this.tex[this.index] ?? '';
    if (char === '{') {
      this.index += 1;
      const children = this.sequence();
      if (this.tex[this.index] !== '}') throw new Error(`Missing } in ${this.tex}`);
      this.index += 1;
      return { kind: 'group', children };
    }
    if (char === '\\') {
      const name = /^\\([a-zA-Z]+|.)/.exec(this.tex.slice(this.index))?.[1] ?? '';
      this.index += name.length + 1;
      if (name === 'left') return this.fenced();
      return { kind: 'command', name, args: Array.from({ length: commandArgs[name] ?? 0 }, () => [this.atom()]) };
    }
    const run = /^([a-zA-Z]+|[0-9.]+|\s+|.)/.exec(this.tex.slice(this.index))?.[1] ?? char;
    this.index += run.length;
    return { kind: 'text', text: run };
  }
}

/** True when a formula is only text with subscripts and superscripts, which reads best as plain text. */
export function isPlainScript(nodes: readonly TexNode[]): boolean {
  return nodes.every((node) =>
    node.kind === 'text' ? true : node.kind === 'group' ? isPlainScript(node.children) : node.kind === 'script' ? isPlainScript([node.base, node.sub, node.sup].filter((part) => part !== undefined)) : false,
  );
}

function plain(node: TexNode | undefined, key: number): ReactNode {
  if (!node) return null;
  if (node.kind === 'text') return node.text;
  if (node.kind === 'group') return <Fragment key={key}>{node.children.map(plain)}</Fragment>;
  if (node.kind === 'script') {
    return (
      <Fragment key={key}>
        {plain(node.base, 0)}
        {node.sub && <sub>{plain(node.sub, 0)}</sub>}
        {node.sup && <sup>{plain(node.sup, 0)}</sup>}
      </Fragment>
    );
  }
  return null;
}

const ml = (tag: string, key: number, ...children: ReactNode[]) => createElement(tag, { key }, ...children);

function mathml(node: TexNode | undefined, key: number): ReactNode {
  if (!node) return ml('mrow', key);
  switch (node.kind) {
    case 'text':
      if (/^\s+$/.test(node.text)) return null;
      if (/^[a-zA-Z]+$/.test(node.text)) return ml('mi', key, node.text);
      if (/^[0-9.]+$/.test(node.text)) return ml('mn', key, node.text);
      return ml('mo', key, node.text === '-' ? '−' : node.text);
    case 'group':
      return ml('mrow', key, ...node.children.map(mathml));
    case 'script': {
      const tag = node.sub && node.sup ? 'msubsup' : node.sub ? 'msub' : 'msup';
      return ml(tag, key, mathml(node.base, 0), ...[node.sub, node.sup].filter(Boolean).map((part, index) => mathml(part, index + 1)));
    }
    case 'command':
      if (node.name === 'frac') return ml('mfrac', key, ...node.args.map((arg, index) => ml('mrow', index, ...arg.map(mathml))));
      if (node.name === ' ') return createElement('mspace', { key, width: '0.25em' });
      if (functions.has(node.name)) return ml('mi', key, node.name);
      if (operators[node.name]) return ml('mo', key, operators[node.name]);
      return ml('mi', key, node.name);
  }
}

export interface TexMathProps {
  tex: string;
  display?: boolean;
}

function parseOrUndefined(tex: string): TexNode[] | undefined {
  try {
    const nodes = new TexParser(tex).parse();
    return nodes.every(known) ? nodes : undefined;
  } catch {
    return undefined;
  }
}

function known(node: TexNode | undefined): boolean {
  if (!node || node.kind === 'text') return true;
  if (node.kind === 'group') return node.children.every(known);
  if (node.kind === 'script') return [node.base, node.sub, node.sup].every(known);
  const name = node.name;
  return (name === 'frac' || name === ' ' || functions.has(name) || name in operators) && node.args.every((arg) => arg.every(known));
}

/** A formula as text with real sub and sup elements when that is all it needs, otherwise as native MathML. */
export function TexMath({ tex, display = false }: TexMathProps) {
  const nodes = parseOrUndefined(tex);
  if (!nodes) return <code className="inline-code">{tex}</code>;
  const formula = isPlainScript(nodes)
    ? <span className="tex-math">{nodes.map(plain)}</span>
    : createElement('math', { display: display ? 'block' : 'inline', className: 'tex-math' }, ml('mrow', 0, ...nodes.map(mathml)));
  return display ? <DisplayFormula>{formula}</DisplayFormula> : formula;
}

/** A formula on its own line; when it is wider than the column it scrolls, and takes focus so the keyboard can scroll it. */
function DisplayFormula({ children }: { children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const scrolls = useOverflow(box);
  return (
    <div ref={box} className="tex-math-display" {...(scrolls && { role: 'region', 'aria-label': 'Formula', tabIndex: 0 })}>
      {children}
    </div>
  );
}
