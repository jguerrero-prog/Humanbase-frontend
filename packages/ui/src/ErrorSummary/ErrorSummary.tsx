import { useEffect, useRef, type MouseEvent } from 'react';
import { Alert } from '../Message/Alert';
import './ErrorSummary.css';

export interface ErrorSummaryItem {
  fieldId: string;
  message: string;
}

export interface ErrorSummaryProps {
  items: ErrorSummaryItem[];
  focusOnShow?: boolean;
}

export function ErrorSummary({ items, focusOnShow = true }: ErrorSummaryProps) {
  const summary = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (focusOnShow) summary.current?.focus();
  }, [focusOnShow]);

  const moveTo = (fieldId: string) => (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    document.getElementById(fieldId)?.focus();
  };

  const title = `${items.length} ${items.length === 1 ? 'thing' : 'things'} to fix before submitting`;

  return (
    <div ref={summary} className="error-summary" tabIndex={-1}>
      <Alert tone="error" title={title}>
        <ul>
          {items.map(({ fieldId, message }) => (
            <li key={fieldId}>
              <a href={`#${fieldId}`} onClick={moveTo(fieldId)}>
                {message}
              </a>
            </li>
          ))}
        </ul>
      </Alert>
    </div>
  );
}
