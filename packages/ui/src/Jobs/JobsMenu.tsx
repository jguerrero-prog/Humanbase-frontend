import { StatusBadge, type JobStatus } from '../Badge/Badge';
import { useDisclosureMenu } from '../hooks/useDisclosureMenu';
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
  const { root, button, panel, buttonProps, panelProps } = useDisclosureMenu({ open, onOpenChange });
  const headingId = `${panelProps.id}-heading`;
  const active = activeJobCount(jobs);

  return (
    <div ref={root} className="jobs-menu">
      <button ref={button} {...buttonProps} type="button" className="top-bar-jobs">
        Jobs{' '}
        {active > 0 && <span className="top-bar-jobs-count">{active} running</span>}
      </button>
      <div ref={panel} {...panelProps} className="nav-menu-panel jobs-menu-panel">
        <p id={headingId} className="jobs-menu-heading">
          Jobs in this browser
        </p>
        {jobs.length === 0 && <p className="jobs-menu-empty">Jobs you start in this browser appear here.</p>}
        <ul className="jobs-menu-list" aria-labelledby={headingId} hidden={jobs.length === 0}>
          {jobs.slice(0, shown).map((job) => (
            <li key={job.href}>
              <a className="jobs-menu-job" href={linkHref(job.href)}>
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
          <a className="button button-ghost button-small" href={linkHref(allHref)}>
            See all {total} jobs
          </a>
        </p>
      </div>
    </div>
  );
}
