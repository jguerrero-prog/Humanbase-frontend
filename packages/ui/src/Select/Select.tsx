import { useCallback, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { Field, type FieldSize } from '../Field/Field';
import { Icon, type IconName } from '../Icon/Icon';
import { ListNavigator } from '../List/ListNavigator';
import { useDismiss } from '../List/useDismiss';
import { MenuGroupLabel, MenuItem, MenuPanel } from '../Menu/Menu';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
  description?: string;
  icon?: IconName;
  image?: string;
  disabled?: boolean;
  group?: string;
}

export interface SelectProps {
  label: string;
  options: readonly SelectOption[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  hint?: string;
  error?: string | undefined;
  size?: FieldSize;
  disabled?: boolean;
  searchable?: boolean;
  filterLabel?: string;
  columns?: readonly (readonly string[])[];
  footer?: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  defaultHighlight?: number;
  defaultQuery?: string;
  name?: string;
  className?: string;
  hideLabel?: boolean;
  triggerIcon?: IconName | undefined;
  'data-state'?: 'hover' | 'focus' | 'open';
}

interface Group {
  name: string | undefined;
  options: SelectOption[];
}

function groupOptions(options: readonly SelectOption[]): Group[] {
  const groups: Group[] = [];
  for (const option of options) {
    const group = groups.find((g) => g.name === option.group) ?? groups[groups.push({ name: option.group, options: [] }) - 1];
    group?.options.push(option);
  }
  return groups;
}

export function Select({
  label, options, value, defaultValue, onChange, placeholder, hint, error, size = 'medium', disabled = false,
  searchable = false, filterLabel = 'Filter', columns, footer, open: openProp, onOpenChange, defaultHighlight = -1, defaultQuery = '', name, className, hideLabel = false, triggerIcon, 'data-state': dataState,
}: SelectProps) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const wrapper = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const filterInput = useRef<HTMLInputElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [ownValue, setOwnValue] = useState(defaultValue);
  const [ownOpen, setOwnOpen] = useState(false);
  const [query, setQuery] = useState(defaultQuery);
  const [highlight, setHighlight] = useState(defaultHighlight);
  const [above, setAbove] = useState(false);
  const current = value ?? ownValue;
  const open = openProp ?? ownOpen;
  const selected = options.find((option) => option.value === current);
  const looksOpen = open || dataState === 'open';
  const reserveIcon = options.some((option) => option.icon || option.image);

  const visible = useMemo(() => {
    const filtered = query ? options.filter((option) => option.label.toLowerCase().includes(query.toLowerCase())) : options;
    const groups = groupOptions(filtered);
    const layout = columns ? columns.map((names) => groups.filter((g) => g.name !== undefined && names.includes(g.name))) : [groups];
    return { layout, flat: layout.flat().flatMap((g) => g.options) };
  }, [options, query, columns]);

  const navigator = useMemo(() => {
    const columnOf = visible.layout.flatMap((column, columnIndex) => column.flatMap((g) => g.options.map(() => columnIndex)));
    const indexes = visible.layout.map((_, columnIndex) => columnOf.flatMap((c, position) => (c === columnIndex ? [position] : [])));
    return new ListNavigator(visible.flat, indexes);
  }, [visible]);

  const setOpen = useCallback((next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
    if (!next) setQuery('');
  }, [onOpenChange]);

  const close = useCallback(() => setOpen(false), [setOpen]);
  useDismiss(wrapper, open && openProp === undefined, close);

  useLayoutEffect(() => {
    if (!open || !panel.current || !wrapper.current) return;
    const room = window.innerHeight - wrapper.current.getBoundingClientRect().bottom;
    setAbove(room < panel.current.offsetHeight + 4 && wrapper.current.getBoundingClientRect().top > room);
    if (searchable && openProp === undefined) filterInput.current?.focus();
  }, [open, searchable, openProp]);

  const openList = () => {
    if (disabled) return;
    const index = visible.flat.findIndex((option) => option.value === current);
    setHighlight(index >= 0 ? index : navigator.first());
    setOpen(true);
  };

  const choose = (option: SelectOption | undefined) => {
    if (!option || option.disabled) return;
    setOwnValue(option.value);
    onChange?.(option.value);
    setOpen(false);
    trigger.current?.focus();
  };

  const handleKeys = (event: KeyboardEvent) => {
    const typing = event.target === filterInput.current;
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(event.key)) {
        event.preventDefault();
        openList();
      }
      return;
    }
    const moves: Record<string, () => number> = {
      ArrowDown: () => navigator.next(highlight),
      ArrowUp: () => navigator.previous(highlight),
      Home: () => navigator.first(),
      End: () => navigator.last(),
      ArrowRight: () => navigator.sideways(highlight, 1),
      ArrowLeft: () => navigator.sideways(highlight, -1),
    };
    const move = typing && (event.key === 'ArrowLeft' || event.key === 'ArrowRight') ? undefined : moves[event.key];
    if (move) {
      event.preventDefault();
      setHighlight(move());
    } else if (event.key === 'Enter' || (event.key === ' ' && !typing)) {
      event.preventDefault();
      choose(visible.flat[highlight]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
      trigger.current?.focus();
    } else if (event.key === 'Tab') {
      close();
    } else if (!typing && event.key.length === 1) {
      setHighlight(navigator.typeAhead(highlight, event.key));
    }
  };

  const optionId = (index: number) => `${id}-option-${index}`;
  const activeId = open && highlight >= 0 ? optionId(highlight) : undefined;

  return (
    <Field label={label} hint={hint} error={error} size={size} disabled={disabled} hideLabel={hideLabel}>
      {(control) => (
        <div ref={wrapper} className={['select', `select-${size}`, className].filter(Boolean).join(' ')}>
          <button
            {...control}
            ref={trigger}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={open}
            aria-controls={open ? listboxId : undefined}
            aria-activedescendant={searchable ? undefined : activeId}
            disabled={disabled}
            data-state={dataState}
            className="field-control select-trigger"
            onClick={() => (open ? close() : openList())}
            onKeyDown={handleKeys}
          >
            {triggerIcon && <Icon name={triggerIcon} size={24} className="select-trigger-icon" />}
            <span className={selected ? 'select-value' : 'select-placeholder'}>{selected?.label ?? placeholder}</span>
            <Icon name={looksOpen ? 'chevron-up' : 'chevron-down'} size={size === 'small' ? 16 : 20} />
          </button>
          {name && <input type="hidden" name={name} value={current ?? ''} />}
          {open && (
            <MenuPanel ref={panel} className={['select-panel', above && 'select-panel-above', columns && 'select-panel-columns'].filter(Boolean).join(' ')}>
              {searchable && (
                <div className="select-filter">
                  <Icon name="search" size={16} />
                  <input
                    ref={filterInput}
                    type="text"
                    role="combobox"
                    aria-label={filterLabel}
                    aria-autocomplete="list"
                    aria-expanded="true"
                    aria-controls={listboxId}
                    aria-activedescendant={activeId}
                    value={query}
                    onKeyDown={handleKeys}
                    onChange={(event) => {
                      setQuery(event.target.value);
                      setHighlight(0);
                    }}
                  />
                </div>
              )}
              <div id={listboxId} role="listbox" aria-label={label} className="menu-list select-listbox" style={columns ? ({ '--select-columns': columns.length } as CSSProperties) : undefined}>
                {visible.layout.map((column, columnIndex) => (
                  <div key={columnIndex} className="select-column">
                    {column.map((group, groupIndex) => {
                      const groupId = `${id}-group-${columnIndex}-${groupIndex}`;
                      return (
                        <div
                          key={groupId}
                          role={group.name ? 'group' : undefined}
                          aria-labelledby={group.name ? groupId : undefined}
                          className={groupIndex > 0 ? 'select-group-divided' : undefined}
                        >
                          {group.name && <MenuGroupLabel id={groupId}>{group.name}</MenuGroupLabel>}
                          {group.options.map((option) => {
                            const position = visible.flat.indexOf(option);
                            return (
                              <MenuItem
                                key={option.value}
                                id={optionId(position)}
                                role="option"
                                tabIndex={-1}
                                aria-selected={option.value === current}
                                label={option.label}
                                description={option.description}
                                icon={option.icon}
                                image={option.image}
                                reserveIcon={reserveIcon}
                                disabled={option.disabled}
                                selected={option.value === current}
                                highlighted={position === highlight}
                                onPointerDown={(event) => event.preventDefault()}
                                onClick={() => choose(option)}
                                onPointerEnter={() => !option.disabled && setHighlight(position)}
                              />
                            );
                          })}
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
              {searchable && (
                <p className="visually-hidden" aria-live="polite">
                  {visible.flat.length === 1 ? '1 match' : `${visible.flat.length} matches`}
                </p>
              )}
              {footer && <div className="select-footer">{footer}</div>}
            </MenuPanel>
          )}
        </div>
      )}
    </Field>
  );
}
