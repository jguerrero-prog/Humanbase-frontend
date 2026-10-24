import { Fragment, useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent } from 'react';
import { Button } from '../Button/Button';
import { Icon, type IconName } from '../Icon/Icon';
import { ListNavigator } from '../List/ListNavigator';
import { useDismiss } from '../List/useDismiss';
import { MenuDivider, MenuItem, MenuPanel } from '../Menu/Menu';
import { anchorSupported, placeUnder } from '../Tooltip/placement';
import './ActionMenu.css';

export interface ActionMenuItem {
  label: string;
  description?: string;
  icon?: IconName;
  /** A color token, such as `--viz-cat-1`, shown as a dot in place of an icon. */
  swatch?: string;
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
  size?: 'medium' | 'small';
  /** `text` shows the label on a ghost button instead of the more icon. */
  trigger?: 'icon' | 'text';
  /** The icon trigger's icon; the more icon by default. */
  icon?: IconName;
  className?: string;
}

export function ActionMenu({ label, items, open: openProp, defaultHighlight = -1, size = 'medium', trigger = 'icon', icon = 'more-horizontal', className }: ActionMenuProps) {
  const id = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const panel = useRef<HTMLDivElement>(null);
  const anchor = `--action-menu-${id.replace(/[^\w-]/g, '')}`;
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

  // The menu opens in the top layer, so a scrolling or clipped container, such as a genome track's header, never cuts it off.
  useLayoutEffect(() => {
    const node = panel.current;
    if (!ownOpen || !node) return;
    node.showPopover();
    if (!anchorSupported && button.current) placeUnder(node, button.current);
  }, [ownOpen]);

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

  const buttonProps = {
    'aria-haspopup': 'menu',
    'aria-expanded': open,
    'aria-controls': open ? `${id}-menu` : undefined,
    onClick: () => (open ? close() : openAt(navigator.first())),
    onKeyDown: handleButtonKeys,
    style: { anchorName: anchor } as CSSProperties,
  } as const;

  return (
    <div ref={wrapper} className={['action-menu', size === 'small' && 'action-menu-small', className].filter(Boolean).join(' ')}>
      {trigger === 'text' ? (
        <Button ref={button} variant="ghost" size={size} {...buttonProps}>
          {label}
        </Button>
      ) : (
        <button ref={button} type="button" className="action-menu-button" aria-label={label} {...buttonProps}>
          <Icon name={icon} size={size === 'small' ? 16 : 20} />
        </button>
      )}
      {open && (
        <MenuPanel ref={panel} className="action-menu-panel" popover={openProp === undefined ? 'manual' : undefined} style={{ positionAnchor: anchor } as CSSProperties}>
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
                  description={item.description}
                  icon={item.icon}
                  swatch={item.swatch}
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
