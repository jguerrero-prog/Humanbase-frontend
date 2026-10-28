import type { MouseEvent, ReactNode } from 'react';
import { Button } from '../Button/Button';
import { useControlled } from '../hooks/useControlled';
import { Icon } from '../Icon/Icon';
import { Select } from '../Select/Select';
import { ValueFormat } from '../Table/ValueFormat';
import { PageWindow } from './PageWindow';
import './Pagination.css';

const format = new ValueFormat();

export const rowsPerPage = [25, 50, 100] as const;

export interface PaginationProps {
  total: number;
  noun: string;
  page?: number;
  defaultPage?: number;
  pageSize?: number;
  defaultPageSize?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  href?: (page: number) => string;
  layout?: 'auto' | 'compact';
  disabled?: boolean;
  label?: string;
}

export interface PageLinkProps {
  page: number;
  label: string;
  className: string;
  children: ReactNode;
  href?: ((page: number) => string) | undefined;
  disabled?: boolean;
  current?: boolean;
  onSelect?: (page: number) => void;
  'data-state'?: 'hover' | 'focus' | undefined;
}

export function PageLink({ page, label, className, children, href, disabled = false, current = false, onSelect, 'data-state': dataState }: PageLinkProps) {
  const shared = { className, 'aria-label': label, 'data-state': dataState };
  if (disabled) {
    return (
      <button type="button" {...shared} disabled>
        {children}
      </button>
    );
  }
  const select = (event: MouseEvent) => {
    if (!href) event.preventDefault();
    onSelect?.(page);
  };
  return href ? (
    <a {...shared} href={href(page)} aria-current={current ? 'page' : undefined} onClick={select}>
      {children}
    </a>
  ) : (
    <button type="button" {...shared} aria-current={current ? 'page' : undefined} onClick={select}>
      {children}
    </button>
  );
}

export function Pagination({
  total, noun, page, defaultPage = 1, pageSize, defaultPageSize = rowsPerPage[0], onPageChange, onPageSizeChange,
  href, layout = 'auto', disabled = false, label = 'Pagination',
}: PaginationProps) {
  const [currentPage, setPage] = useControlled(page, defaultPage);
  const [size, setSize] = useControlled(pageSize, defaultPageSize);
  const pages = new PageWindow(total, size, currentPage);

  const goTo = (next: number) => {
    setPage(next);
    onPageChange?.(next);
  };
  const resize = (value: string) => {
    const next = Number(value);
    setSize(next);
    onPageSizeChange?.(next);
    goTo(1);
  };
  const step = (direction: 'previous' | 'next') => {
    const previous = direction === 'previous';
    return (
      <PageLink
        page={pages.page + (previous ? -1 : 1)}
        href={href}
        disabled={disabled || (previous ? !pages.hasPrevious : !pages.hasNext)}
        label={previous ? 'Previous page' : 'Next page'}
        className={`page-step page-step-${direction}`}
        onSelect={goTo}
      >
        {previous && <Icon name="chevron-left" size={20} />}
        {previous ? 'Previous' : 'Next'}
        {!previous && <Icon name="chevron-right" size={20} />}
      </PageLink>
    );
  };

  return (
    <nav className="pagination" aria-label={label} data-layout={layout}>
      <p className="pagination-range">{pages.range(noun)}</p>
      <div className="pagination-rows">
        <Select
          label="Rows per page"
          size="small"
          value={String(size)}
          options={rowsPerPage.map((option) => ({ value: String(option), label: String(option) }))}
          onChange={resize}
          disabled={disabled}
        />
      </div>
      <ul className="pagination-pages">
        <li>{step('previous')}</li>
        {pages.slots().map((slot, index) =>
          slot === 'gap' ? (
            <li key={`gap-${index}`} className="pagination-gap" aria-hidden="true">
              …
            </li>
          ) : (
            <li key={slot} className="pagination-number">
              <PageLink
                page={slot}
                href={href}
                disabled={disabled}
                current={slot === pages.page}
                label={`Page ${format.count(slot)}`}
                className="page-button"
                onSelect={goTo}
              >
                {format.count(slot)}
              </PageLink>
            </li>
          ),
        )}
        <li className="pagination-position">
          {pages.position()}
        </li>
        <li>{step('next')}</li>
      </ul>
      <p className="visually-hidden" role="status">
        {pages.announcement(noun)}
      </p>
    </nav>
  );
}

export interface ShowMoreProps {
  shown: number;
  total: number;
  noun: string;
  step?: number;
  onShowMore: (firstNewIndex: number) => void;
}

export function ShowMore({ shown, total, noun, step = rowsPerPage[0], onShowMore }: ShowMoreProps) {
  const next = Math.min(step, total - shown);
  return (
    <div className="show-more">
      {next > 0 && (
        <Button variant="ghost" size="small" icon="chevron-down" onClick={() => onShowMore(shown)}>
          Show {format.count(next)} more
        </Button>
      )}
      <p role="status">
        Showing {format.count(shown)} of {format.count(total)} {noun}
      </p>
    </div>
  );
}
