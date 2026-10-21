import { Fragment, useEffect, useId, useRef, type KeyboardEvent } from 'react';
import { useControlled } from '../hooks/useControlled';
import { Icon } from '../Icon/Icon';
import { ListNavigator } from '../List/ListNavigator';
import { NavLinkContent, sectionHasImages } from './NavLinkContent';
import type { NavGroup, NavItemState, NavSection } from './types';
import { useLinkHref } from '../hooks/useLinkHref';

export interface NavMenuProps {
  section: NavSection;
  current?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  'data-state'?: NavItemState;
}

export function NavMenu({ section, current = false, open, onOpenChange, 'data-state': dataState }: NavMenuProps) {
  const linkHref = useLinkHref();
  const id = useId();
  const button = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const focusFirst = useRef(false);
  const [isOpen, setOwnOpen] = useControlled(open, false);
  const setOpen = (next: boolean) => {
    setOwnOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (isOpen && focusFirst.current) panel.current?.querySelector('a')?.focus();
    focusFirst.current = false;
  }, [isOpen]);

  const ariaCurrent = current ? 'true' : undefined;
  if (!section.columns) {
    return (
      <a className="nav-item" href={linkHref(section.href)} aria-current={ariaCurrent} data-state={dataState}>
        {section.label}
      </a>
    );
  }

  const openFromKeyboard = (event: KeyboardEvent) => {
    if (event.key !== 'ArrowDown') return;
    event.preventDefault();
    focusFirst.current = true;
    setOpen(true);
  };

  const moveInPanel = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      setOpen(false);
      button.current?.focus();
      return;
    }
    const links = [...(panel.current?.querySelectorAll('a') ?? [])];
    const navigator = new ListNavigator(links.map((link) => ({ label: link.textContent ?? '' })));
    const from = links.indexOf(document.activeElement as HTMLAnchorElement);
    const moves: Record<string, () => number> = {
      ArrowDown: () => navigator.next(from),
      ArrowUp: () => navigator.previous(from),
      Home: () => navigator.first(),
      End: () => navigator.last(),
    };
    const move = moves[event.key];
    if (!move) return;
    event.preventDefault();
    links[move()]?.focus();
  };

  return (
    <div className="nav-menu">
      <button
        ref={button}
        type="button"
        className="nav-item"
        aria-expanded={isOpen}
        aria-controls={`${id}-panel`}
        aria-current={ariaCurrent}
        data-state={dataState}
        onClick={() => setOpen(!isOpen)}
        onKeyDown={openFromKeyboard}
      >
        {section.label}
        <Icon name={isOpen || dataState === 'open' ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>
      <div ref={panel} id={`${id}-panel`} className="nav-menu-panel" hidden={!isOpen}>
        <NavPanelContent section={section} onLinkKeyDown={moveInPanel} />
      </div>
    </div>
  );
}

interface NavPanelContentProps {
  section: NavSection;
  onLinkKeyDown?: ((event: KeyboardEvent) => void) | undefined;
}

export function NavPanelContent({ section, onLinkKeyDown }: NavPanelContentProps) {
  const linkHref = useLinkHref();
  return (
    <>
      <div className="nav-menu-columns">
        {section.columns?.map((column, index) => (
          <div key={index} className="nav-menu-column">
            {column.map((group, groupIndex) => (
              <Fragment key={group.label ?? groupIndex}>
                {groupIndex > 0 && <hr className="nav-menu-divider" />}
                <NavLinkGroup group={group} reserveImage={sectionHasImages(section)} onLinkKeyDown={onLinkKeyDown} />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
      {section.footer && (
        <p className="nav-menu-footer">
          {section.footer.lead}{' '}
          <a href={linkHref(section.footer.link.href)} onKeyDown={onLinkKeyDown}>{section.footer.link.label}</a>
        </p>
      )}
    </>
  );
}

function NavLinkGroup({ group, reserveImage, onLinkKeyDown }: { group: NavGroup; reserveImage: boolean; onLinkKeyDown: NavPanelContentProps['onLinkKeyDown'] }) {
  const linkHref = useLinkHref();
  const id = useId();
  return (
    <div className="nav-menu-group">
      {group.label && (
        <p id={id} className="nav-menu-group-label">
          {group.label}
        </p>
      )}
      <ul aria-labelledby={group.label ? id : undefined}>
        {group.links.map((link) => (
          <li key={link.href}>
            <a className="nav-menu-link" href={linkHref(link.href)} onKeyDown={onLinkKeyDown}>
              <NavLinkContent link={link} reserveImage={reserveImage} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
