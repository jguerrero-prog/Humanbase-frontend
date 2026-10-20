import type { ReactNode } from 'react';
import './JobForm.css';

/** The tool page layout: the form or search on the left, the About panel on the right. */
export function JobColumns({ children }: { children: ReactNode }) {
  return <div className="job-columns">{children}</div>;
}
