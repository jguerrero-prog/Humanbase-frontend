import { useCallback, useId, useRef, type KeyboardEvent } from 'react';
import { StatusBadge, type JobStatus } from '../Badge/Badge';
import { useControlled } from '../hooks/useControlled';
import { useDismiss } from '../List/useDismiss';
import '../Button/Button.css';
import '../Navigation/Navigation.css';
import './Jobs.css';
import { useLinkHref } from '../hooks/useLinkHref';

export interface JobsMenuJob {
  title: string;
  detail: string;
  status: JobStatus;
  href: string;
}

export interface JobsMenuProps {
  jobs: readonly JobsMenuJob[];
  total: number;
  allHref: string;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  shown?: number;
}

export type JobsMenuSummary = Pick<JobsMenuProps, 'jobs' | 'total' | 'allHref'>;

export const activeJobCount = (jobs: readonly JobsMenuJob[]) => jobs.filter((job) => job.status === 'queued' || job.status === 'running').length;

export function JobsMenu({ jobs, total, allHref, open, onOpenChange, shown = 5 }: JobsMenuProps) {
  const linkHref = useLinkHref();
  const id = useId();
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const [isOpen, setOwnOpen] = useControlled(open, false);
  const setOpen = useCallback(
    (next: boolean) => {
      setOwnOpen(next);
      onOpenChange?.(next);
    },
    [setOwnOpen, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  useDismiss(root, isOpen && open === undefined, close);
  const active = activeJobCount(jobs);

  const closeOnEscape = (event: KeyboardEvent) => {
    if (event.key !== 'Escape') return;
    close();
    button.current?.focus();
  };

  return (
    <div ref={root} className="jobs-menu">
      <button ref={button} type="button" className="top-bar-jobs" onKeyDown={closeOnEscape} aria-expanded={isOpen} aria-controls={`${id}-panel`} onClick={() => setOpen(!isOpen)}>
        Jobs{' '}
        {active > 0 && <span className="top-bar-jobs-count">{active} running</span>}
      </button>
      <div id={`${id}-panel`} className="nav-menu-panel jobs-menu-panel" hidden={!isOpen}>
        <p id={`${id}-heading`} className="jobs-menu-heading">
          Jobs in this browser
        </p>
        {jobs.length === 0 && <p className="jobs-menu-empty">Jobs you start in this browser appear here.</p>}
        <ul className="jobs-menu-list" aria-labelledby={`${id}-heading`} hidden={jobs.length === 0}>
          {jobs.slice(0, shown).map((job) => (
            <li key={job.href}>
              <a className="jobs-menu-job" href={linkHref(job.href)} onKeyDown={closeOnEscape}>
                <span className="jobs-menu-text">
                  <span className="jobs-menu-title">{job.title}</span>
                  <span className="jobs-menu-detail">{job.detail}</span>
                </span>
                <StatusBadge status={job.status} size="small" />
              </a>
            </li>
          ))}
        </ul>
        <p className="jobs-menu-footer" hidden={total === 0}>
          <a className="button button-ghost button-small" href={linkHref(allHref)} onKeyDown={closeOnEscape}>
            See all {total} jobs
          </a>
        </p>
      </div>
    </div>
  );
}
