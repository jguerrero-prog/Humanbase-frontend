import { useId, useState, type ComponentProps, type CSSProperties, type ReactNode } from 'react';
import { Checkbox } from '../Checkbox/Checkbox';
import { EmptyState } from '../EmptyState/EmptyState';
import { Icon, type IconName } from '../Icon/Icon';
import { Skeleton } from '../Skeleton/Skeleton';
import { ValueFormat } from './ValueFormat';
import './Table.css';

export type TableDensity = 'comfortable' | 'compact';
export type SortDirection = 'ascending' | 'descending';
type CellAlign = 'start' | 'end';

const format = new ValueFormat();
const classes = (...names: (string | false | undefined)[]) => names.filter(Boolean).join(' ');

export interface TableProps {
  caption: string;
  showCaption?: boolean;
  density?: TableDensity;
  columnWidths?: readonly string[];
  minWidth?: string;
  pinFirstColumn?: boolean;
  busy?: boolean;
  status?: string;
  className?: string;
  children: ReactNode;
}

export function Table({ caption, showCaption = false, density = 'comfortable', columnWidths, minWidth, pinFirstColumn = false, busy = false, status, className, children }: TableProps) {
  const captionId = useId();
  return (
    <div className={classes('table', `table-${density}`, pinFirstColumn && 'table-pinned', className)}>
      {/* A scrolling region must take focus so keyboard users can scroll it. */}
      {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
      <div className="table-scroll" role="region" aria-labelledby={captionId} tabIndex={0}>
        <table className={classes(columnWidths && 'table-fixed')} style={minWidth ? { minInlineSize: minWidth } : undefined} aria-busy={busy || undefined}>
          <caption id={captionId} className={showCaption ? 'table-caption' : 'visually-hidden'}>
            {caption}
          </caption>
          {columnWidths && (
            <colgroup>
              {columnWidths.map((width, index) => (
                <col key={index} style={{ inlineSize: width }} />
              ))}
            </colgroup>
          )}
          {children}
        </table>
      </div>
      <p className="visually-hidden" role="status">
        {status}
      </p>
    </div>
  );
}

export interface HeaderCellProps {
  children: ReactNode;
  align?: CellAlign;
  sort?: SortDirection | 'none';
  onSort?: () => void;
  className?: string;
  'data-state'?: 'hover' | 'focus' | undefined;
}

export function HeaderCell({ children, align = 'start', sort, onSort, className, 'data-state': dataState }: HeaderCellProps) {
  const sorted = sort === 'ascending' || sort === 'descending';
  return (
    <th scope="col" className={classes('table-header', `table-header-${align}`, className)} aria-sort={sorted ? sort : undefined} data-state={sort ? undefined : dataState}>
      {sort ? (
        <button type="button" className="table-sort" data-state={dataState} onClick={onSort}>
          {children}
          <Icon name={sort === 'descending' ? 'chevron-down' : 'chevron-up'} size={16} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

export type CellType = 'text' | 'number' | 'gene' | 'id';

export interface CellProps extends ComponentProps<'td'> {
  type?: CellType;
  rowHeader?: boolean;
}

export function Cell({ type = 'text', rowHeader = false, className, children, ...rest }: CellProps) {
  const cellClass = classes('table-cell', `table-cell-${type}`, className);
  return rowHeader ? (
    <th scope="row" className={cellClass} {...rest}>
      {children}
    </th>
  ) : (
    <td className={cellClass} {...rest}>
      {children}
    </td>
  );
}

export function ScoreCell({ value }: { value: number | null | undefined }) {
  return (
    <td className="table-cell table-cell-score">
      <span className="table-score">
        {format.score(value)}
        <span className="table-score-bar" aria-hidden="true" style={{ '--score': `${(value ?? 0) * 100}%` } as CSSProperties} />
      </span>
    </td>
  );
}

export interface SelectCellProps {
  label: string;
  checked?: boolean;
  onToggle?: () => void;
}

const selectionProps = (checked: boolean, onToggle: (() => void) | undefined) => (onToggle ? { checked, onChange: onToggle } : { defaultChecked: checked });

export function SelectCell({ label, checked = false, onToggle }: SelectCellProps) {
  return (
    <td className="table-cell table-select">
      <Checkbox label={label} hideLabel {...selectionProps(checked, onToggle)} />
    </td>
  );
}

export function SelectAllCell({ label, state, onToggle }: { label: string; state: SelectionState; onToggle?: () => void }) {
  return (
    <th scope="col" className="table-header table-select">
      <Checkbox label={label} hideLabel indeterminate={state === 'some'} {...selectionProps(state === 'all', onToggle)} />
    </th>
  );
}

export interface TableMessageProps {
  columns: number;
  title: string;
  text?: string;
  icon?: IconName;
  action?: ReactNode;
}

export function TableMessage({ columns, title, text, icon, action }: TableMessageProps) {
  return (
    <tr className="table-message-row">
      <td colSpan={columns} className="table-cell">
        <EmptyState className="table-message" title={title} text={text} icon={icon} actions={action} />
      </td>
    </tr>
  );
}

const skeletonWidths = ['64px', '52px', '72px', '48px'];

export function TableSkeleton({ columns, rows = 4 }: { columns: number; rows?: number }) {
  return Array.from({ length: rows }, (_, row) => (
    <tr key={row} className="table-skeleton-row" aria-hidden="true">
      {Array.from({ length: columns }, (_, column) => (
        <td key={column} className={classes('table-cell', column === columns - 1 && 'table-cell-number')}>
          <Skeleton width={column === columns - 1 ? '120px' : (skeletonWidths[row % skeletonWidths.length] ?? '64px')} />
        </td>
      ))}
    </tr>
  ));
}

export interface TableToolbarProps {
  title: string;
  description?: string;
  level?: 2 | 3 | 4;
  children?: ReactNode;
}

export function TableToolbar({ title, description, level = 3, children }: TableToolbarProps) {
  const Heading = `h${level}` as const;
  return (
    <div className="table-toolbar">
      <div className="table-toolbar-title">
        <Heading>{title}</Heading>
        {description && <p>{description}</p>}
      </div>
      {children}
    </div>
  );
}

export function SelectionBar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="table-selection-bar">
      <p role="status">{label}</p>
      {children}
    </div>
  );
}

export function useTableSort<Column extends string>(initial: { column: Column; direction: SortDirection }) {
  const [sort, setSort] = useState(initial);
  const directionOf = (column: Column): SortDirection | 'none' => (sort.column === column ? sort.direction : 'none');
  const toggle = (column: Column, first: SortDirection = 'ascending') =>
    setSort((current) =>
      current.column === column ? { column, direction: current.direction === 'ascending' ? 'descending' : 'ascending' } : { column, direction: first },
    );
  return { sort, directionOf, toggle };
}

export type SelectionState = 'all' | 'some' | 'none';

export function useRowSelection(ids: readonly string[], initial: Iterable<string> = []) {
  const [selected, setSelected] = useState(() => new Set(initial));
  const count = ids.filter((id) => selected.has(id)).length;
  const state: SelectionState = count === 0 ? 'none' : count === ids.length ? 'all' : 'some';

  const toggle = (id: string) =>
    setSelected((current) => {
      const next = new Set(current);
      if (!next.delete(id)) next.add(id);
      return next;
    });
  const toggleAll = () => setSelected(state === 'all' ? new Set() : new Set(ids));
  const clear = () => setSelected(new Set());

  return { count, state, isSelected: (id: string) => selected.has(id), toggle, toggleAll, clear };
}
