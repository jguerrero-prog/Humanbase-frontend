import type { ReactNode } from 'react';
import './Results.css';

export interface ResultLayoutProps {
  header?: ReactNode;
  main?: ReactNode;
  mainLabel: string;
  companion?: ReactNode;
  companionLabel?: string;
  /** The main column takes the full width and the companion moves below it. */
  expanded?: boolean;
  className?: string;
}

export function ResultLayout({ header, main, mainLabel, companion, companionLabel, expanded = false, className }: ResultLayoutProps) {
  return (
    <div className={['result-layout', className].filter(Boolean).join(' ')}>
      {header}
      <div className="result-layout-body" data-companion={companion ? true : undefined} data-expanded={expanded || undefined}>
        <section className="result-main" aria-label={mainLabel}>
          {main}
        </section>
        {companion && (
          <section className="result-companion" aria-label={companionLabel ?? 'Details'}>
            {companion}
          </section>
        )}
      </div>
    </div>
  );
}
