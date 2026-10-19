import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent, type ReactNode, type RefObject } from 'react';
import { Badge } from '../Badge/Badge';
import { useControlled } from '../hooks/useControlled';
import { ListNavigator } from '../List/ListNavigator';
import './Tabs.css';

export interface TabItem {
  value: string;
  label: string;
  count?: number | string;
  disabled?: boolean;
  'data-state'?: 'hover' | 'focus';
}

export interface TabsProps {
  label: string;
  tabs: readonly TabItem[];
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  children?: ReactNode;
  className?: string;
}

function useMoreToScroll(scroller: RefObject<HTMLDivElement | null>) {
  const [more, setMore] = useState(false);
  useEffect(() => {
    const element = scroller.current;
    if (!element || typeof ResizeObserver === 'undefined') return;
    const measure = () => setMore(element.scrollLeft + element.clientWidth < element.scrollWidth - 1);
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    element.addEventListener('scroll', measure, { passive: true });
    return () => {
      observer.disconnect();
      element.removeEventListener('scroll', measure);
    };
  }, [scroller]);
  return more;
}

export function Tabs({ label, tabs, value, defaultValue, onChange, children, className }: TabsProps) {
  const id = useId();
  const scroller = useRef<HTMLDivElement>(null);
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const navigator = useMemo(() => new ListNavigator(tabs), [tabs]);
  const [selected, setSelected] = useControlled(value, defaultValue ?? tabs[navigator.first()]?.value ?? '');
  const selectedIndex = tabs.findIndex((tab) => tab.value === selected);
  const more = useMoreToScroll(scroller);

  useEffect(() => {
    const tab = tabRefs.current[selectedIndex];
    const list = scroller.current;
    if (!tab || !list) return;
    const end = tab.offsetLeft + tab.offsetWidth;
    if (tab.offsetLeft < list.scrollLeft || end > list.scrollLeft + list.clientWidth) list.scrollLeft = tab.offsetLeft;
  }, [selectedIndex]);

  const choose = (index: number) => {
    const tab = tabs[index];
    if (!tab || tab.disabled) return;
    tabRefs.current[index]?.focus();
    setSelected(tab.value);
    onChange?.(tab.value);
  };

  const handleKeys = (event: KeyboardEvent) => {
    const moves: Record<string, () => number> = {
      ArrowRight: () => navigator.next(selectedIndex),
      ArrowLeft: () => navigator.previous(selectedIndex),
      Home: () => navigator.first(),
      End: () => navigator.last(),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    choose(move());
  };

  const panelId = `${id}-panel`;
  const tabId = (index: number) => `${id}-tab-${index}`;

  return (
    <div className={['tabs', className].filter(Boolean).join(' ')} data-more={more || undefined}>
      <div ref={scroller} className="tabs-scroller">
        <div role="tablist" aria-label={label} className="tabs-list">
          {tabs.map((tab, index) => {
            const isSelected = index === selectedIndex;
            const inTabOrder = index === (selectedIndex >= 0 ? selectedIndex : navigator.first());
            return (
              <button
                key={tab.value}
                ref={(element) => {
                  tabRefs.current[index] = element;
                }}
                id={tabId(index)}
                type="button"
                role="tab"
                className="tab"
                aria-selected={isSelected}
                aria-controls={children === undefined ? undefined : panelId}
                tabIndex={inTabOrder ? 0 : -1}
                disabled={tab.disabled}
                data-state={tab['data-state']}
                onClick={() => choose(index)}
                onKeyDown={handleKeys}
              >
                {tab.label}
                {tab.count !== undefined && (
                  <>
                    {' '}
                    <Badge tone="count" size="small" className="tab-count">
                      {tab.count}
                    </Badge>
                  </>
                )}
              </button>
            );
          })}
        </div>
      </div>
      {children !== undefined && (
        // The panel takes focus so Tab reaches it even when it holds only text (ARIA tabs pattern).
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        <div id={panelId} role="tabpanel" aria-labelledby={tabId(selectedIndex)} tabIndex={0} className="tabs-panel">
          {children}
        </div>
      )}
    </div>
  );
}
