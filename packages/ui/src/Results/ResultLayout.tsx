import type { ReactNode } from 'react';
import './Results.css';

export interface ResultLayoutProps {
  header?: ReactNode;
  main?: ReactNode;
  mainLabel: string;
  companion?: ReactNode;
  companionLabel?: string;
  className?: string;
}

export function ResultLayout({ header, main, mainLabel, companion, companionLabel, className }: ResultLayoutProps) {
  return (
    <div className={['result-layout', className].filter(Boolean).join(' ')}>
      {header}
      <div className="result-layout-body" data-companion={companion ? true : undefined}>
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
