import { StatusBadge, type JobStatus } from '../Badge/Badge';
import { Cell } from '../Table/Table';
import '../Button/Button.css';
import './Jobs.css';

export interface JobLink {
  label: string;
  href: string;
}

export interface JobRowProps {
  title: string;
  detail: string;
  status: JobStatus;
  statusDetail: string;
  started: string;
  action: JobLink;
}

export function JobRow({ title, detail, status, statusDetail, started, action }: JobRowProps) {
  return (
    <tr className="job-row">
      <Cell rowHeader>
        <span className="job-row-title">{title}</span>
        <span className="job-row-detail">{detail}</span>
      </Cell>
      <Cell>
        <span className="job-row-status">
          <StatusBadge status={status} size="small" />
          <span className="job-row-detail">{statusDetail}</span>
        </span>
      </Cell>
      <Cell>{started}</Cell>
      <Cell>
        <a className="button button-ghost button-small" href={action.href} aria-label={`${action.label}: ${title}`}>
          {action.label}
        </a>
      </Cell>
    </tr>
  );
}
