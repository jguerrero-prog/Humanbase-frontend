import type { NavLink, NavSection } from './types';

export const sectionHasImages = (section: NavSection) => section.columns?.flat().some((group) => group.links.some((link) => link.image)) ?? false;

/** A menu link's icon, label and description; links without an icon keep its space when others in the list have one. */
export function NavLinkContent({ link, reserveImage }: { link: NavLink; reserveImage: boolean }) {
  return (
    <>
      {link.image ? <img className="nav-menu-link-image" src={link.image} alt="" width={20} height={20} /> : reserveImage && <span className="nav-menu-link-image" aria-hidden="true" />}
      <span className="nav-menu-link-text">
        <span className="nav-menu-link-label">{link.label}</span>
        {link.description && <span className="nav-menu-link-description">{link.description}</span>}
      </span>
    </>
  );
}
