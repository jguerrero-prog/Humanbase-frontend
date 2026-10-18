import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
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

const copiedFor = 2000;

export function CopyButton({ text, label, 'data-state': dataState }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    if (!copied) return;
    const timer = setTimeout(() => setCopied(false), copiedFor);
    return () => clearTimeout(timer);
  }, [copied]);

  const copy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
  };

  const showCopied = copied || dataState === 'copied';
  return (
    <>
      <button type="button" className="code-copy" data-state={dataState} data-copied={showCopied || undefined} onClick={copy}>
        <Icon name={showCopied ? 'check' : 'copy'} size={16} />
        {showCopied ? 'Copied' : 'Copy'}
        {' '}
        <span className="visually-hidden">{label}</span>
      </button>
      <span role="status" className="visually-hidden">
        {copied ? `${label} copied` : ''}
      </span>
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
}

export function CodeBlock({ label, code, lines, copy = true, className }: CodeBlockProps) {
  const labelId = useId();
  const pre = useRef<HTMLPreElement>(null);
  const scrolls = useOverflow(pre);
  const content: ReactNode = lines ? <Highlighted lines={lines} /> : code;
  // A block that scrolls becomes a labelled, focusable region so arrow keys can scroll it.
  const scrollRegion = scrolls ? { role: 'region', 'aria-labelledby': labelId, tabIndex: 0 } : {};

  return (
    <figure className={['code-block', className].filter(Boolean).join(' ')} aria-labelledby={labelId}>
      <figcaption id={labelId} className="code-block-label">
        {label}
      </figcaption>
      {copy && <CopyButton text={code} label={label} />}
      <pre ref={pre} className="code-block-code" {...scrollRegion}>
        <code>{content}</code>
      </pre>
    </figure>
  );
}

export function InlineCode({ children }: { children: ReactNode }) {
  return <code className="inline-code">{children}</code>;
}
