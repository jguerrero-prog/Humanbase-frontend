import { Fragment, useId } from 'react';
import { Divider } from '../Divider/Divider';
import { useDisclosureMenu } from '../hooks/useDisclosureMenu';
import { Icon } from '../Icon/Icon';
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
  const { isOpen, root, button, panel, buttonProps, panelProps } = useDisclosureMenu({ open, onOpenChange });

  const ariaCurrent = current ? 'true' : undefined;
  if (!section.columns) {
    return (
      <a className="nav-item" href={linkHref(section.href)} aria-current={ariaCurrent} data-state={dataState}>
        {section.label}
      </a>
    );
  }

  return (
    <div ref={root} className="nav-menu">
      <button ref={button} {...buttonProps} type="button" className="nav-item" aria-current={ariaCurrent} data-state={dataState}>
        {section.label}
        <Icon name={isOpen || dataState === 'open' ? 'chevron-up' : 'chevron-down'} size={16} />
      </button>
      <div ref={panel} {...panelProps} className="nav-menu-panel">
        <NavPanelContent section={section} />
      </div>
    </div>
  );
}

export function NavPanelContent({ section }: { section: NavSection }) {
  const linkHref = useLinkHref();
  return (
    <>
      <div className="nav-menu-columns">
        {section.columns?.map((column, index) => (
          <div key={index} className="nav-menu-column">
            {column.map((group, groupIndex) => (
              <Fragment key={group.label ?? groupIndex}>
                {groupIndex > 0 && <Divider className="nav-menu-divider" />}
                <NavLinkGroup group={group} reserveImage={sectionHasImages(section)} />
              </Fragment>
            ))}
          </div>
        ))}
      </div>
      {section.footer && (
        <p className="nav-menu-footer">
          {section.footer.lead}{' '}
          <a href={linkHref(section.footer.link.href)}>{section.footer.link.label}</a>
        </p>
      )}
    </>
  );
}

function NavLinkGroup({ group, reserveImage }: { group: NavGroup; reserveImage: boolean }) {
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
            <a className="nav-menu-link" href={linkHref(link.href)}>
              <NavLinkContent link={link} reserveImage={reserveImage} />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
