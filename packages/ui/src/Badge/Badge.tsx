import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import './Badge.css';

export type BadgeSize = 'small' | 'medium';
export type BadgeTone = 'neutral' | 'count' | 'on-primary';
export type JobStatus = 'queued' | 'running' | 'finished' | 'failed';

export interface BadgeProps {
  children: ReactNode;
  tone?: BadgeTone;
  size?: BadgeSize;
  spokenAs?: string | undefined;
  className?: string | undefined;
}

export function Badge({ children, tone = 'neutral', size = 'medium', spokenAs, className }: BadgeProps) {
  return (
    <span className={['badge', `badge-${tone}`, `badge-${size}`, className].filter(Boolean).join(' ')}>
      {spokenAs ? (
        <>
          <span aria-hidden="true">{children}</span>
          <span className="visually-hidden">{spokenAs}</span>
        </>
      ) : (
        children
      )}
    </span>
  );
}

const statusWords: Record<JobStatus, string> = { queued: 'Queued', running: 'Running', finished: 'Finished', failed: 'Failed' };
const statusIcons: Record<Exclude<JobStatus, 'running'>, IconName> = { queued: 'clock', finished: 'check-circle', failed: 'alert-circle' };

export interface StatusBadgeProps {
  status: JobStatus;
  size?: BadgeSize;
  children?: ReactNode;
}

export function StatusBadge({ status, size = 'medium', children }: StatusBadgeProps) {
  const iconSize = size === 'small' ? 12 : 14;
  return (
    <span className={`badge badge-status badge-${status} badge-${size}`}>
      {status === 'running' ? <RunningRing size={iconSize} /> : <Icon name={statusIcons[status]} size={iconSize} />}
      {children ?? statusWords[status]}
    </span>
  );
}

// A still quarter ring, so a table of running jobs doesn't spin all at once.
function RunningRing({ size }: { size: number }) {
  return (
    <svg className="icon badge-ring" viewBox="0 0 12 12" width={size} height={size} aria-hidden="true" focusable="false">
      <circle cx="6" cy="6" r="4.75" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="1.5" />
      <path d="M6 1.25a4.75 4.75 0 0 1 4.75 4.75" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}
