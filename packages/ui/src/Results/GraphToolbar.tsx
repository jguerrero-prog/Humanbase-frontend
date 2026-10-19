import { Fragment } from 'react';
import { IconButton } from '../IconButton/IconButton';
import type { IconName } from '../Icon/Icon';
import './Results.css';

export interface GraphAction {
  label: string;
  icon: IconName;
  pressed?: boolean;
  onSelect?: () => void;
}

export interface GraphToolbarProps {
  label: string;
  groups: readonly (readonly GraphAction[])[];
  tableHref?: string;
  onViewTable?: () => void;
  /** The view switch's text; "View as graph" while the table is showing. */
  tableLabel?: string;
}

export function GraphToolbar({ label, groups, tableHref, onViewTable, tableLabel = 'View as table' }: GraphToolbarProps) {
  return (
    <div className="graph-toolbar" role="toolbar" aria-label={label}>
      {groups.map((group, index) => (
        <Fragment key={index}>
          {index > 0 && <span className="graph-toolbar-divider" aria-hidden="true" />}
          {group.map((action) => (
            <IconButton key={action.label} label={action.label} icon={action.icon} aria-pressed={action.pressed} onClick={action.onSelect} />
          ))}
        </Fragment>
      ))}
      {tableHref ? (
        <a className="graph-toolbar-table" href={tableHref}>
          {tableLabel}
        </a>
      ) : (
        onViewTable && (
          <button type="button" className="graph-toolbar-table" onClick={onViewTable}>
            {tableLabel}
          </button>
        )
      )}
    </div>
  );
}
