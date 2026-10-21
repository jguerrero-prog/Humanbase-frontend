import type { ReactNode } from 'react';
import './ViewAsTable.css';

export interface ViewAsTableProps {
  className?: string;
  children: ReactNode;
}

/** A drawing's values as a table, behind a View as table link: the text alternative for charts and tracks. */
export function ViewAsTable({ className, children }: ViewAsTableProps) {
  return (
    <details className={className ? `view-as-table ${className}` : 'view-as-table'}>
      <summary>View as table</summary>
      {children}
    </details>
  );
}
