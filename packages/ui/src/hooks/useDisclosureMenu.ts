import { useCallback, useEffect, useId, useRef, type KeyboardEvent, type MouseEvent } from 'react';
import { ListNavigator } from '../List/ListNavigator';
import { useDismiss } from '../List/useDismiss';
import { useControlled } from './useControlled';

export interface DisclosureMenuOptions {
  open?: boolean | undefined;
  onOpenChange?: ((open: boolean) => void) | undefined;
}

type Edge = 'first' | 'last';

const linksIn = (panel: HTMLElement | null) => [...(panel?.querySelectorAll<HTMLElement>('a[href], button:not(:disabled)') ?? [])];

function focusEdge(panel: HTMLElement | null, edge: Edge) {
  const items = linksIn(panel);
  items[edge === 'first' ? 0 : items.length - 1]?.focus();
}

/**
 * A button that shows a panel of links: click or Down and Up Arrow open it, arrow keys, Home and End move
 * between its links, and Escape, a click or focus outside close it, Escape returning focus to the button.
 */
export function useDisclosureMenu({ open, onOpenChange }: DisclosureMenuOptions = {}) {
  const panelId = `${useId()}-panel`;
  const root = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusOnOpen = useRef<Edge | null>(null);
  const [isOpen, setOwnOpen] = useControlled(open, false);

  const setOpen = useCallback(
    (next: boolean) => {
      setOwnOpen(next);
      onOpenChange?.(next);
    },
    [setOwnOpen, onOpenChange],
  );
  const close = useCallback(() => setOpen(false), [setOpen]);
  useDismiss(root, isOpen, close);

  useEffect(() => {
    if (isOpen && focusOnOpen.current) focusEdge(panel.current, focusOnOpen.current);
    focusOnOpen.current = null;
  }, [isOpen]);

  const closeToButton = (event: KeyboardEvent) => {
    event.preventDefault();
    close();
    button.current?.focus();
  };

  const onButtonKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape' && isOpen) return closeToButton(event);
    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
    event.preventDefault();
    const edge = event.key === 'ArrowDown' ? 'first' : 'last';
    if (isOpen) return focusEdge(panel.current, edge);
    focusOnOpen.current = edge;
    setOpen(true);
  };

  // A click from Enter or Space (detail 0) also moves focus into the menu, as Down Arrow does.
  const openOnClick = (fromKeyboard: boolean) => {
    if (!isOpen && fromKeyboard) focusOnOpen.current = 'first';
    setOpen(!isOpen);
  };

  const onPanelKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') return closeToButton(event);
    const items = linksIn(panel.current);
    const navigator = new ListNavigator(items.map((item) => ({ label: item.textContent ?? '' })));
    const from = items.indexOf(document.activeElement as HTMLElement);
    const moves: Record<string, () => number> = {
      ArrowDown: () => navigator.next(from),
      ArrowUp: () => navigator.previous(from),
      Home: () => navigator.first(),
      End: () => navigator.last(),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    items[move()]?.focus();
  };

  return {
    isOpen,
    root,
    button,
    panel,
    buttonProps: { 'aria-expanded': isOpen, 'aria-controls': panelId, onClick: (event: MouseEvent) => openOnClick(event.detail === 0), onKeyDown: onButtonKeyDown },
    panelProps: { id: panelId, hidden: !isOpen, onKeyDown: onPanelKeyDown },
  };
}
