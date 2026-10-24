import { useState, type ReactNode } from 'react';
import './ViewAsTable.css';

export interface ViewAsTableProps {
  className?: string;
  children: ReactNode;
  /** Builds the contents only once the table is opened, for very large tables. */
  lazy?: boolean | undefined;
}

/** A drawing's values as a table, behind a View as table link: the text alternative for charts and tracks. */
export function ViewAsTable({ className, children, lazy = false }: ViewAsTableProps) {
  const [open, setOpen] = useState(false);
  return (
    <details className={className ? `view-as-table ${className}` : 'view-as-table'} onToggle={(event) => setOpen(event.currentTarget.open)}>
      <summary>View as table</summary>
      {(!lazy || open) && children}
    </details>
  );
}
