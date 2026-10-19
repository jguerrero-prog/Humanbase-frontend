import type { ReactNode } from 'react';
import './Results.css';

export interface JobDetail {
  term: string;
  value: ReactNode;
  mono?: boolean;
}

export function JobDetails({ items, label = 'Job details' }: { items: readonly JobDetail[]; label?: string }) {
  return (
    <dl className="job-details-list" aria-label={label}>
      {items.map(({ term, value, mono }) => (
        <div key={term}>
          <dt>{term}</dt>
          <dd className={mono ? 'job-details-mono' : undefined}>{value}</dd>
        </div>
      ))}
    </dl>
  );
}
