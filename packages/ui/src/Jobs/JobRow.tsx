import type { ReactNode } from 'react';
import { StatusBadge, type JobStatus } from '../Badge/Badge';
import { Cell } from '../Table/Table';
import '../Button/Button.css';
import './Jobs.css';
import { useLinkHref } from '../hooks/useLinkHref';

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
  /** More actions beside the main one, such as Copy link and Remove from this list. */
  menu?: ReactNode;
}

export function JobRow({ title, detail, status, statusDetail, started, action, menu }: JobRowProps) {
  const linkHref = useLinkHref();
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
        <span className="job-row-actions">
          <a className="button button-ghost button-small" href={linkHref(action.href)} aria-label={`${action.label}: ${title}`}>
            {action.label}
          </a>
          {menu}
        </span>
      </Cell>
    </tr>
  );
}
