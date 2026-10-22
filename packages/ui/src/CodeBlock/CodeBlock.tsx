import { useId, useRef, useState, type ReactNode } from 'react';
import { Disclosure } from '../Disclosure/Disclosure';
import { useCopy } from '../hooks/useCopy';
import { useOverflow } from '../hooks/useOverflow';
import { Icon } from '../Icon/Icon';
import './CodeBlock.css';

export type SyntaxRole = 'text' | 'key' | 'command' | 'string' | 'type' | 'param' | 'flag' | 'comment';

export interface CodeToken {
  text: string;
  role: SyntaxRole;
}

export type CodeLine = readonly CodeToken[];

export interface CopyButtonProps {
  text: string;
  label: string;
  'data-state'?: 'hover' | 'copied';
}

export function CopyButton({ text, label, 'data-state': dataState }: CopyButtonProps) {
  const { copied, copy, status } = useCopy(text, `${label} copied`);
  const showCopied = copied || dataState === 'copied';
  return (
    <>
      <button type="button" className="code-copy" data-state={dataState} data-copied={showCopied || undefined} onClick={copy}>
        <Icon name={showCopied ? 'check' : 'copy'} size={16} />
        {showCopied ? 'Copied' : 'Copy'}
        {' '}
        <span className="visually-hidden">{label}</span>
      </button>
      {status}
    </>
  );
}

function Highlighted({ lines }: { lines: readonly CodeLine[] }) {
  return lines.map((line, row) => (
    <span key={row}>
      {line.map((token, index) =>
        token.role === 'text' ? (
          token.text
        ) : (
          <span key={index} className={`syntax-${token.role}`}>
            {token.text}
          </span>
        ),
      )}
      {row < lines.length - 1 && '\n'}
    </span>
  ));
}

export interface CodeBlockProps {
  label: string;
  code: string;
  lines?: readonly CodeLine[];
  copy?: boolean;
  className?: string;
  /** Blocks longer than this many lines start collapsed. */
  collapseAfter?: number;
  /** How many lines a collapsed block shows. */
  previewLines?: number;
  expandLabel?: string;
  collapseLabel?: string;
  defaultExpanded?: boolean;
}

export function CodeBlock({
  label,
  code,
  lines,
  copy = true,
  className,
  collapseAfter = 40,
  previewLines = 12,
  expandLabel = 'Show full response',
  collapseLabel = 'Show less',
  defaultExpanded = false,
}: CodeBlockProps) {
  const labelId = useId();
  const codeId = useId();
  const pre = useRef<HTMLPreElement>(null);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const collapsible = code.split('\n').length > collapseAfter;
  const shortened = collapsible && !expanded;
  const scrolls = useOverflow(pre);
  const content: ReactNode = lines
    ? <Highlighted lines={shortened ? lines.slice(0, previewLines) : lines} />
    : shortened ? code.split('\n').slice(0, previewLines).join('\n') : code;
  // A block that scrolls becomes a labelled, focusable region so arrow keys can scroll it.
  const scrollRegion = scrolls ? { role: 'region', 'aria-labelledby': labelId, tabIndex: 0 } : {};

  return (
    <figure className={['code-block', className].filter(Boolean).join(' ')} aria-labelledby={labelId}>
      <figcaption id={labelId} className="code-block-label">
        {label}
      </figcaption>
      {copy && <CopyButton text={code} label={label} />}
      <pre ref={pre} id={codeId} className="code-block-code" {...scrollRegion}>
        <code>{content}</code>
      </pre>
      {collapsible && <Disclosure label={expandLabel} expandedLabel={collapseLabel} controls={codeId} open={expanded} onOpenChange={setExpanded} />}
    </figure>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="inline-code">{children}</code>;
}
