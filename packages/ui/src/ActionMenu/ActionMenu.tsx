import { Fragment, useCallback, useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { Icon, type IconName } from '../Icon/Icon';
import { ListNavigator } from '../List/ListNavigator';
import { useDismiss } from '../List/useDismiss';
import { MenuDivider, MenuItem, MenuPanel } from '../Menu/Menu';
import './ActionMenu.css';

export interface ActionMenuItem {
  label: string;
  icon?: IconName;
  destructive?: boolean;
  disabled?: boolean;
  dividerBefore?: boolean;
  onSelect?: () => void;
}

export interface ActionMenuProps {
  label: string;
  items: readonly ActionMenuItem[];
  open?: boolean;
  defaultHighlight?: number;
  className?: string;
}

export function ActionMenu({ label, items, open: openProp, defaultHighlight = -1, className }: ActionMenuProps) {
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const [ownOpen, setOwnOpen] = useState(false);
  const [focused, setFocused] = useState(defaultHighlight);
  const open = openProp ?? ownOpen;
  const navigator = useMemo(() => new ListNavigator(items), [items]);

  const close = useCallback((returnFocus = false) => {
    setOwnOpen(false);
    setFocused(-1);
    if (returnFocus) button.current?.focus();
  }, []);
  const dismiss = useCallback(() => close(), [close]);
  useDismiss(wrapper, open && openProp === undefined, dismiss);

  useEffect(() => {
    if (ownOpen && focused >= 0) itemRefs.current[focused]?.focus();
  }, [ownOpen, focused]);

  const openAt = (index: number) => {
    setOwnOpen(true);
    setFocused(index);
  };

  const run = (item: ActionMenuItem | undefined) => {
    if (!item || item.disabled) return;
    close(true);
    item.onSelect?.();
  };

  const handleButtonKeys = (event: KeyboardEvent) => {
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openAt(navigator.first());
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      openAt(navigator.last());
    }
  };

  const handleMenuKeys = (event: KeyboardEvent) => {
    const moves: Record<string, () => number> = {
      ArrowDown: () => navigator.next(focused),
      ArrowUp: () => navigator.previous(focused),
      Home: () => navigator.first(),
      End: () => navigator.last(),
    };
    const move = moves[event.key];
    if (move) {
      event.preventDefault();
      setFocused(move());
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      run(items[focused]);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close(true);
    } else if (event.key === 'Tab') {
      close();
    } else if (event.key.length === 1) {
      setFocused(navigator.typeAhead(focused, event.key));
    }
  };

  return (
    <div ref={wrapper} className={['action-menu', className].filter(Boolean).join(' ')}>
      <button
        ref={button}
        type="button"
        className="action-menu-button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? `${id}-menu` : undefined}
        onClick={() => (open ? close() : openAt(navigator.first()))}
        onKeyDown={handleButtonKeys}
      >
        <Icon name="more-horizontal" size={20} />
      </button>
      {open && (
        <MenuPanel className="action-menu-panel">
          <div id={`${id}-menu`} role="menu" aria-label={label} tabIndex={-1} className="menu-list" onKeyDown={handleMenuKeys}>
            {items.map((item, index) => (
              <Fragment key={item.label}>
                {item.dividerBefore && <MenuDivider />}
                <MenuItem
                  ref={(element) => {
                    itemRefs.current[index] = element;
                  }}
                  role="menuitem"
                  tabIndex={-1}
                  label={item.label}
                  icon={item.icon}
                  disabled={item.disabled}
                  destructive={item.destructive}
                  highlighted={index === focused}
                  onClick={() => run(item)}
                  onPointerEnter={() => !item.disabled && setFocused(index)}
                />
              </Fragment>
            ))}
          </div>
        </MenuPanel>
      )}
    </div>
  );
}
